import { useLocation } from "@solidjs/router";

export default function ComingSoon() {
  const location = useLocation();
  const pageName = () => {
    const path = location.pathname.slice(1);
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        "align-items": "center",
        "justify-content": "center",
        height: "60vh",
        "text-align": "center",
      }}
    >
      <div style={{ "font-size": "4rem", "margin-bottom": "16px" }}>🚧</div>
      <h1 class="page-title">{pageName()}</h1>
      <p style={{ color: "var(--text-secondary)", "max-width": "400px" }}>
        This area of the realm is still being constructed. Your builders are working hard!
      </p>
    </div>
  );
}
