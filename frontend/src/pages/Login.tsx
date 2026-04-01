import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { register, login } from "~/api/auth";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

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
    <div style={{
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      height: "100vh",
      background: "var(--bg-primary)",
    }}>
      <div style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border-color)",
        "border-radius": "12px",
        padding: "2.5rem",
        width: "380px",
        "max-width": "90vw",
      }}>
        <h1 style={{
          "font-family": "var(--font-heading)",
          color: "var(--accent-gold)",
          "text-align": "center",
          "margin-bottom": "0.5rem",
          "font-size": "1.8rem",
        }}>
          Medieval Realm
        </h1>
        <p style={{
          "text-align": "center",
          color: "var(--text-secondary)",
          "margin-bottom": "1.5rem",
          "font-size": "0.9rem",
        }}>
          {isRegister() ? "Create your account" : "Welcome back, adventurer"}
        </p>

        {error() && (
          <div style={{
            background: "rgba(231, 76, 60, 0.15)",
            border: "1px solid var(--accent-red)",
            "border-radius": "6px",
            padding: "0.5rem 0.75rem",
            "margin-bottom": "1rem",
            color: "var(--accent-red)",
            "font-size": "0.85rem",
          }}>
            {error()}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister() && (
            <div style={{ "margin-bottom": "1rem" }}>
              <label style={{ display: "block", color: "var(--text-secondary)", "font-size": "0.85rem", "margin-bottom": "0.3rem" }}>
                Username
              </label>
              <input
                type="text"
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
                required
                minLength={3}
                maxLength={20}
                style={inputStyle}
                placeholder="Your name in the realm"
              />
            </div>
          )}

          <div style={{ "margin-bottom": "1rem" }}>
            <label style={{ display: "block", color: "var(--text-secondary)", "font-size": "0.85rem", "margin-bottom": "0.3rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              style={inputStyle}
              placeholder="your@email.com"
            />
          </div>

          <div style={{ "margin-bottom": "1.5rem" }}>
            <label style={{ display: "block", color: "var(--text-secondary)", "font-size": "0.85rem", "margin-bottom": "0.3rem" }}>
              Password
            </label>
            <input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              minLength={6}
              style={inputStyle}
              placeholder="At least 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading()}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "var(--accent-gold)",
              color: "var(--bg-primary)",
              border: "none",
              "border-radius": "6px",
              "font-weight": "bold",
              "font-size": "1rem",
              cursor: loading() ? "wait" : "pointer",
              opacity: loading() ? "0.7" : "1",
            }}
          >
            {loading()
              ? "Loading..."
              : isRegister()
              ? "Create Account"
              : "Enter the Realm"}
          </button>
        </form>

        <p style={{
          "text-align": "center",
          "margin-top": "1rem",
          color: "var(--text-secondary)",
          "font-size": "0.85rem",
        }}>
          {isRegister() ? "Already have an account?" : "New to the realm?"}{" "}
          <span
            onClick={() => { setIsRegister(!isRegister()); setError(""); }}
            style={{ color: "var(--accent-gold)", cursor: "pointer", "text-decoration": "underline" }}
          >
            {isRegister() ? "Log in" : "Create account"}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-color)",
  "border-radius": "6px",
  color: "var(--text-primary)",
  "font-size": "0.95rem",
  outline: "none",
};
