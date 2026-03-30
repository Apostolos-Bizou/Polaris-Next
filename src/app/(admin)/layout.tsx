"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "📊", href: "/dashboard" },
  { label: "Clients", icon: "🏢", href: "/clients" },
  { label: "Members", icon: "👥", href: "/members" },
  { label: "Offers", icon: "📝", href: "/offers" },
  { label: "Contracts", icon: "📋", href: "/contracts" },
  { label: "Compare", icon: "⚖️", href: "/compare" },
  { label: "Email Center", icon: "📧", href: "/email" },
  { label: "Reports", icon: "📄", href: "/reports" },
  { label: "Renewals", icon: "🔄", href: "/renewals" },
  { label: "CEO Finance", icon: "💰", href: "/ceo-finance" },
  { label: "Follow-ups", icon: "📌", href: "/follow-ups" },
  { label: "Settings", icon: "⚙️", href: "/settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const userName = session?.user?.name || "Admin";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="admin-layout">
      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-star">✦</span>
          {sidebarOpen && (
            <div className="sidebar-logo-text">
              <span className="sidebar-brand">POLARIS</span>
              <span className="sidebar-sub">Portal</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`} onClick={(e) => { if (pathname.startsWith(item.href)) { e.preventDefault(); router.push(item.href); router.refresh(); } }}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {sidebarOpen && (
                  <span className="sidebar-link-label">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitials}</div>
          {sidebarOpen && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{userName}</span>
              <button
                className="sidebar-logout"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main
        className="admin-main"
        style={{ marginLeft: sidebarOpen ? "260px" : "72px" }}
      >
        {children}
      </main>

      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          background: #3d5a80;
          font-family: 'Open Sans', sans-serif;
          color: #ffffff;
        }

        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 10001;
          background: #0a1628;
          color: #D4AF37;
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 1.25rem;
          cursor: pointer;
        }

        /* ─── Sidebar ──────────────────────────────── */
        .admin-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          background: linear-gradient(180deg, #0a1628 0%, #1e3a5f 100%);
          border-right: 1px solid rgba(212, 175, 55, 0.15);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          z-index: 10000;
          overflow-x: hidden;
        }

        .admin-sidebar.open {
          width: 260px;
        }
        .admin-sidebar.closed {
          width: 72px;
        }

        /* Logo */
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.25rem 1rem;
          border-bottom: 1px solid rgba(212, 175, 55, 0.15);
        }

        .sidebar-star {
          font-size: 1.75rem;
          color: #D4AF37;
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
          flex-shrink: 0;
        }

        .sidebar-logo-text {
          display: flex;
          flex-direction: column;
          white-space: nowrap;
        }

        .sidebar-brand {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: 3px;
          background: linear-gradient(135deg, #D4AF37, #FFD700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-sub {
          font-size: 0.65rem;
          color: rgba(184, 212, 232, 0.6);
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 0.75rem 0.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border-radius: 10px;
          text-decoration: none;
          color: rgba(184, 212, 232, 0.7);
          font-size: 0.88rem;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .sidebar-link.active {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05));
          color: #D4AF37;
          border: 1px solid rgba(212, 175, 55, 0.2);
        }

        .sidebar-link-icon {
          font-size: 1.1rem;
          width: 28px;
          text-align: center;
          flex-shrink: 0;
        }

        /* User */
        .sidebar-user {
          padding: 1rem;
          border-top: 1px solid rgba(212, 175, 55, 0.15);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #D4AF37, #f5d76e);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          color: #0a1628;
          flex-shrink: 0;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
          white-space: nowrap;
        }

        .sidebar-user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
        }

        .sidebar-logout {
          background: none;
          border: none;
          color: rgba(184, 212, 232, 0.5);
          font-size: 0.75rem;
          cursor: pointer;
          padding: 0;
          text-align: left;
          font-family: inherit;
          transition: color 0.2s;
        }

        .sidebar-logout:hover {
          color: #e74c3c;
        }

        /* ─── Main content ─────────────────────────── */
        .admin-main {
          min-height: 100vh;
          transition: margin-left 0.3s ease;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(27, 94, 32, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
            #3d5a80;
          padding: 2rem;
        }

        /* ─── Responsive ───────────────────────────── */
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block; }
          .admin-sidebar {
            transform: translateX(-100%);
            width: 260px !important;
          }
          .admin-sidebar.open {
            transform: translateX(0);
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
          }
          .admin-main {
            margin-left: 0 !important;
            padding: 1rem;
            padding-top: 4rem;
          }
        }
      `}</style>
    </div>
  );
}

