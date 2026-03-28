"use client";

import { useSession, signOut } from "next-auth/react";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a1a0a",
        fontFamily: "'Open Sans', sans-serif",
        color: "#ffffff",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #0a1a0a, #0d1f0d)",
          borderBottom: "1px solid rgba(46, 125, 50, 0.3)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem", color: "#D4AF37" }}>✦</span>
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "3px",
              color: "#D4AF37",
            }}
          >
            POLARIS
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              color: "rgba(165, 214, 167, 0.6)",
              letterSpacing: "1px",
            }}
          >
            Client Portal
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#a5d6a7" }}>
            {session?.user?.clientName || session?.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              background: "rgba(231, 76, 60, 0.15)",
              border: "1px solid rgba(231, 76, 60, 0.3)",
              color: "#ff6b6b",
              padding: "0.4rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontFamily: "inherit",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>
      <main style={{ padding: "2rem" }}>{children}</main>
    </div>
  );
}
