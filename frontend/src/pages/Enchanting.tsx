export default function Enchanting() {
  return (
    <div>
      <h1 class="page-title">✨ Enchanting</h1>
      <div style={{
        padding: "40px 24px",
        background: "var(--bg-secondary)",
        "border-radius": "8px",
        "text-align": "center",
      }}>
        <div style={{ "font-size": "3rem", "margin-bottom": "12px" }}>✨</div>
        <p style={{ color: "var(--text-secondary)", "margin-bottom": "8px" }}>
          Imbue your weapons and armor with magical properties.
        </p>
        <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
          Enchanting will allow you to add elemental damage, protective wards, and other magical effects to crafted gear.
          Requires a Mage Tower and rare enchanting reagents from missions.
        </p>
        <div style={{
          "margin-top": "16px",
          padding: "10px",
          "border-radius": "6px",
          background: "rgba(167, 139, 250, 0.08)",
          border: "1px solid rgba(167, 139, 250, 0.2)",
          color: "#a78bfa",
          "font-size": "0.8rem",
        }}>
          Coming soon
        </div>
      </div>
    </div>
  );
}
