import { Show, createSignal, For } from "solid-js";
import {
  isMuted, toggleMuted, playSound,
  masterVolume, setMasterVolume,
  uiVolume, setUiVolume,
  ambientVolume, setAmbientVolume,
  musicVolume, setMusicVolume,
} from "~/engine/sounds";

// Module-level open state so any component (e.g. the sidebar gear) can pop it.
const [open, setOpen] = createSignal(false);
export const openSettings = open;
export const setOpenSettings = setOpen;

type Channel = {
  label: string;
  icon: string;
  get: () => number;
  set: (v: number) => void;
  hint?: string;
  preview?: boolean; // play a UI blip while dragging so the level is audible
};

export default function SettingsModal() {
  const channels = (): Channel[] => [
    { label: "Master", icon: "🎚️", get: masterVolume, set: setMasterVolume, preview: true },
    { label: "UI & effects", icon: "🖱️", get: uiVolume, set: setUiVolume, preview: true },
    { label: "Ambient", icon: "🌧️", get: ambientVolume, set: setAmbientVolume, hint: "No ambient sounds yet — ready for weather beds." },
    { label: "Music", icon: "🎵", get: musicVolume, set: setMusicVolume, hint: "No music yet — reserved for a future score." },
  ];

  const close = () => setOpen(false);

  return (
    <Show when={open()}>
      <div
        class="modal-overlay page-modal-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      >
        <div class="settings-card">
          <div class="settings-header">
            <span class="settings-title">⚙ Settings</span>
            <button class="settings-close" aria-label="Close settings" onClick={close}>✕</button>
          </div>

          <div class="settings-section-title">Sound</div>

          <button
            class="settings-mute-toggle"
            classList={{ muted: isMuted() }}
            onClick={toggleMuted}
            data-no-click-sound
          >
            <span>{isMuted() ? "🔇" : "🔊"}</span>
            {isMuted() ? "All sound muted" : "Sound on"}
          </button>

          <For each={channels()}>
            {(ch) => (
              <div class="settings-slider-row" classList={{ disabled: isMuted() }}>
                <label class="settings-slider-label">
                  <span class="settings-slider-icon">{ch.icon}</span>
                  {ch.label}
                  <span class="settings-slider-pct">{Math.round(ch.get() * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(ch.get() * 100)}
                  disabled={isMuted()}
                  onInput={(e) => {
                    ch.set(parseInt(e.currentTarget.value, 10) / 100);
                  }}
                  onChange={() => { if (ch.preview && !isMuted()) playSound("confirm"); }}
                />
                <Show when={ch.hint}>
                  <div class="settings-slider-hint">{ch.hint}</div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
