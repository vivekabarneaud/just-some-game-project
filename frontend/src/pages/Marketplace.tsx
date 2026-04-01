import { createSignal, For, Show } from "solid-js";
import { useGame } from "~/engine/gameState";

type ResourceKey = "gold" | "wood" | "stone" | "food";

interface TradeOffer {
  give: ResourceKey;
  giveAmount: number;
  receive: ResourceKey;
  receiveAmount: number;
}

const RESOURCE_INFO: Record<ResourceKey, { icon: string; name: string }> = {
  gold: { icon: "🪙", name: "Gold" },
  wood: { icon: "🪵", name: "Wood" },
  stone: { icon: "🪨", name: "Stone" },
  food: { icon: "🍖", name: "Food" },
};

const BASE_TRADES: { give: ResourceKey; receive: ResourceKey; giveBase: number; receiveBase: number }[] = [
  // Wood trades (most demanded — expensive)
  { give: "stone", receive: "wood", giveBase: 30, receiveBase: 10 },
  { give: "food", receive: "wood", giveBase: 40, receiveBase: 10 },
  { give: "gold", receive: "wood", giveBase: 25, receiveBase: 10 },
  // Stone trades
  { give: "wood", receive: "stone", giveBase: 30, receiveBase: 10 },
  { give: "food", receive: "stone", giveBase: 35, receiveBase: 10 },
  { give: "gold", receive: "stone", giveBase: 20, receiveBase: 10 },
  // Food trades
  { give: "wood", receive: "food", giveBase: 25, receiveBase: 10 },
  { give: "stone", receive: "food", giveBase: 25, receiveBase: 10 },
  { give: "gold", receive: "food", giveBase: 15, receiveBase: 10 },
  // Gold trades
  { give: "wood", receive: "gold", giveBase: 30, receiveBase: 5 },
  { give: "stone", receive: "gold", giveBase: 30, receiveBase: 5 },
  { give: "food", receive: "gold", giveBase: 40, receiveBase: 5 },
];

function getDiscount(marketLevel: number): number {
  // Lvl 1: 0% discount, Lvl 10: 20% discount on give cost
  return Math.min(0.022 * (marketLevel - 1), 0.2);
}

// Cooldown in seconds: 5 min at lvl 1, decreasing with level
function getCooldown(marketLevel: number): number {
  return Math.max(60, 300 - (marketLevel - 1) * 30);
}

export default function Marketplace() {
  const { state, actions } = useGame();
  const [filter, setFilter] = createSignal<ResourceKey | "all">("all");
  const [cooldownEnd, setCooldownEnd] = createSignal(0);
  const [now, setNow] = createSignal(Date.now());

  // Update "now" every second for cooldown display
  setInterval(() => setNow(Date.now()), 1000);

  const marketLevel = () =>
    state.buildings.find((b) => b.buildingId === "marketplace")?.level ?? 0;

  const isBuilt = () => marketLevel() > 0;
  const discount = () => getDiscount(marketLevel());
  const cooldownSec = () => getCooldown(marketLevel());
  const isOnCooldown = () => now() < cooldownEnd();
  const cooldownRemaining = () => Math.max(0, Math.ceil((cooldownEnd() - now()) / 1000));

  const trades = (): TradeOffer[] =>
    BASE_TRADES
      .filter((t) => filter() === "all" || t.receive === filter())
      .map((t) => ({
        give: t.give,
        giveAmount: Math.max(1, Math.round(t.giveBase * (1 - discount()))),
        receive: t.receive,
        receiveAmount: t.receiveBase,
      }));

  const canAffordTrade = (trade: TradeOffer, multiplier: number) => {
    const cost = trade.giveAmount * multiplier;
    return state.resources[trade.give] >= cost && !isOnCooldown();
  };

  const executeTrade = (trade: TradeOffer, multiplier: number) => {
    if (!canAffordTrade(trade, multiplier)) return;
    if (actions.trade(trade.give, trade.giveAmount * multiplier, trade.receive, trade.receiveAmount * multiplier)) {
      setCooldownEnd(Date.now() + cooldownSec() * 1000);
    }
  };

  const formatCooldown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div>
      <h1 class="page-title">Marketplace</h1>

      <Show when={!isBuilt()}>
        <div style={{
          padding: "40px",
          "text-align": "center",
          color: "var(--text-secondary)",
        }}>
          <div style={{ "font-size": "3rem", "margin-bottom": "12px" }}>🏪</div>
          <p>Build a Marketplace to start trading with travelling merchants.</p>
          <a href="/buildings#building-marketplace" style={{ color: "var(--accent-gold)", "margin-top": "8px", display: "inline-block" }}>
            Go to Buildings →
          </a>
        </div>
      </Show>

      <Show when={isBuilt()}>
        <div style={{
          "margin-bottom": "16px",
          padding: "8px 12px",
          background: "var(--bg-secondary)",
          "border-radius": "6px",
          "font-size": "0.85rem",
          color: "var(--text-secondary)",
          display: "flex",
          "justify-content": "space-between",
        }}>
          <span>Marketplace Level {marketLevel()}</span>
          <div style={{ display: "flex", gap: "16px" }}>
            <Show when={discount() > 0}>
              <span style={{ color: "var(--accent-green)" }}>
                Discount: {Math.round(discount() * 100)}%
              </span>
            </Show>
            <span>Cooldown: {formatCooldown(cooldownSec())}</span>
          </div>
        </div>

        <Show when={isOnCooldown()}>
          <div style={{
            padding: "10px 14px",
            "margin-bottom": "16px",
            "border-radius": "6px",
            background: "rgba(245, 197, 66, 0.1)",
            border: "1px solid rgba(245, 197, 66, 0.3)",
            color: "var(--accent-gold)",
            "font-size": "0.85rem",
            "text-align": "center",
          }}>
            The merchants are preparing your goods... Next trade in {formatCooldown(cooldownRemaining())}
          </div>
        </Show>

        <div style={{ "margin-bottom": "16px", display: "flex", gap: "6px" }}>
          <button
            class="trade-filter-btn"
            classList={{ active: filter() === "all" }}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <For each={Object.entries(RESOURCE_INFO) as [ResourceKey, { icon: string; name: string }][]}>
            {([key, info]) => (
              <button
                class="trade-filter-btn"
                classList={{ active: filter() === key }}
                onClick={() => setFilter(key as ResourceKey)}
              >
                {info.icon} {info.name}
              </button>
            )}
          </For>
        </div>

        <div class="trades-grid">
          <For each={trades()}>
            {(trade) => {
              const gi = RESOURCE_INFO[trade.give];
              const ri = RESOURCE_INFO[trade.receive];
              return (
                <div class="trade-card">
                  <div class="trade-exchange">
                    <span class="trade-give">
                      {gi.icon} {trade.giveAmount} {gi.name}
                    </span>
                    <span class="trade-arrow">→</span>
                    <span class="trade-receive">
                      {ri.icon} {trade.receiveAmount} {ri.name}
                    </span>
                  </div>
                  <div class="trade-buttons">
                    <button
                      class="trade-btn"
                      disabled={!canAffordTrade(trade, 1)}
                      onClick={() => executeTrade(trade, 1)}
                    >
                      ×1
                    </button>
                    <button
                      class="trade-btn"
                      disabled={!canAffordTrade(trade, 5)}
                      onClick={() => executeTrade(trade, 5)}
                    >
                      ×5
                    </button>
                    <button
                      class="trade-btn"
                      disabled={!canAffordTrade(trade, 10)}
                      onClick={() => executeTrade(trade, 10)}
                    >
                      ×10
                    </button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
