export default function Jewelcrafting() {
  return (
    <div>
      <h1 class="page-title">💎 Jewelcrafting</h1>
      <div style={{
        padding: "40px 24px",
        background: "var(--bg-secondary)",
        "border-radius": "8px",
        "text-align": "center",
      }}>
        <div style={{ "font-size": "3rem", "margin-bottom": "12px" }}>💎</div>
        <p style={{ color: "var(--text-secondary)", "margin-bottom": "8px" }}>
          Craft rings, amulets, and trinkets that grant unique abilities.
        </p>
        <p style={{ color: "var(--text-muted)", "font-size": "0.85rem" }}>
          Jewelcrafting will let you create powerful trinkets for your adventurers using gems found in dungeons
          and precious metals from the mines.
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
