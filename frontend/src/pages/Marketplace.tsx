import { createSignal, createResource, For, Show, onCleanup } from "solid-js";
import { useGame, getSettlementId } from "~/engine/gameState";
import { fetchTradeOffers, fetchOwnTrades, createTradeOffer, acceptTradeOffer, cancelTradeOffer } from "~/api/trades";
import type { TradeOfferInfo, CaravanInfo, TradeResourceKey } from "@medieval-realm/shared";

// ─── Resource types ─────────────────────────────────────────────

const RES: Record<TradeResourceKey, { icon: string; name: string }> = {
  gold:  { icon: "🪙", name: "Gold" },
  wood:  { icon: "🪵", name: "Wood" },
  stone: { icon: "🪨", name: "Stone" },
  food:  { icon: "🍖", name: "Food" },
  iron:  { icon: "⛏️", name: "Iron" },
  wool:  { icon: "🐑", name: "Wool" },
  fiber: { icon: "🧵", name: "Fiber" },
  ale:   { icon: "🍺", name: "Ale" },
  honey: { icon: "🍯", name: "Honey" },
  fruit: { icon: "🍎", name: "Fruit" },
};
const RES_KEYS = Object.keys(RES) as TradeResourceKey[];

// ─── Merchant trade generation (client-side, tier-aware) ────────
import type { SettlementTier } from "~/data/buildings";
import { getSettlementTier } from "~/data/buildings";

interface MerchantOffer {
  id: string;
  give: TradeResourceKey;
  giveAmount: number;
  receive: TradeResourceKey;
  receiveAmount: number;
}

// Resources available per tier + amount scaling
const TIER_RESOURCES: Record<SettlementTier, TradeResourceKey[]> = {
  camp:    ["gold", "wood", "stone", "food"],
  village: ["gold", "wood", "stone", "food", "iron", "wool", "ale"],
  town:    ["gold", "wood", "stone", "food", "iron", "wool", "fiber", "ale", "honey"],
  city:    RES_KEYS,
};
const TIER_SCALE: Record<SettlementTier, { min: number; max: number }> = {
  camp:    { min: 10, max: 40 },
  village: { min: 15, max: 60 },
  town:    { min: 20, max: 100 },
  city:    { min: 30, max: 150 },
};
// Fair exchange ratios: how much "value" 1 unit of each resource is worth
const RES_VALUE: Record<TradeResourceKey, number> = {
  gold: 3, wood: 1, stone: 1.2, food: 0.8, iron: 2.5, wool: 2, fiber: 2, ale: 3, honey: 3, fruit: 1.5,
};

function generateMerchantOffers(seed: number, count: number, tier: SettlementTier): MerchantOffer[] {
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
  const pool = TIER_RESOURCES[tier];
  const scale = TIER_SCALE[tier];
  const offers: MerchantOffer[] = [];
  for (let i = 0; i < count; i++) {
    const giveIdx = Math.floor(rng() * pool.length);
    let recIdx = Math.floor(rng() * (pool.length - 1));
    if (recIdx >= giveIdx) recIdx++;
    const give = pool[giveIdx];
    const receive = pool[recIdx];
    // Generate give amount, then compute receive based on value ratio (±15% merchant margin)
    const giveAmount = Math.round((scale.min + rng() * (scale.max - scale.min)) / 5) * 5;
    const fairReceive = (giveAmount * RES_VALUE[give]) / RES_VALUE[receive];
    const margin = 0.85 + rng() * 0.3; // 0.85–1.15 (sometimes good deal, sometimes bad)
    const receiveAmount = Math.max(5, Math.round(fairReceive * margin / 5) * 5);
    offers.push({ id: `m_${i}`, give, giveAmount, receive, receiveAmount });
  }
  return offers;
}

// ─── Constants ──────────────────────────────────────────────────
const MERCHANT_COUNT = 4;

function travelTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Shared styles ──────────────────────────────────────────────
const selectStyle = {
  padding: "6px 10px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
  "border-radius": "4px", color: "var(--text-primary)", "font-size": "0.85rem", width: "100%",
};
const numberInputStyle = { ...selectStyle, width: "100%" };
const sectionHeaderStyle = {
  "font-size": "0.75rem", color: "var(--text-muted)", "margin-bottom": "8px",
  "text-transform": "uppercase" as const, "letter-spacing": "1px", "font-weight": "bold" as const,
};
const confirmBoxStyle = {
  padding: "12px 14px", "margin-bottom": "12px", "border-radius": "8px",
  background: "rgba(245, 197, 66, 0.1)", border: "2px solid var(--accent-gold)", "text-align": "center" as const,
};
const goldBtnStyle = {
  padding: "6px 16px", background: "var(--accent-gold)", color: "#1a1a1a",
  border: "none", "border-radius": "4px", cursor: "pointer", "font-weight": "bold" as const,
};
const mutedBtnStyle = {
  padding: "6px 16px", background: "none", color: "var(--text-muted)",
  border: "1px solid var(--border-color)", "border-radius": "4px", cursor: "pointer",
};
const cardStyle = {
  padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)",
  "border-radius": "6px", "margin-bottom": "8px",
};

// ═════════════════════════════════════════════════════════════════
export default function Marketplace() {
  const { state, actions } = useGame();
  const [now, setNow] = createSignal(Date.now());
  const tickTimer = setInterval(() => setNow(Date.now()), 1000);
  onCleanup(() => clearInterval(tickTimer));

  const marketLevel = () => state.buildings.find((b) => b.buildingId === "marketplace")?.level ?? 0;
  const isBuilt = () => marketLevel() > 0;
  const townHallLvl = () => state.buildings.find((b) => b.buildingId === "town_hall")?.level ?? 1;
  const tier = () => getSettlementTier(townHallLvl());

  // ── Merchant offers (client-side, random, refreshable) ──
  const [merchantSeed, setMerchantSeed] = createSignal(Math.floor(Date.now() / 86400000));
  const [merchantRefreshCount, setMerchantRefreshCount] = createSignal(0);
  const [takenMerchantIds, setTakenMerchantIds] = createSignal<Set<string>>(new Set());
  const merchantOffers = () => generateMerchantOffers(merchantSeed(), MERCHANT_COUNT, tier()).filter((o) => !takenMerchantIds().has(o.id));
  const merchantRefreshCost = () => 10 * Math.pow(2, merchantRefreshCount());

  const refreshMerchants = () => {
    const cost = merchantRefreshCost();
    if (state.astralShards < cost) return;
    setMerchantSeed((s) => s + 1);
    setMerchantRefreshCount((c) => c + 1);
    setTakenMerchantIds(new Set<string>());
  };

  const [pendingMerchant, setPendingMerchant] = createSignal<MerchantOffer | null>(null);
  const confirmMerchant = () => {
    const m = pendingMerchant();
    if (!m) return;
    setTakenMerchantIds((s) => { const next = new Set(s); next.add(m.id); return next; });
    setPendingMerchant(null);
  };

  // ── Player offers (from API) ──
  const settId = () => getSettlementId();
  const [playerOffers, { refetch: refetchOffers }] = createResource(
    settId,
    (id) => id ? fetchTradeOffers(id).then((r) => r.offers) : Promise.resolve([]),
  );
  const [ownData, { refetch: refetchOwn }] = createResource(
    settId,
    (id) => id ? fetchOwnTrades(id) : Promise.resolve({ offers: [], caravans: [], activeCount: 0, maxOffers: 2 }),
  );

  // Poll every 30s
  const pollTimer = setInterval(() => { refetchOffers(); refetchOwn(); }, 30_000);
  onCleanup(() => clearInterval(pollTimer));

  const ownOffers = () => ownData()?.offers ?? [];
  const caravans = () => ownData()?.caravans ?? [];
  const activeOwnCount = () => ownData()?.activeCount ?? 0;
  const maxOffers = () => ownData()?.maxOffers ?? 2;
  const canPostOffer = () => activeOwnCount() < maxOffers();
  const pendingOffers = () => ownOffers().filter((o) => o.status === "open");

  // Accept
  const [pendingAccept, setPendingAccept] = createSignal<TradeOfferInfo | null>(null);
  const acceptOffer = async () => {
    const offer = pendingAccept();
    const sid = settId();
    if (!offer || !sid) return;
    try {
      await acceptTradeOffer(offer.id, { settlementId: sid });
      refetchOffers();
      refetchOwn();
    } catch (e: any) {
      console.error("Accept failed:", e.message);
    }
    setPendingAccept(null);
  };

  // Cancel
  const handleCancel = async (id: string) => {
    try {
      await cancelTradeOffer(id);
      refetchOwn();
    } catch (e: any) {
      console.error("Cancel failed:", e.message);
    }
  };

  // Post offer form
  const [postGive, setPostGive] = createSignal<TradeResourceKey>("wood");
  const [postGiveAmt, setPostGiveAmt] = createSignal(10);
  const [postReceive, setPostReceive] = createSignal<TradeResourceKey>("stone");
  const [postReceiveAmt, setPostReceiveAmt] = createSignal(10);

  const handlePost = async () => {
    const sid = settId();
    if (!sid || postGive() === postReceive() || !canPostOffer() || postGiveAmt() < 1 || postReceiveAmt() < 1) return;
    try {
      await createTradeOffer({
        settlementId: sid,
        giveResource: postGive(),
        giveAmount: postGiveAmt(),
        receiveResource: postReceive(),
        receiveAmount: postReceiveAmt(),
      });
      setPostGiveAmt(10);
      setPostReceiveAmt(10);
      refetchOwn();
    } catch (e: any) {
      console.error("Post failed:", e.message);
    }
  };

  // ETA formatter
  const formatEta = (isoStr: string) => {
    const sec = Math.max(0, Math.ceil((new Date(isoStr).getTime() - now()) / 1000));
    if (sec <= 0) return "Arrived!";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };
  const hasArrived = (isoStr: string) => new Date(isoStr).getTime() <= now();

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div>
      <h1 class="page-title">Marketplace</h1>

      <Show when={!isBuilt()}>
        <div style={{ padding: "40px", "text-align": "center", color: "var(--text-secondary)" }}>
          <div style={{ "font-size": "3rem", "margin-bottom": "12px" }}>🏪</div>
          <p>Build a Marketplace to start trading.</p>
          <a href="/buildings#building-marketplace" style={{ color: "var(--accent-gold)", "margin-top": "8px", display: "inline-block" }}>Go to Buildings →</a>
        </div>
      </Show>

      <Show when={isBuilt()}>
        {/* ════════════ INCOMING CARAVANS ════════════ */}
        <Show when={caravans().length > 0}>
          <div style={{ "margin-bottom": "16px" }}>
            <For each={caravans()}>
              {(caravan) => {
                const ri = RES[caravan.resource];
                const arrived = () => hasArrived(caravan.arrivesAt);
                return (
                  <div class="building-card" style={{ "margin-bottom": "8px" }}>
                    <div class="building-card-header">
                      <div class="building-card-icon">🐴</div>
                      <div>
                        <div class="building-card-title">Caravan from {caravan.fromSettlementName}</div>
                        <div style={{ color: "#7eb8da", "font-size": "0.85rem" }}>
                          {arrived() ? "Arrived!" : `${formatEta(caravan.arrivesAt)} remaining`}
                        </div>
                      </div>
                    </div>
                    <div style={{ "font-size": "0.8rem", "margin-top": "4px", display: "flex", gap: "6px", "align-items": "center" }}>
                      <span style={{ color: "var(--accent-green)" }}>{ri.icon} +{caravan.amount} {ri.name}</span>
                      <span style={{ "margin-left": "auto", color: arrived() ? "var(--accent-green)" : "#7eb8da" }}>
                        {arrived() ? "Ready to collect" : "En route"}
                      </span>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>

        {/* ════════════ MARKETPLACE INFO BAR ════════════ */}
        <div style={{
          "margin-bottom": "16px", padding: "8px 12px", background: "var(--bg-secondary)",
          "border-radius": "6px", "font-size": "0.85rem", color: "var(--text-secondary)",
          display: "flex", "justify-content": "space-between", "flex-wrap": "wrap", gap: "8px",
        }}>
          <span>Marketplace Lv.{marketLevel()}</span>
          <span>Trade slots: {activeOwnCount()}/{maxOffers()}</span>
        </div>

        {/* ════════════ CONFIRMATION DIALOGS ════════════ */}
        <Show when={pendingMerchant()}>
          {(m) => {
            const gi = RES[m().give]; const ri = RES[m().receive];
            return (
              <div style={confirmBoxStyle}>
                <div style={{ "font-size": "0.95rem", color: "var(--text-primary)", "margin-bottom": "10px" }}>
                  Trade {gi.icon} <strong style={{ color: "var(--accent-red)" }}>{m().giveAmount} {gi.name}</strong> for {ri.icon} <strong style={{ color: "var(--accent-green)" }}>{m().receiveAmount} {ri.name}</strong>?
                </div>
                <div style={{ display: "flex", gap: "8px", "justify-content": "center" }}>
                  <button style={goldBtnStyle} onClick={confirmMerchant}>Confirm</button>
                  <button style={mutedBtnStyle} onClick={() => setPendingMerchant(null)}>Cancel</button>
                </div>
              </div>
            );
          }}
        </Show>

        <Show when={pendingAccept()}>
          {(offer) => {
            const gi = RES[offer().giveResource]; const ri = RES[offer().receiveResource];
            return (
              <div style={confirmBoxStyle}>
                <div style={{ "font-size": "0.95rem", color: "var(--text-primary)", "margin-bottom": "4px" }}>
                  Accept trade from <strong>{offer().sellerSettlementName}</strong>?
                </div>
                <div style={{ "font-size": "0.85rem", color: "var(--text-secondary)", "margin-bottom": "10px" }}>
                  You send {ri.icon} <strong style={{ color: "var(--accent-red)" }}>{offer().receiveAmount} {ri.name}</strong>, receive {gi.icon} <strong style={{ color: "var(--accent-green)" }}>{offer().giveAmount} {gi.name}</strong> in {travelTimeStr(offer().travelMinutes)}
                </div>
                <div style={{ display: "flex", gap: "8px", "justify-content": "center" }}>
                  <button style={goldBtnStyle} onClick={acceptOffer}>Accept</button>
                  <button style={mutedBtnStyle} onClick={() => setPendingAccept(null)}>Cancel</button>
                </div>
              </div>
            );
          }}
        </Show>

        {/* ════════════ 3-COLUMN LAYOUT ════════════ */}
        <div style={{
          display: "grid",
          "grid-template-columns": "1fr 1.2fr 1fr",
          gap: "16px",
          "align-items": "start",
        }}>

          {/* ── LEFT: Merchant Offers ── */}
          <div>
            <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "8px" }}>
              <div style={sectionHeaderStyle}>Merchant Offers</div>
              {(() => {
                const cost = merchantRefreshCost();
                const canAfford = state.astralShards >= cost;
                return (
                  <button
                    onClick={refreshMerchants}
                    disabled={!canAfford}
                    style={{
                      padding: "3px 10px",
                      background: canAfford ? "rgba(167, 139, 250, 0.2)" : "var(--bg-secondary)",
                      border: `1px solid ${canAfford ? "#a78bfa" : "var(--border-color)"}`,
                      color: canAfford ? "#a78bfa" : "var(--text-muted)",
                      "border-radius": "4px",
                      cursor: canAfford ? "pointer" : "default",
                      "font-size": "0.7rem",
                    }}
                  >
                    Reroll ({cost} 💠)
                  </button>
                );
              })()}
            </div>

            <Show when={merchantOffers().length === 0}>
              <div style={{ padding: "16px", "text-align": "center", color: "var(--text-muted)", "font-size": "0.85rem" }}>
                All merchant offers taken. Refresh for new ones.
              </div>
            </Show>

            <For each={merchantOffers()}>
              {(offer) => {
                const gi = RES[offer.give]; const ri = RES[offer.receive];
                return (
                  <div style={cardStyle}>
                    <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-bottom": "6px" }}>🧳 Travelling Merchant</div>
                    <div style={{ display: "flex", "align-items": "center", gap: "6px", "font-size": "0.85rem", "margin-bottom": "8px" }}>
                      <span style={{ color: "var(--accent-red)" }}>{gi.icon} {offer.giveAmount} {gi.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>→</span>
                      <span style={{ color: "var(--accent-green)" }}>{ri.icon} {offer.receiveAmount} {ri.name}</span>
                    </div>
                    <button
                      class="trade-btn"
                      style={{ width: "100%", padding: "5px" }}
                      onClick={() => setPendingMerchant(offer)}
                    >
                      Trade
                    </button>
                  </div>
                );
              }}
            </For>
          </div>

          {/* ── CENTER: Player Offers ── */}
          <div>
            <div style={sectionHeaderStyle}>Player Offers</div>

            <Show when={playerOffers.loading}>
              <div style={{ padding: "16px", "text-align": "center", color: "var(--text-muted)", "font-size": "0.85rem" }}>
                Loading...
              </div>
            </Show>

            <Show when={!playerOffers.loading && (playerOffers() ?? []).length === 0}>
              <div style={{ padding: "16px", "text-align": "center", color: "var(--text-muted)", "font-size": "0.85rem" }}>
                No player offers available.
              </div>
            </Show>

            <For each={playerOffers() ?? []}>
              {(offer) => {
                const gi = RES[offer.giveResource]; const ri = RES[offer.receiveResource];
                return (
                  <div style={cardStyle}>
                    <div style={{ display: "flex", "justify-content": "space-between", "font-size": "0.7rem", color: "var(--text-muted)", "margin-bottom": "6px" }}>
                      <span>🏘️ {offer.sellerSettlementName}</span>
                      <span>{offer.distance} dist · {travelTimeStr(offer.travelMinutes)}</span>
                    </div>
                    <div style={{ display: "flex", "align-items": "center", gap: "6px", "font-size": "0.85rem", "margin-bottom": "4px" }}>
                      <span style={{ color: "var(--accent-green)" }}>{gi.icon} {offer.giveAmount} {gi.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>←→</span>
                      <span style={{ color: "var(--accent-red)" }}>{ri.icon} {offer.receiveAmount} {ri.name}</span>
                    </div>
                    <div style={{ "font-size": "0.65rem", color: "var(--text-muted)", "margin-bottom": "6px" }}>
                      They offer {gi.name} · They want {ri.name}
                    </div>
                    <button
                      class="trade-btn"
                      style={{ width: "100%", padding: "5px" }}
                      onClick={() => setPendingAccept(offer)}
                    >
                      Accept Trade
                    </button>
                  </div>
                );
              }}
            </For>
          </div>

          {/* ── RIGHT: Post Offer + Your Offers ── */}
          <div>
            <div style={sectionHeaderStyle}>Post Offer</div>

            <div style={cardStyle}>
              <div style={{ "margin-bottom": "10px" }}>
                <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-bottom": "4px" }}>You give</div>
                <select style={selectStyle} value={postGive()} onInput={(e) => setPostGive(e.currentTarget.value as TradeResourceKey)}>
                  <For each={Object.entries(RES) as [TradeResourceKey, { icon: string; name: string }][]}>
                    {([key, info]) => <option value={key}>{info.icon} {info.name}</option>}
                  </For>
                </select>
                <input type="number" min={1} style={{ ...numberInputStyle, "margin-top": "4px" }} value={postGiveAmt()} onInput={(e) => setPostGiveAmt(Math.max(1, +e.currentTarget.value))} />
              </div>

              <div style={{ "margin-bottom": "10px" }}>
                <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "margin-bottom": "4px" }}>You receive</div>
                <select style={selectStyle} value={postReceive()} onInput={(e) => setPostReceive(e.currentTarget.value as TradeResourceKey)}>
                  <For each={Object.entries(RES) as [TradeResourceKey, { icon: string; name: string }][]}>
                    {([key, info]) => <option value={key}>{info.icon} {info.name}</option>}
                  </For>
                </select>
                <input type="number" min={1} style={{ ...numberInputStyle, "margin-top": "4px" }} value={postReceiveAmt()} onInput={(e) => setPostReceiveAmt(Math.max(1, +e.currentTarget.value))} />
              </div>

              <Show when={postGive() === postReceive()}>
                <div style={{ "font-size": "0.75rem", color: "var(--accent-red)", "margin-bottom": "6px" }}>
                  Can't trade a resource for itself.
                </div>
              </Show>

              <button
                class="upgrade-btn"
                style={{ width: "100%", "font-size": "0.85rem" }}
                disabled={!canPostOffer() || postGive() === postReceive() || postGiveAmt() < 1 || postReceiveAmt() < 1}
                onClick={handlePost}
              >
                Post Offer ({activeOwnCount()}/{maxOffers()})
              </button>

              <Show when={!canPostOffer()}>
                <div style={{ "font-size": "0.7rem", color: "var(--accent-gold)", "margin-top": "6px", "text-align": "center" }}>
                  All slots in use. Upgrade Marketplace for more.
                </div>
              </Show>
            </div>

            {/* ── Your pending offers ── */}
            <Show when={pendingOffers().length > 0}>
              <div style={{ ...sectionHeaderStyle, "margin-top": "16px" }}>Your Offers</div>
              <For each={pendingOffers()}>
                {(offer) => {
                  const gi = RES[offer.giveResource]; const ri = RES[offer.receiveResource];
                  return (
                    <div style={{ ...cardStyle, display: "flex", "align-items": "center", "justify-content": "space-between", gap: "6px" }}>
                      <div style={{ display: "flex", "align-items": "center", gap: "5px", "font-size": "0.8rem", "min-width": "0" }}>
                        <span style={{ color: "var(--accent-red)" }}>{gi.icon} {offer.giveAmount}</span>
                        <span style={{ color: "var(--text-muted)" }}>→</span>
                        <span style={{ color: "var(--accent-green)" }}>{ri.icon} {offer.receiveAmount}</span>
                      </div>
                      <button
                        style={{ ...mutedBtnStyle, padding: "2px 8px", "font-size": "0.7rem", "flex-shrink": "0" }}
                        onClick={() => handleCancel(offer.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }}
              </For>
            </Show>
          </div>

        </div>
      </Show>
    </div>
  );
}
