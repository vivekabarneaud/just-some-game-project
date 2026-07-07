import { For, Show, createSignal } from "solid-js";
import { useGame } from "~/engine/gameState";
import { getMerchant } from "~/data/merchants";
import { getTotalFood } from "~/data/foods";
import { playSound } from "~/engine/sounds";

// Icons/labels for the resources a first-visit merchant deals in. Kept local and
// small; extend as culture shelves add goods.
const RES: Record<string, { icon: string; label: string }> = {
  gold: { icon: "🪙", label: "Gold" },
  wood: { icon: "🪵", label: "Wood" },
  stone: { icon: "🪨", label: "Stone" },
  // The "food" trade token resolves to wheat (see trade(): addFood(…, "wheat")),
  // and every merchant that deals in it is a grain trader — so name it Grain.
  food: { icon: "🌾", label: "Grain" },
};
const res = (k: string) => RES[k] ?? { icon: "📦", label: k };

/**
 * A traveling merchant's visit. Two panels: the scene + why he won't stay on the
 * left, his wares on the right. Trade is instant (the visit is the window), so it
 * bypasses the marketplace requirement. The player can accept several offers, then
 * see him off. One-shot per merchant — closing clears the visit for good.
 */
export default function TravelingMerchantModal(props: { merchantId: string; onClose: () => void }) {
  const { state, actions } = useGame();
  const merchant = () => getMerchant(props.merchantId);
  const [taken, setTaken] = createSignal<Set<string>>(new Set());

  const stockOf = (key: string): number =>
    key === "food" ? getTotalFood(state.foods) : (state.resources[key as "gold" | "wood" | "stone"] ?? 0);

  const accept = (offerId: string, give: string, giveAmt: number, receive: string, recvAmt: number) => {
    if (taken().has(offerId)) return;
    const ok = actions.trade(give, giveAmt, receive, recvAmt, /* allowWithoutMarket */ true);
    if (ok) {
      playSound("coins");
      setTaken((s) => new Set(s).add(offerId));
    }
  };

  return (
    <Show when={merchant()}>
      {(m) => (
        <div
          class="modal-overlay page-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
        >
          <div class="merchant-visit-card">
            <div class="merchant-visit-grid">
              {/* ── Left: the visit ── */}
              <div class="merchant-visit-scene">
                <div class="merchant-visit-head">
                  <Show
                    when={m().portrait}
                    fallback={<span class="merchant-visit-avatar">{m().icon}</span>}
                  >
                    <img class="merchant-visit-portrait" src={m().portrait} alt={m().name} />
                  </Show>
                  <div>
                    <div class="merchant-visit-name">{m().name}</div>
                    <div class="merchant-visit-culture">{m().culture}</div>
                  </div>
                </div>
                <p class="merchant-visit-text">{m().narrative}</p>
                <p class="merchant-visit-parting">{m().parting}</p>
              </div>

              {/* ── Right: his wares ── */}
              <div class="merchant-visit-wares">
                <div class="merchant-visit-wares-title">His wares</div>
                <div class="merchant-visit-offers">
                  <For each={m().offers}>
                    {(o) => {
                      const isTaken = () => taken().has(o.id);
                      const affordable = () => stockOf(o.give) >= o.giveAmount;
                      return (
                        <div class="merchant-offer" classList={{ "is-taken": isTaken() }}>
                          <div class="merchant-offer-label">{o.label}</div>
                          <div class="merchant-offer-trade">
                            <span class="merchant-offer-side">
                              {res(o.give).icon} {o.giveAmount} {res(o.give).label}
                            </span>
                            <span class="merchant-offer-arrow">→</span>
                            <span class="merchant-offer-side merchant-offer-get">
                              {res(o.receive).icon} {o.receiveAmount} {res(o.receive).label}
                            </span>
                          </div>
                          <button
                            class="merchant-offer-btn"
                            disabled={isTaken() || !affordable()}
                            onClick={() => accept(o.id, o.give, o.giveAmount, o.receive, o.receiveAmount)}
                          >
                            {isTaken() ? "Traded" : affordable() ? "Trade" : `Need ${res(o.give).label.toLowerCase()}`}
                          </button>
                        </div>
                      );
                    }}
                  </For>
                </div>
                <button class="merchant-visit-close" onClick={() => props.onClose()}>
                  See him off
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
