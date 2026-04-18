import { Show } from "solid-js";
import type { MissionTemplate } from "@medieval-realm/shared/data/missions";
import { getMission, getMissionRank, formatReward, isExpedition } from "@medieval-realm/shared/data/missions";
import { getMissionXp } from "@medieval-realm/shared/data/adventurers";
import { getEnemy } from "@medieval-realm/shared/data/enemies";
import { MISSION_RANK_LABELS, MISSION_RANK_COLORS } from "~/data/constants";
import { useGame } from "~/engine/gameState";
import EnemyCard from "./EnemyCard";

function getMissionImage(missionId: string): string | undefined {
  return getMission(missionId)?.image;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface MissionCardProps {
  mission: MissionTemplate;
  selected: boolean;
  onClick: () => void;
  /** Story mission chapter label (e.g. "Chapter 1: Ashes and Dust") */
  storyChapter?: string;
}

export default function MissionCard(props: MissionCardProps) {
  const { state, actions } = useGame();
  const mission = () => props.mission;
  const image = () => getMissionImage(mission().id);
  const fresh = () => getMission(mission().id) ?? mission();
  const isStory = () => !!props.storyChapter;
  const isExped = () => isExpedition(fresh());
  const guildLevel = () => actions.getGuildLevel();
  const isLocked = () => isExped() && guildLevel() < fresh().minGuildLevel;
  const isDiscovered = (enemyId: string) => (state.discoveredEnemies ?? []).includes(enemyId);

  return (
    <div
      class="building-card"
      classList={{ upgrading: props.selected }}
      onClick={() => { if (!isLocked()) props.onClick(); }}
      style={{
        cursor: isLocked() ? "not-allowed" : "pointer",
        opacity: isLocked() ? 0.55 : 1,
        position: "relative",
        ...(image() ? { padding: "0", overflow: "hidden" } : {}),
        ...(isStory() ? { border: "2px solid var(--accent-gold)" } : {}),
        ...(isExped() && !isStory() ? { border: "2px solid #a78bfa" } : {}),
      }}
    >
      {/* Locked overlay */}
      <Show when={isLocked()}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "6px 12px",
          background: "rgba(0, 0, 0, 0.75)",
          border: "1px solid #a78bfa",
          "border-radius": "6px",
          color: "#a78bfa",
          "font-size": "0.8rem",
          "font-weight": "bold",
          "z-index": "2",
          "text-align": "center",
          "white-space": "nowrap",
        }}>
          🔒 Requires Adventurer's Guild Lv.{fresh().minGuildLevel}
        </div>
      </Show>
      {/* Banner image */}
      <Show when={image()}>
        <div class="building-card-image" style={{ margin: "0", "border-radius": "0" }}>
          <img src={image()} alt={mission().name} loading="lazy" />
          {/* Rank + star badge top-right */}
          {(() => {
            const rank = getMissionRank(mission().id);
            const stars = "★".repeat(Math.max(1, Math.min(3, mission().difficulty)));
            return (
              <div style={{
                position: "absolute", top: "6px", right: "6px",
                padding: "2px 8px", "border-radius": "4px",
                background: "rgba(0, 0, 0, 0.7)",
                "font-size": "0.65rem", "line-height": "1.4",
              }}>
                <span style={{ color: rank ? MISSION_RANK_COLORS[rank] : "var(--text-muted)" }}>
                  {stars} {rank ? MISSION_RANK_LABELS[rank] : ""}
                </span>
                <Show when={!isStory()}>
                  <span style={{ color: "var(--text-muted)" }}>{" · "}{mission().tags.join(", ")}</span>
                </Show>
              </div>
            );
          })()}
          {/* Title overlay */}
          <div class="building-card-image-overlay">
            <Show when={isStory()}>
              <div style={{ "font-size": "0.6rem", color: "var(--accent-gold)", "margin-bottom": "2px", "text-transform": "uppercase", "letter-spacing": "0.5px", opacity: "0.8" }}>
                Story Mission · {props.storyChapter}
              </div>
            </Show>
            <Show when={isExped() && !isStory()}>
              <div style={{ "font-size": "0.6rem", color: "#a78bfa", "margin-bottom": "2px", "text-transform": "uppercase", "letter-spacing": "0.5px", opacity: "0.9" }}>
                ⚔️ Expedition{(fresh() as any).biome ? ` · ${(fresh() as any).biome}` : ""}
              </div>
            </Show>
            <div class="building-card-title" style={{ color: isStory() ? "var(--accent-gold)" : isExped() ? "#a78bfa" : undefined }}>
              {mission().name}
            </div>
          </div>
        </div>
      </Show>

      {/* Content */}
      <div style={{ padding: image() ? "8px 16px 16px" : undefined, flex: "1", display: "flex", "flex-direction": "column" }}>
        {/* No-image fallback header */}
        <Show when={!image()}>
          <Show when={isStory()}>
            <div style={{ "font-size": "0.6rem", color: "var(--accent-gold)", "text-transform": "uppercase", "letter-spacing": "0.5px", "margin-bottom": "4px" }}>
              Story · {props.storyChapter}
            </div>
          </Show>
          <Show when={isExped() && !isStory()}>
            <div style={{ "font-size": "0.6rem", color: "#a78bfa", "text-transform": "uppercase", "letter-spacing": "0.5px", "margin-bottom": "4px" }}>
              ⚔️ Expedition{(fresh() as any).biome ? ` · ${(fresh() as any).biome}` : ""}
            </div>
          </Show>
          {(() => {
            const rank = getMissionRank(mission().id);
            const stars = "★".repeat(Math.max(1, Math.min(3, mission().difficulty)));
            return (
              <span class="building-card-category">
                <span style={{ color: rank ? MISSION_RANK_COLORS[rank] : "var(--text-muted)" }}>
                  {stars} {rank ? MISSION_RANK_LABELS[rank] : ""}
                </span>
                {" · "}{mission().tags.join(", ")}
              </span>
            );
          })()}
          <div class="building-card-header" style={{ "margin-top": "14px" }}>
            <div class="building-card-icon">{mission().icon}</div>
            <div>
              <div class="building-card-title" style={{ color: isStory() ? "var(--accent-gold)" : undefined }}>
                {mission().name}
              </div>
              <div style={{ "font-size": "0.8rem", color: "var(--text-muted)" }}>
                {formatDuration(mission().duration)} · {mission().deployCost}g deploy cost
              </div>
            </div>
          </div>
        </Show>

        {/* Description */}
        <div class="building-card-desc" style={{ "font-style": isStory() ? "italic" : undefined }}>
          {mission().description}
        </div>

        {/* Enemy encounters */}
        <Show when={fresh().encounters?.length}>
          <div style={{ "margin-top": "14px", display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
            {fresh().encounters!.map((enc) => {
              const enemy = getEnemy(enc.enemyId);
              return enemy ? <EnemyCard enemy={enemy} count={enc.count} hidden={!isDiscovered(enc.enemyId)} /> : null;
            })}
          </div>
        </Show>

        {/* Bottom section */}
        <div style={{ "margin-top": "auto", "padding-top": "12px" }}>
          <div style={{ "font-size": "0.8rem", color: "var(--accent-green)" }}>
            Rewards: {mission().rewards.map((r) => formatReward(r)).join(", ")}
          </div>
          <div style={{ "font-size": "0.75rem", color: "var(--accent-blue)", "margin-top": "2px" }}>
            +{getMissionXp(mission().difficulty, true)} XP on success · +{getMissionXp(mission().difficulty, false)} XP on failure
          </div>
        </div>
      </div>
    </div>
  );
}
