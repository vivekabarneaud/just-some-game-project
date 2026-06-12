import { For, Show, Switch, Match, createSignal, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { register, login, googleLogin, GOOGLE_CLIENT_ID } from "~/api/auth";
import { getGlobalSeason } from "~/data/seasons";
import { getAmbientWeather } from "~/data/weather";

// ─── Paper-theater backdrop ─────────────────────────────────────────────────
// Layered cardboard-cutout night landscape behind the login deed. The weather
// is the REAL ambient weather for the current global season, so the page
// breathes with the same sky as the game behind it.

const spread = (i: number, salt: number) => {
  const v = Math.sin((i + 1) * (12.9898 + salt)) * 43758.5453;
  return v - Math.floor(v); // 0..1, stable per index
};

const STARS = Array.from({ length: 70 }, (_, i) => ({
  left: spread(i, 1) * 100,
  top: spread(i, 5) * 55,
  size: 0.8 + spread(i, 9) * 2.2,
  delay: spread(i, 13) * 3,
}));
const RAIN = Array.from({ length: 44 }, (_, i) => ({
  left: spread(i, 2) * 100,
  duration: 0.9 + spread(i, 6) * 0.8,
  delay: -spread(i, 10) * 2,
}));
const SNOW = Array.from({ length: 30 }, (_, i) => ({
  left: spread(i, 3) * 100,
  size: 2 + spread(i, 7) * 4,
  duration: 7 + spread(i, 11) * 6,
  delay: -spread(i, 15) * 12,
}));
const MOTES = Array.from({ length: 14 }, (_, i) => ({
  left: spread(i, 4) * 100,
  size: 2.5 + spread(i, 8) * 4,
  duration: 7 + spread(i, 12) * 7,
  delay: -spread(i, 16) * 12,
}));

function LoginBackdrop() {
  const info = getGlobalSeason();
  const weather = getAmbientWeather(info.season, info.progress, info.year);

  return (
    <div class="lg-backdrop" aria-hidden="true">
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
      <div class="lg-moon" />

      <Switch>
        <Match when={weather === "rain" || weather === "fog"}>
          <For each={RAIN}>
            {(d) => (
              <span class="lg-drop" style={{ left: `${d.left}%`, "animation-duration": `${d.duration}s`, "animation-delay": `${d.delay}s` }} />
            )}
          </For>
        </Match>
        <Match when={weather === "snow"}>
          <For each={SNOW}>
            {(f) => (
              <span class="lg-flake" style={{ left: `${f.left}%`, width: `${f.size}px`, height: `${f.size}px`, "animation-duration": `${f.duration}s`, "animation-delay": `${f.delay}s` }} />
            )}
          </For>
        </Match>
        <Match when={weather === "clear"}>
          <For each={MOTES}>
            {(m) => (
              <span class="lg-mote" style={{ left: `${m.left}%`, width: `${m.size}px`, height: `${m.size}px`, "animation-duration": `${m.duration}s`, "animation-delay": `${m.delay}s` }} />
            )}
          </For>
        </Match>
      </Switch>

      {/* Layered cutout hills: back ridge carries the old watch; the middle
          hill carries the settlement roofs; the front line carries trees. */}
      <div class="lg-hill lg-hill-back">
        <svg preserveAspectRatio="none" viewBox="0 0 1200 300">
          <path d="M0,300 L0,170 Q140,100 290,150 L370,120 L372,62 L366,62 L372,46 L408,46 L414,62 L408,62 L410,110 Q420,105 470,125 Q650,60 820,140 Q1000,90 1200,160 L1200,300 Z" fill="#232c4e" />
        </svg>
      </div>
      <div class="lg-hill lg-hill-mid">
        <svg preserveAspectRatio="none" viewBox="0 0 1200 220">
          <path d="M0,220 L0,120 Q200,40 430,110 Q600,150 780,90 Q1000,30 1200,110 L1200,220 Z" fill="#1a2240" />
          <path d="M560,118 l16,-14 16,14 Z M590,122 l13,-11 13,11 Z M620,118 l15,-13 15,13 Z" fill="#10172e" />
        </svg>
      </div>
      <div class="lg-hill lg-hill-front">
        <svg preserveAspectRatio="none" viewBox="0 0 1200 140">
          <path d="M0,140 L0,80 Q260,20 520,70 Q800,110 1200,50 L1200,140 Z" fill="#121831" />
          <path d="M150,80 l10,-22 10,22 Z M172,84 l9,-19 9,19 Z M950,62 l11,-24 11,24 Z M974,66 l9,-20 9,20 Z" fill="#0c1124" />
        </svg>
      </div>
    </div>
  );
}

// ─── The land-grant deed ────────────────────────────────────────────────────

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  let googleBtnRef: HTMLDivElement | undefined;

  onMount(() => {
    // Load Google Identity Services and render the official button. The
    // callback receives an ID-token credential we trade for our own session.
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
            navigate("/", { replace: true });
          } catch (err: any) {
            setError(err.message || "Google sign-in failed");
          } finally {
            setLoading(false);
          }
        },
      });
      g.accounts.id.renderButton(googleBtnRef, {
        theme: "outline", size: "large", width: 300,
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
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="lg-page">
      <LoginBackdrop />

      {/* The deed is nailed to a wooden notice board on a post planted in the
          scene — in a paper-theater world, nothing floats. */}
      <div class="lg-board-wrap">
        <div class="lg-post" />
        <div class="lg-board">
          <div class="lg-deed">
        <div class="lg-deed-eyebrow">By order of the Crown of the Ashenmark</div>
        <h1 class="lg-deed-title">{isRegister() ? "A Grant of Land" : "A Returning Settler"}</h1>
        <hr class="lg-deed-rule" />
        <p class="lg-deed-body">
          {isRegister()
            ? "Be it known that the bearer is hereby granted freehold upon the southern frontier, to settle, work, and defend."
            : "Present your grant, and the frontier will remember you."}
        </p>

        <Show when={error()}>
          <div class="lg-deed-error">{error()}</div>
        </Show>

        <form onSubmit={handleSubmit}>
          <Show when={isRegister()}>
            <div class="lg-field">
              <label>Name of the grantee</label>
              <input
                type="text"
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value.replace(/[^a-zA-Z0-9_ ]/g, ""))}
                required minLength={3} maxLength={20}
                pattern="[a-zA-Z0-9_ ]+"
                title="Letters, numbers, spaces, and underscores only"
                placeholder="how shall the deed read?"
              />
            </div>
          </Show>

          <div class="lg-field">
            <label>Raven post (email)</label>
            <input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              placeholder="where the Crown may reach you"
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

          <div class="lg-seal-row">
            <button type="submit" class="lg-wax-seal" disabled={loading()} data-no-click-sound>
              {loading() ? "SEALING..." : isRegister() ? "TAKE UP YOUR GRANT" : "PRESENT YOUR GRANT"}
            </button>
          </div>
          <Show when={loading()}>
            <p class="lg-cold-start">Waking up the server... this can take up to 30 seconds.</p>
          </Show>
        </form>

        <p class="lg-deed-or">or present credentials from afar</p>
        <div class="lg-google" ref={googleBtnRef} />

        <p class="lg-deed-switch">
          {isRegister() ? "Already hold a grant?" : "New to the frontier?"}{" "}
          <span onClick={() => { setIsRegister(!isRegister()); setError(""); }}>
            {isRegister() ? "Present it" : "Claim your grant"}
          </span>
        </p>
          </div>
          <span class="lg-nail lg-nail-tl" />
          <span class="lg-nail lg-nail-tr" />
          <span class="lg-nail lg-nail-bl" />
          <span class="lg-nail lg-nail-br" />
        </div>
      </div>
    </div>
  );
}
