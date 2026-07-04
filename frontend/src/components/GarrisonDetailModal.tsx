import { createSignal, createEffect, onCleanup, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useGame } from "~/engine/gameState";
import type { DefenseRing } from "~/engine/gameState";
import {
  getWatchtowerArcherCap,
  getBarracksSoldierCap,
  ARCHER_COST,
  SOLDIER_COST,
  getTrainTime,
  RING_LABELS,
  availableCitizens,
  TRAINER_ID,
} from "~/data/defenses";
import Countdown from "./Countdown";
import Tooltip from "./Tooltip";

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

  // ── Trainer-coordinator (Gareth at the watchtower, Morgause at the barracks) ──
  const trainer = () => state.adventurers.find((a) => a.premadeId === TRAINER_ID[props.kind]);
  const trainerName = () => trainer()?.name ?? (props.kind === "watchtower" ? "an archer-captain" : "a drillmaster");
  const trainerHere = () => !!trainer()?.alive && !trainer()?.onMission; // drilling counts as here
  const trainerAway = () => !!trainer()?.alive && !!trainer()?.onMission;
  const drillingHere = () => !!training()?.trainerId && training()!.trainerId === trainer()?.id;
  const drillingElsewhere = () =>
    !!trainer() &&
    !drillingHere() &&
    [...state.watchtowers, ...state.barracks].some((x) => x.garrison.training?.trainerId === trainer()?.id);

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
  // Displayed unit level: base 1, +1 per drilled level. `nextLevel` is the
  // internal (0-based) training target used for timing/startTraining.
  const unitLevel = () => trainedLevel() + 1;
  const nextLevel = () => trainedLevel() + 1;
  const nextUnitLevel = () => unitLevel() + 1;
  const trainSeconds = () => getTrainTime(nextLevel());
  const trainBlocker = () => {
    const s = slot();
    if (!s || s.level === 0) return "Build the building first";
    if (s.damaged) return "Repair the building first";
    if (training()) return "Already drilling";
    if (unitLevel() >= buildingLevel())
      return buildingLevel() < 2
        ? `Upgrade the ${buildingWord().toLowerCase()} to Lv.2 to drill the ${unitWord()}s`
        : `Upgrade the ${buildingWord().toLowerCase()} to Lv.${buildingLevel() + 1} to drill further`;
    if ((garrison()?.count ?? 0) <= 0) return `Hire a ${unitWord()} to drill first`;
    if (!trainer()) return `${trainerName()} hasn't arrived yet`;
    if (trainerAway()) return `${trainerName()} is away on a mission`;
    if (drillingElsewhere()) return `${trainerName()} is drilling elsewhere`;
    if (raidPending()) return "Drilling paused — raid incoming";
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
            <Tooltip text="Close (Esc)">
            <button
              onClick={close}
              style={{
                background: "transparent", border: "none", color: "var(--text-muted)",
                "font-size": "1.4rem", cursor: "pointer", padding: "0 4px",
              }}
            >
              ×
            </button>
            </Tooltip>
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
                🎖️ {unitWord()} level
              </div>
              <div style={{ display: "flex", "align-items": "baseline", gap: "8px" }}>
                <span style={{ "font-size": "1.4rem", "font-weight": "bold", color: "var(--accent-gold)" }}>
                  {unitLevel()}
                </span>
                <span style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                  / {buildingLevel()} cap (each drill: +25% HP, +20% attack)
                </span>
              </div>
              <Show when={training()}>
                <div style={{ "margin-top": "8px", "font-size": "0.85rem" }}>
                  <span style={{ color: raidPending() ? "var(--accent-red)" : "var(--accent-blue)" }}>
                    {raidPending() ? "⏸ Paused — raid incoming" : "⚙️ Training"}
                  </span>{" "}
                  → Lv.{training()!.targetLevel + 1}{" — "}
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
                <Tooltip text={canHire() ? `Hire one ${unitWord()} for ${hireCost()} gold` : hireBlocker()} block style={{ flex: 1 }}>
                <button
                  disabled={!canHire()}
                  onClick={onHire}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(218, 165, 32, 0.12)",
                    border: "1px solid var(--accent-gold)",
                    color: "var(--accent-gold)",
                    "border-radius": "4px",
                    cursor: canHire() ? "pointer" : "not-allowed",
                    opacity: canHire() ? 1 : 0.5,
                    "font-size": "0.85rem",
                  }}
                >
                  + Hire {unitWord()} ({hireCost()}g)
                </button>
                </Tooltip>
                <Tooltip text={`Dismiss one ${unitWord()}`}>
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
                >
                  − Dismiss
                </button>
                </Tooltip>
              </div>
              <Show when={!canHire() && hireBlocker()}>
                <div style={{ "font-size": "0.75rem", color: "var(--accent-red)", "margin-top": "4px" }}>
                  {hireBlocker()}
                </div>
              </Show>
            </div>

            {/* The Watch — trainer-coordinator */}
            <div>
              <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>
                The Watch
              </div>
              {/* Trainer status + coordination buff */}
              <div style={{ "font-size": "0.85rem", "margin-bottom": "8px", color: "var(--text-secondary)" }}>
                <Show
                  when={trainer()}
                  fallback={<span style={{ color: "var(--text-muted)" }}>No trainer has joined yet — units hold at their current drill.</span>}
                >
                  <Show when={drillingHere()}>
                    <span style={{ color: "var(--accent-blue)" }}>⚙️ {trainerName()} is drilling the {unitWord()}s.</span>
                  </Show>
                  <Show when={!drillingHere() && trainerHere()}>
                    <span><strong style={{ color: "var(--accent-gold)" }}>{trainerName()}</strong> is here, steadying the {buildingWord().toLowerCase()} <span style={{ color: "var(--accent-green)" }}>(+1 effective level in a raid)</span>.</span>
                  </Show>
                  <Show when={drillingElsewhere()}>
                    <span style={{ color: "var(--text-muted)" }}>{trainerName()} is drilling another post right now.</span>
                  </Show>
                  <Show when={trainerAway()}>
                    <span style={{ color: "var(--text-muted)" }}>{trainerName()} is away on a mission — no drilling, no bonus.</span>
                  </Show>
                </Show>
              </div>
              <Tooltip block text={canTrain()
                ? `${trainerName()} drills the ${unitWord()}s to Lv.${nextUnitLevel()} (~${trainSeconds()}s)`
                : trainBlocker()}>
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
              >
                🎯 Have {trainerName()} drill to Lv.{nextUnitLevel()} (~{trainSeconds()}s)
              </button>
              </Tooltip>
              <Show when={!canTrain() && !training() && trainBlocker()}>
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
