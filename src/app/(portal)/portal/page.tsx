export default function PortalPage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "Montserrat, sans-serif",
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#D4AF37",
          marginBottom: "1rem",
        }}
      >
        Client Dashboard
      </h1>
      <div
        style={{
          background: "linear-gradient(145deg, #0d1f0d, rgba(10, 26, 10, 0.9))",
          border: "1px solid rgba(46, 125, 50, 0.3)",
          borderRadius: "16px",
          padding: "3rem",
          textAlign: "center",
          color: "rgba(165, 214, 167, 0.6)",
        }}
      >
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#ffffff" }}>
          Client portal under construction
        </p>
        <p style={{ marginTop: "0.5rem" }}>
          Will be migrated from the existing client portal in Phase 5.
        </p>
      </div>
    </div>
  );
}
