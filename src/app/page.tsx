import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* Animated background */}
      <div className="landing-bg" />

      <div className="landing-container">
        {/* Logo section */}
        <div className="landing-logo-section">
          <span className="landing-star">✦</span>
          <h1 className="landing-title">POLARIS</h1>
          <p className="landing-tagline">FINANCIAL SERVICES PORTAL</p>
        </div>

        {/* Portal cards */}
        <div className="landing-portals">
          <Link href="/login?callbackUrl=/dashboard" className="portal-card admin">
            <span className="portal-icon">🏢</span>
            <h2 className="portal-title admin-title">ADMIN</h2>
            <span className="portal-btn admin-btn">WELCOME →</span>
          </Link>

          <Link href="/login?callbackUrl=/portal" className="portal-card client">
            <span className="portal-icon">👤</span>
            <h2 className="portal-title client-title">CLIENTS</h2>
            <span className="portal-btn client-btn">WELCOME →</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        © 2025 <span className="footer-gold">Polaris Financial Services</span> • TPA Analytics Platform
      </footer>

      <style jsx>{`
        .landing-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a1a0a;
          position: relative;
          overflow: hidden;
          font-family: 'Open Sans', system-ui, sans-serif;
        }

        .landing-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background:
            radial-gradient(ellipse at 20% 80%, rgba(46, 125, 50, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(46, 125, 50, 0.05) 0%, transparent 70%);
          z-index: 0;
        }

        .landing-container {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 2rem;
        }

        .landing-logo-section {
          margin-bottom: 3rem;
        }

        .landing-star {
          font-size: 4rem;
          display: inline-block;
          color: #D4AF37;
          text-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
          to { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.8)); }
        }

        .landing-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: 8px;
          background: linear-gradient(135deg, #D4AF37, #FFD700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0.5rem 0 0;
        }

        .landing-tagline {
          color: #a5d6a7;
          font-size: 1.1rem;
          margin-top: 1rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .landing-portals {
          display: flex;
          gap: 3rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 2.5rem;
        }

        .portal-card {
          background: linear-gradient(145deg, #0d1f0d, rgba(10, 26, 10, 0.9));
          border: 2px solid rgba(46, 125, 50, 0.3);
          border-radius: 24px;
          padding: 2rem;
          width: 280px;
          height: 280px;
          text-decoration: none;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }

        .portal-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .portal-card:hover {
          transform: translateY(-10px);
        }

        .portal-card:hover::before {
          opacity: 1;
        }

        .portal-card.admin {
          border-color: rgba(25, 118, 210, 0.3);
        }
        .portal-card.admin:hover {
          border-color: #1976D2;
          box-shadow: 0 20px 60px rgba(25, 118, 210, 0.3);
        }
        .portal-card.admin::before {
          background: linear-gradient(90deg, #1565C0, #42A5F5);
        }

        .portal-card.client:hover {
          border-color: #2E7D32;
          box-shadow: 0 20px 60px rgba(46, 125, 50, 0.3);
        }
        .portal-card.client::before {
          background: linear-gradient(90deg, #2E7D32, #D4AF37);
        }

        .portal-icon {
          font-size: 5rem;
          display: block;
        }

        .portal-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .admin-title { color: #42A5F5; }
        .client-title { color: #D4AF37; }

        .portal-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 2rem;
          border-radius: 25px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s;
          color: white;
        }

        .admin-btn { background: linear-gradient(135deg, #1565C0, #1976D2); }
        .client-btn { background: linear-gradient(135deg, #2E7D32, #4CAF50); }

        .portal-card:hover .portal-btn {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .landing-footer {
          position: fixed;
          bottom: 2rem;
          left: 0; right: 0;
          text-align: center;
          color: rgba(165, 214, 167, 0.5);
          font-size: 0.85rem;
          z-index: 1;
        }

        .footer-gold { color: #D4AF37; }

        @media (max-width: 768px) {
          .landing-wrapper { overflow: auto; padding: 1rem 0; }
          .landing-title { font-size: 2.5rem; letter-spacing: 4px; }
          .landing-star { font-size: 3rem; }
          .landing-tagline { font-size: 0.85rem; }
          .landing-portals {
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .portal-card { width: 85%; max-width: 260px; height: 240px; }
          .portal-icon { font-size: 3.5rem; }
          .portal-title { font-size: 1.4rem; }
          .landing-footer { position: relative; margin-top: 2rem; bottom: auto; }
        }

        @media (max-width: 480px) {
          .landing-title { font-size: 2rem; letter-spacing: 3px; }
          .landing-star { font-size: 2.5rem; }
          .portal-card { width: 90%; max-width: 240px; height: 220px; }
        }
      `}</style>
    </div>
  );
}
