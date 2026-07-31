import { Show } from "solid-js";
import { useGame } from "~/engine/gameState";
import type { DefenseRing } from "~/engine/gameState";
import { getZoomedPortraitUrl, getPortraitUrl } from "@medieval-realm/shared/data/adventurers";
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
import FramedModal from "./FramedModal";

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
  // The captain (Gareth / Morgause) holds slot 1 of the roster whenever assigned
  // to this building — a base defender you always have, so the tower fights even
  // with zero hired hands. Hiring fills the remaining slots (cap − 1).
  const captainSlots = () => (trainer() ? 1 : 0);
  const rosterCount = () => (garrison()?.count ?? 0) + captainSlots();
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
    if ((garrison()?.count ?? 0) >= cap() - captainSlots()) return "This building is full";
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

  // ── Assigned-staff row (Gareth / Morgause), modeled like Nessa at the camp ──
  // The captain is permanently posted here: present while home (steadying the
  // watch, or drilling), dimmed and away while on a mission — still deployable
  // through the guild, exactly like a hunting-camp hand.
  const staffPresent = () => trainerHere();
  const staffSubLabel = () => {
    if (!trainer()) return "not yet arrived";
    if (drillingHere()) return `drilling the ${unitWord()}s`;
    if (trainerHere()) return `holding the line — fights, and their command steadies the ${unitWord()}s`;
    if (drillingElsewhere()) return "drilling another post";
    return "away on a mission";
  };
  const staffPortrait = () => {
    const t = trainer();
    return t ? getZoomedPortraitUrl(t) : "";
  };
  const staffPortraitFallback = () => {
    const t = trainer();
    return t ? getPortraitUrl(t) : "";
  };

  return (
    <FramedModal
      icon={buildingIcon()}
      title={`${RING_LABELS[props.ring]} ${buildingWord()}`}
      subtitle={<>Level {buildingLevel()} · roster {rosterCount()} / {cap()}</>}
      maxWidth="480px"
      onClose={props.onClose}
    >
      <Show when={slot()} fallback={
        <p style={{ color: "var(--text-muted)" }}>Building not found.</p>
      }>
        {/* Assigned staff — the captain holds this post permanently */}
        <div style={{ "margin-bottom": "18px" }}>
          <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "8px" }}>
            Assigned staff
          </div>
          <div style={{ padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <Show
              when={trainer()}
              fallback={
                <p style={{ "font-size": "0.82rem", color: "var(--text-muted)", "font-style": "italic", margin: 0 }}>
                  No captain has joined yet — the {unitWord()}s hold at their current drill.
                </p>
              }
            >
              <div style={{ display: "flex", "align-items": "center", gap: "10px", opacity: staffPresent() ? "1" : "0.55" }}>
                <img
                  src={staffPortrait()}
                  alt={trainerName()}
                  onError={(e) => { const el = e.currentTarget; if (el.src.includes("_zoomed")) el.src = staffPortraitFallback(); }}
                  style={{ width: "44px", height: "44px", "border-radius": "50%", "object-fit": "cover", filter: staffPresent() ? undefined : "grayscale(0.7)" }}
                />
                <div style={{ flex: "1", "min-width": "0" }}>
                  <div style={{ "font-size": "0.92rem" }}>{trainerName()} <span style={{ "font-size": "0.72rem", color: "var(--text-muted)" }}>· captain</span></div>
                  <div style={{ "font-size": "0.72rem", color: staffPresent() ? "var(--text-secondary)" : "var(--text-muted)" }}>
                    {staffSubLabel()}
                  </div>
                </div>
                <span style={{ "font-size": "0.78rem", color: staffPresent() ? "var(--accent-green, #4a9)" : "var(--text-muted)" }}>
                  {staffPresent() ? "● here" : "○ away"}
                </span>
              </div>
            </Show>
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
              class="btn-primary"
              disabled={!canHire()}
              onClick={onHire}
              style={{
                width: "100%",
                "justify-content": "center",
                "font-size": "0.85rem",
              }}
            >
              + Hire {unitWord()} ({hireCost()}g)
            </button>
            </Tooltip>
            <Tooltip text={`Dismiss one ${unitWord()}`}>
            <button
              class="btn-secondary"
              disabled={(garrison()?.count ?? 0) <= 0}
              onClick={onDismiss}
              style={{
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

        {/* Drill — the captain trains the roster */}
        <div>
          <div style={{ "font-size": "0.7rem", color: "var(--text-muted)", "text-transform": "uppercase", "letter-spacing": "1px", "margin-bottom": "6px" }}>
            Drill
          </div>
          <Tooltip block text={canTrain()
            ? `${trainerName()} drills the ${unitWord()}s to Lv.${nextUnitLevel()} (~${trainSeconds()}s)`
            : trainBlocker()}>
          <button
            class="btn-primary"
            disabled={!canTrain()}
            onClick={onTrain}
            style={{
              width: "100%",
              "justify-content": "center",
              "font-size": "0.9rem",
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
    </FramedModal>
  );
}
