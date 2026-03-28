"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(error || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setLoginError("Invalid username or password");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="login-wrapper">
      {/* Animated background */}
      <div className="login-bg-animation" />

      <div className="login-container">
        {/* Polaris star */}
        <div className="login-star">✦</div>

        {/* Logo */}
        <h1 className="login-title">POLARIS</h1>
        <p className="login-tagline">FINANCIAL SERVICES PORTAL</p>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">
          {loginError && (
            <div className="login-error">
              <span>⚠️</span> {loginError}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <p className="login-footer">
          © 2025 Polaris Financial Services • TPA Analytics Platform
        </p>
      </div>

      <style jsx>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a1a0a;
          position: relative;
          overflow: hidden;
          font-family: 'Open Sans', system-ui, sans-serif;
        }

        .login-bg-animation {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background:
            radial-gradient(ellipse at 20% 80%, rgba(46, 125, 50, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(46, 125, 50, 0.05) 0%, transparent 70%);
          z-index: 0;
        }

        .login-container {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 420px;
        }

        .login-star {
          font-size: 3rem;
          color: #D4AF37;
          text-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          animation: pulseStar 2s ease-in-out infinite;
        }

        @keyframes pulseStar {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.15); filter: brightness(1.4); }
        }

        .login-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: 8px;
          background: linear-gradient(135deg, #D4AF37, #FFD700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0.5rem 0 0;
        }

        .login-tagline {
          color: #a5d6a7;
          font-size: 0.85rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 0.5rem;
          margin-bottom: 2.5rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-error {
          background: rgba(231, 76, 60, 0.15);
          border: 1px solid rgba(231, 76, 60, 0.3);
          color: #ff6b6b;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .login-field {
          text-align: left;
        }

        .login-field label {
          display: block;
          color: #a5d6a7;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.5rem;
        }

        .login-field input {
          width: 100%;
          padding: 0.9rem 1.25rem;
          background: rgba(13, 31, 13, 0.9);
          border: 2px solid rgba(46, 125, 50, 0.3);
          border-radius: 12px;
          color: #e8f5e9;
          font-size: 1rem;
          font-family: inherit;
          outline: none;
          transition: all 0.3s ease;
        }

        .login-field input:focus {
          border-color: #D4AF37;
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.15);
        }

        .login-field input::placeholder {
          color: rgba(165, 214, 167, 0.4);
        }

        .login-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #2E7D32, #4CAF50);
          color: white;
          border: none;
          border-radius: 25px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(46, 125, 50, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          color: rgba(165, 214, 167, 0.4);
          font-size: 0.75rem;
          margin-top: 2.5rem;
        }

        @media (max-width: 480px) {
          .login-container { padding: 2rem 1.5rem; }
          .login-title { font-size: 2rem; letter-spacing: 4px; }
        }
      `}</style>
    </div>
  );
}
