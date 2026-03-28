export default function Page() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{
        fontFamily: "Montserrat, sans-serif",
        fontSize: "1.75rem",
        fontWeight: 700,
        color: "#D4AF37",
        marginBottom: "1rem",
      }}>
        Email
      </h1>
      <div style={{
        background: "linear-gradient(145deg, #0d1f2d, rgba(10, 22, 40, 0.9))",
        border: "1px solid rgba(212, 175, 55, 0.15)",
        borderRadius: "16px",
        padding: "3rem",
        textAlign: "center",
        color: "rgba(184, 212, 232, 0.6)",
      }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
          Module under construction
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          This module will be migrated in a future session.
        </p>
      </div>
    </div>
  );
}
