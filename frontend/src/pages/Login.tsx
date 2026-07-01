import { For, Show, createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { register, login, googleLogin, GOOGLE_CLIENT_ID } from "~/api/auth";
import { playSound } from "~/engine/sounds";
import Tooltip from "~/components/Tooltip";

// ─── The Lord's Chronicle login ─────────────────────────────────────────────
// The login page is the chronicle itself. First-ever visit on a device shows
// the closed leather cover (click to open, with the page-turn sound). Any
// successful login sets a flag, and from then on the book is already open —
// the ritual is for newcomers, not an obligation for returning players.

const BOOK_OPENED_KEY = "valenheart.login.bookOpened";

// Deterministic star field (stable across re-renders).
const spread = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * (12.9898 + salt)) * 43758.5453;
  return v - Math.floor(v);
};
const STARS = Array.from({ length: 46 }, (_, i) => ({
  left: spread(i, 1) * 100,
  top: spread(i, 5) * 70,
  size: 0.7 + spread(i, 9) * 1.9,
  delay: spread(i, 13) * 3,
}));

export default function Login() {
  const navigate = useNavigate();

  const alreadyKnown = (() => {
    try { return localStorage.getItem(BOOK_OPENED_KEY) === "1"; } catch { return false; }
  })();
  const [opened, setOpened] = createSignal(alreadyKnown);

  const [isRegister, setIsRegister] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  let googleBtnRef: HTMLDivElement | undefined;

  const markKnown = () => {
    try { localStorage.setItem(BOOK_OPENED_KEY, "1"); } catch { /* private mode */ }
  };

  const openCover = () => {
    if (opened()) return;
    setOpened(true);
    playSound("page_turn");
  };

  onMount(() => {
    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !googleBtnRef) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          setError("");
          setLoading(true);
          try {
            await googleLogin(resp.credential);
            markKnown();
            navigate("/", { replace: true });
          } catch (err: any) {
            setError(err.message || "Google sign-in failed");
          } finally {
            setLoading(false);
          }
        },
      });
      g.accounts.id.renderButton(googleBtnRef, {
        theme: "outline", size: "large", width: 280,
        text: "continue_with", shape: "pill",
      });
    };

    if ((window as any).google?.accounts?.id) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = init;
      document.head.appendChild(script);
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister()) {
        await register({ username: username(), email: email(), password: password() });
      } else {
        await login({ email: email(), password: password() });
      }
      markKnown();
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="lgb-screen">
      <div class="lgb-stars" aria-hidden="true">
        <For each={STARS}>
          {(s) => (
            <span
              class="lg-star"
              style={{
                left: `${s.left}%`, top: `${s.top}%`,
                width: `${s.size}px`, height: `${s.size}px`,
                "animation-delay": `${s.delay}s`,
              }}
            />
          )}
        </For>
      </div>

      <div class="lgb-wrap">
        {/* The first page — the form lives here, in the journal's voice. */}
        <div class="lgb-page">
          <h2 class="lgb-title">The Chronicle</h2>
          <p class="lgb-date">~ the first entry is yours to write ~</p>
          <p class="lgb-quote">
            "I was given this land by the Crown. What it actually is, I am beginning to learn."
          </p>

          <Show when={error()}>
            <div class="lg-deed-error">{error()}</div>
          </Show>

          <form onSubmit={handleSubmit}>
            <Show when={isRegister()}>
              <div class="lg-field">
                <label>Name of the settler</label>
                <Tooltip text="Letters, numbers, spaces, and underscores only" block>
                <input
                  type="text"
                  value={username()}
                  onInput={(e) => setUsername(e.currentTarget.value.replace(/[^a-zA-Z0-9_ ]/g, ""))}
                  required minLength={3} maxLength={20}
                  pattern="[a-zA-Z0-9_ ]+"
                  placeholder="how shall the chronicle name you?"
                />
                </Tooltip>
              </div>
            </Show>

            <div class="lg-field">
              <label>Raven post (email)</label>
              <input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                required
                placeholder="where word may reach you"
              />
            </div>

            <div class="lg-field">
              <label>Seal word (password)</label>
              <input
                type="password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                required minLength={6}
                placeholder="known to you alone"
              />
            </div>

            <button type="submit" class="lgb-submit" disabled={loading()} data-no-click-sound>
              {loading()
                ? "Dipping the quill..."
                : isRegister() ? "Begin the chronicle" : "Continue the chronicle"}
            </button>
            <Show when={loading()}>
              <p class="lg-cold-start">Waking up the server... this can take up to 30 seconds.</p>
            </Show>
          </form>

          <p class="lg-deed-or">or</p>
          <div class="lg-google" ref={googleBtnRef} />

          <p class="lg-deed-switch">
            {isRegister() ? "Already keep a chronicle?" : "No chronicle yet?"}{" "}
            <span onClick={() => { setIsRegister(!isRegister()); setError(""); }}>
              {isRegister() ? "Continue yours" : "Begin one"}
            </span>
          </p>
        </div>

        {/* The leather cover. Only rendered for first-time visitors — once a
            login has succeeded on this device, the book opens itself. */}
        <Show when={!alreadyKnown}>
          <div
            class="lgb-cover"
            classList={{ open: opened() }}
            onClick={openCover}
            role="button"
            aria-label="Open the chronicle"
          >
            <div class="lgb-clasp" />
            <h1>The Chronicle<br />of a Frontier Settlement</h1>
            <p class="lgb-cover-sub">being the honest record of its Lord</p>
            <p class="lgb-cover-hint">~ open ~</p>
          </div>
        </Show>
      </div>
    </div>
  );
}
