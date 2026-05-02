import { createSignal, createEffect, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useGame } from "~/engine/gameState";
import type { DefenseRing } from "~/engine/gameState";
import {
  getWatchtowerArcherCap,
  getBarracksSoldierCap,
  ARCHER_COST,
  SOLDIER_COST,
  getTrainCost,
  getTrainTime,
  RING_LABELS,
  availableCitizens,
} from "~/data/defenses";
import Countdown from "./Countdown";

interface Props {
  kind: "watchtower" | "barracks";
  ring: DefenseRing;
  onClose: () => void;
}

/**
 * Per-building roster manager. Surfaces garrison count, training level, and
 * the actions for hire / train. Auto-pauses training while a real raid is
 * incoming. Closed by clicking outside, the X button, or Escape.
 */
export default function GarrisonDetailModal(props: Props) {
  const { state, actions } = useGame();
  const [exiting, setExiting] = createSignal(false);

  const slot = () => props.kind === "watchtower"
    ? state.watchtowers.find((t) => t.ring === props.ring)
    : state.barracks.find((b) => b.ring === props.ring);

  const cap = () => {
    const s = slot();
    if (!s) return 0;
    return props.kind === "watchtower" ? getWatchtowerArcherCap(s.level) : getBarracksSoldierCap(s.level);
  };

  const hireCost = () => props.kind === "watchtower" ? ARCHER_COST.gold : SOLDIER_COST.gold;
  const unitWord = () => props.kind === "watchtower" ? "archer" : "soldier";
  const buildingWord = () => props.kind === "watchtower" ? "Watchtower" : "Barracks";
  const buildingIcon = () => props.kind === "watchtower" ? "🏰" : "⚔️";

  const garrison = () => slot()?.garrison;
  const trainedLevel = () => garrison()?.trainedLevel ?? 0;
  const training = () => garrison()?.training;
  const buildingLevel = () => slot()?.level ?? 0;

  // ── Hire blocker ──
  const hireBlocker = () => {
    const s = slot();
    if (!s || s.level === 0) return `Build a ${buildingWord().toLowerCase()} first`;
    if (s.damaged) return `Repair the ${buildingWord().toLowerCase()} first`;
    if ((garrison()?.count ?? 0) >= cap()) return "This building is full";
    if (availableCitizens(state) <= 0) return "No spare citizens";
    if (state.resources.gold < hireCost()) return `Need ${hireCost()} gold`;
    return "";
  };
  const canHire = () => hireBlocker() === "";

  // ── Train blocker ──
  const raidPending = () => state.incomingRaids.some((ir) => !ir.combatLog);
  const nextLevel = () => trainedLevel() + 1;
  const trainCost = () => getTrainCost(nextLevel()).gold;
  const trainSeconds = () => getTrainTime(nextLevel());
  const trainBlocker = () => {
    const s = slot();
    if (!s || s.level === 0) return "Build the building first";
    if (s.damaged) return "Repair the building first";
    if (training()) return "Already training";
    if (trainedLevel() >= buildingLevel()) return `Upgrade the ${buildingWord().toLowerCase()} to raise the cap`;
    if (state.resources.gold < trainCost()) return `Need ${trainCost()} gold`;
    if (raidPending()) return "Training paused — raid incoming";
    return "";
  };
  const canTrain = () => trainBlocker() === "";

  // ── Hire / dismiss / train actions ──
  const onHire = () => {
    if (props.kind === "watchtower") actions.recruitArcher(props.ring);
    else actions.recruitSoldier(props.ring);
  };
  const onDismiss = () => {
    if (props.kind === "watchtower") actions.dismissArcher(props.ring);
    else actions.dismissSoldier(props.ring);
  };
  const onTrain = () => actions.startTraining(props.kind, props.ring);

  const close = () => {
    setExiting(true);
    setTimeout(() => props.onClose(), 200);
  };

  // Close on Escape
  createEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    onCleanup(() => window.removeEventListener("keydown", handler));
  });

  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.78)",
          "z-index": 1100,
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          padding: "24px",
          opacity: exiting() ? 0 : 1,
          transition: "opacity 0.2s ease",
        }}
        onClick={close}
      >
        <div
          style={{
            "max-width": "480px",
            width: "100%",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            "border-radius": "8px",
            padding: "20px",
            color: "var(--text-primary)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", "margin-bottom": "12px" }}>
            <h2 style={{ margin: 0, "font-family": "var(--font-heading)", color: "var(--accent-gold)", "font-size": "1.2rem" }}>
              {buildingIcon()} {RING_LABELS[props.ring]} {buildingWord()}
            </h2>
            <button
              onClick={close}
              style={{
                background: "transparent", border: "none", color: "var(--text-muted)",
                "font-size": "1.4rem", cursor: "pointer", padding: "0 4px",
              }}
              title="Close (Esc)"
            >
              ×
            </button>
          </div>

          <Show when={slot()} fallback={
            <p style={{ color: "var(--text-muted)" }}>Building not found.</p>
          }>
            {/* Building level + roster */}
            <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "8px", "margin-bottom": "16px" }}>
              <div style={{ background: "var(--bg-primary)", padding: "8px 10px", "border-radius": "4px" }}>
                <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px" }}>Level</div>
                <div style={{ "font-size": "1.1rem", "font-weight": "bold" }}>{buildingLevel()}</div>
              </div>
              <div style={{ background: "var(--bg-primary)", padding: "8px 10px", "border-radius": "4px" }}>
                <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px" }}>Roster</div>
                <div style={{ "font-size": "1.1rem", "font-weight": "bold" }}>{garrison()?.count ?? 0} / {cap()}</div>
              </div>
            </div>

            {/* Trained level */}
            <div style={{
              background: "var(--bg-primary)", padding: "10px 12px", "border-radius": "4px", "margin-bottom": "16px",
            }}>
              <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "4px" }}>
                🎖️ Training Level
              </div>
              <div style={{ display: "flex", "align-items": "baseline", gap: "8px" }}>
                <span style={{ "font-size": "1.4rem", "font-weight": "bold", color: "var(--accent-gold)" }}>
                  {trainedLevel()}
                </span>
                <span style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                  / {buildingLevel()} cap (each level: +25% HP, +20% attack)
                </span>
              </div>
              <Show when={training()}>
                <div style={{ "margin-top": "8px", "font-size": "0.85rem" }}>
                  <span style={{ color: raidPending() ? "var(--accent-red)" : "var(--accent-blue)" }}>
                    {raidPending() ? "⏸ Paused — raid incoming" : "⚙️ Training"}
                  </span>{" "}
                  → Lv.{training()!.targetLevel}{" — "}
                  <Countdown remainingSeconds={training()!.remainingSeconds} />
                </div>
              </Show>
            </div>

            {/* Hire / dismiss row */}
            <div style={{ "margin-bottom": "12px" }}>
              <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>
                Recruit
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  disabled={!canHire()}
                  onClick={onHire}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    background: "rgba(218, 165, 32, 0.12)",
                    border: "1px solid var(--accent-gold)",
                    color: "var(--accent-gold)",
                    "border-radius": "4px",
                    cursor: canHire() ? "pointer" : "not-allowed",
                    opacity: canHire() ? 1 : 0.5,
                    "font-size": "0.85rem",
                  }}
                  title={canHire() ? `Hire one ${unitWord()} for ${hireCost()} gold` : hireBlocker()}
                >
                  + Hire {unitWord()} ({hireCost()}g)
                </button>
                <button
                  disabled={(garrison()?.count ?? 0) <= 0}
                  onClick={onDismiss}
                  style={{
                    padding: "8px 12px",
                    background: "transparent",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-muted)",
                    "border-radius": "4px",
                    cursor: (garrison()?.count ?? 0) > 0 ? "pointer" : "not-allowed",
                    opacity: (garrison()?.count ?? 0) > 0 ? 1 : 0.4,
                    "font-size": "0.85rem",
                  }}
                  title={`Dismiss one ${unitWord()}`}
                >
                  − Dismiss
                </button>
              </div>
              <Show when={!canHire() && hireBlocker()}>
                <div style={{ "font-size": "0.75rem", color: "var(--accent-red)", "margin-top": "4px" }}>
                  {hireBlocker()}
                </div>
              </Show>
            </div>

            {/* Train row */}
            <div>
              <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>
                Train
              </div>
              <button
                disabled={!canTrain()}
                onClick={onTrain}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "rgba(167, 139, 250, 0.12)",
                  border: "1px solid #a78bfa",
                  color: "#a78bfa",
                  "border-radius": "4px",
                  cursor: canTrain() ? "pointer" : "not-allowed",
                  opacity: canTrain() ? 1 : 0.5,
                  "font-size": "0.9rem",
                  "font-weight": "bold",
                }}
                title={canTrain()
                  ? `Train to Lv.${nextLevel()} — ${trainCost()}g, ${trainSeconds()}s`
                  : trainBlocker()}
              >
                ⚙️ Train to Lv.{nextLevel()} ({trainCost()}g · {trainSeconds()}s)
              </button>
              <Show when={!canTrain() && trainBlocker()}>
                <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "4px", "font-style": "italic" }}>
                  {trainBlocker()}
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </Portal>
  );
}
