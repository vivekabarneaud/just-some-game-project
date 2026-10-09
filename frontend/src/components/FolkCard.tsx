import { For, Show } from "solid-js";
import {
  getClassMeta, getOrigin, RACE_NAMES, getXpForLevel, getCharacterSummary,
} from "@medieval-realm/shared/data/adventurers";
import { getItem } from "@medieval-realm/shared/data/items";
import { getUnspentTalentPoints } from "~/data/talents";
import { CardFrame } from "~/components/CardFrame";
import Portrait from "~/components/Portrait";
import Tooltip from "~/components/Tooltip";
import TraitBadge from "~/components/TraitBadge";
import AdventurerVitals from "~/components/AdventurerVitals";
import RecoveryActions from "~/components/RecoveryActions";
import type { FolkPerson } from "~/data/folk";

/**
 * One card for one person, whoever they are.
 *
 * The guild roster and the Chronicle cast drew the same card twice, with the
 * same classes (`building-card adv-card` inside `.recruit-grid`) and different
 * data. This is that card, once, over the normalised `FolkPerson`.
 *
 * THE ??? RULE, carried over from `ChronicleRecipes.tsx`: when `known` is false
 * the card shows that a person EXISTS and nothing more. No name, no story, no
 * class. A census must not spoil the people you have not met yet.
 */

function XpBar(props: { xp: number; level: number }) {
  const needed = () => getXpForLevel(props.level);
  const pct = () => Math.min(100, (props.xp / needed()) * 100);
  return (
    <div style={{ "margin-top": "6px" }}>
      <div style={{ display: "flex", "justify-content": "space-between", "font-size": "0.7rem", color: "var(--text-muted)" }}>
        <span>Lv.{props.level}</span>
        <span>{props.xp}/{needed()} XP</span>
      </div>
      <div style={{ height: "4px", background: "var(--bg-primary)", "border-radius": "2px", "margin-top": "2px" }}>
        <div style={{ height: "100%", width: `${pct()}%`, background: "var(--accent-blue)", "border-radius": "2px", transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function FolkCard(props: {
  person: FolkPerson;
  /** Left out for a card that only reports, like the Chronicle census. */
  onOpen?: (p: FolkPerson) => void;
}) {
  const p = () => props.person;
  const known = () => p().known !== false;
  const adv = () => p().adventurer;
  const away = () => (known() ? p().away : undefined);

  const equipped = () => {
    const a = adv();
    if (!a) return [];
    const eq = a.equipment;
    return [eq.mainHand, eq.offHand, eq.head, eq.chest, eq.legs, eq.boots, eq.cloak, eq.trinket]
      .filter(Boolean).map((id) => getItem(id!)).filter(Boolean);
  };
  const emptySlots = () => {
    const a = adv();
    // Eleven slots in total. The paper-doll in the popin is the one that counts
    // them properly; this is only the "you forgot to equip them" nudge.
    return a ? 11 - Object.values(a.equipment).filter(Boolean).length : 0;
  };
  const unspent = () => {
    const a = adv();
    return a ? getUnspentTalentPoints(a) : 0;
  };

  return (
    <div
      class="building-card adv-card"
      onClick={() => { if (known()) props.onOpen?.(p()); }}
      style={{
        position: "relative",
        width: "100%",
        cursor: known() && props.onOpen ? "pointer" : "default",
        opacity: away() ? 0.65 : 1,
        background: away() ? "var(--bg-secondary)" : "var(--bg-card)",
      }}
    >
      <Show when={known() && p().frame}>
        {(f) => <CardFrame rarity={f()} border={24} ornamentSize={28} ornamentInset={8} z={3} />}
      </Show>

      <Show when={known() && p().category}>
        {(c) => (
          <span class="building-card-category" style={{ color: c().color }}>{c().label}</span>
        )}
      </Show>

      <div class="adv-card-portrait">
        <Show
          when={known()}
          fallback={
            <span style={{
              display: "flex", width: "100%", height: "100%",
              "align-items": "center", "justify-content": "center",
              "font-size": "2.5rem", color: "rgba(200,200,210,0.35)",
              background: "rgba(0,0,0,0.3)",
            }}>?</span>
          }
        >
          <Portrait src={p().portrait} alt={p().name} glyph={p().icon ?? "🙂"}
            style={{ "border-radius": "0" }} />
        </Show>
      </div>

      <div class="adv-card-content">
        <Show
          when={known()}
          fallback={
            <div class="building-card-title" style={{
              "font-style": "italic", color: "var(--text-muted)", "letter-spacing": "0.15em",
            }}>???</div>
          }
        >
          <div class="building-card-title">{p().name}</div>

          {/* The second line. An adventurer gets race, class and level; everyone
              else gets the one line their registry carries. */}
          <Show when={adv()} fallback={
            <Show when={p().line}>
              <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>{p().line}</div>
            </Show>
          }>
            {(a) => (
              <>
                <div style={{ "font-size": "0.85rem", color: "var(--text-muted)" }}>
                  {a().race ? `${RACE_NAMES[a().race!]} ` : ""}{getClassMeta(a().class).name} · Lv.{a().level}
                </div>
                <Show when={a().origin}>
                  <div style={{ "font-size": "0.75rem", color: "var(--text-muted)" }}>
                    {getOrigin(a().origin)?.name} — {getOrigin(a().origin)?.region}
                  </div>
                </Show>
                <XpBar xp={a().xp} level={a().level} />
                <div style={{ "margin-top": "4px" }}>
                  <AdventurerVitals adventurer={a()} width="100%" showText showRegen />
                </div>
                <RecoveryActions adventurer={a()} />
                <Show when={a().backstory}>
                  <div class="roster-card-backstory" style={{
                    "font-size": "0.78rem", color: "var(--text-secondary)",
                    "font-style": "italic", "line-height": "1.4",
                    "padding-left": "8px", "border-left": "2px solid var(--border-color)",
                  }}>
                    "{getCharacterSummary(a().premadeId) ?? a().backstory}"
                  </div>
                </Show>
                <TraitBadge traitId={a().trait} />
              </>
            )}
          </Show>

          {/* Where a settler works. An adventurer takes a job through the
              building screen, so the card does not claim one for them. */}
          <Show when={p().worksAt}>
            {(w) => (
              <div style={{ "font-size": "0.75rem", color: "var(--text-muted)", "margin-top": "4px" }}>
                Works at the {w()}
              </div>
            )}
          </Show>

          {/* An illness does not grey the card. The person is still here. */}
          <Show when={p().ailment}>
            {(ail) => (
              <div style={{
                "margin-top": "6px", padding: "3px 8px", "border-radius": "4px",
                background: "rgba(192, 57, 43, 0.15)", border: "1px solid var(--accent-red)",
                color: "var(--accent-red)", "font-size": "0.75rem", "text-align": "center",
              }}>
                {ail().icon} {ail().name}
              </div>
            )}
          </Show>

          <Show when={adv()}>
            <div style={{
              "margin-top": "auto", "padding-top": "8px", "font-size": "0.75rem",
              display: "flex", gap: "6px", "flex-wrap": "wrap", "align-items": "center",
            }}>
              <For each={equipped()}>
                {(item) => <Tooltip text={item!.name}><span>{item!.icon}</span></Tooltip>}
              </For>
              <Show when={emptySlots() > 0}>
                <span style={{ color: "var(--accent-gold)", "font-size": "0.7rem" }}>
                  {emptySlots()} empty gear slot{emptySlots() > 1 ? "s" : ""}
                </span>
              </Show>
              <Show when={unspent() > 0}>
                <Tooltip text="This adventurer has unspent talent points">
                  <span style={{
                    padding: "2px 8px", "border-radius": "4px",
                    background: "rgba(52, 152, 219, 0.18)", border: "1px solid var(--accent-blue)",
                    color: "var(--accent-blue)", "font-size": "0.7rem", "font-weight": "bold",
                    animation: "pulse 2s infinite",
                  }}>
                    ⭐ {unspent()} talent point{unspent() > 1 ? "s" : ""}
                  </span>
                </Tooltip>
              </Show>
            </div>
          </Show>

          <Show when={away()}>
            {(reason) => (
              <div style={{
                "margin-top": "6px", padding: "3px 8px", "border-radius": "4px",
                background: "rgba(52, 152, 219, 0.15)", border: "1px solid var(--accent-blue)",
                color: "var(--accent-blue)", "font-size": "0.75rem", "text-align": "center",
                "text-transform": "capitalize",
              }}>
                {reason()}
              </div>
            )}
          </Show>
        </Show>
      </div>
    </div>
  );
}
