"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company");
  const [saved, setSaved] = useState(false);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">{"\u2699\uFE0F"} Settings</h1>
        <p className="settings-subtitle">System configuration & preferences</p>
      </div>

      {saved && (
        <div className="settings-saved">{"\u2705"} Settings saved successfully!</div>
      )}

      <div className="settings-tabs">
        {[
          { id: "company", label: "Company Profile", icon: "\uD83C\uDFE2" },
          { id: "email", label: "Email Settings", icon: "\uD83D\uDCE7" },
          { id: "users", label: "User Management", icon: "\uD83D\uDC65" },
          { id: "system", label: "System", icon: "\uD83D\uDD27" },
        ].map(tab => (
          <button key={tab.id} className={`settings-tab ${activeTab === tab.id ? "active" : ""}`} onClick={() => setActiveTab(tab.id)}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {/* Company Profile */}
        {activeTab === "company" && (
          <div className="settings-section">
            <h2 className="settings-section-title">{"\uD83C\uDFE2"} Company Profile</h2>
            <div className="settings-form">
              <div className="settings-field">
                <label>Company Name</label>
                <input type="text" defaultValue="Polaris Financial Services Ltd" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Tax Jurisdiction</label>
                <input type="text" defaultValue="Cyprus (12.5% CIT)" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>TIN Number</label>
                <input type="text" defaultValue="12345678X" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Registered Address</label>
                <input type="text" defaultValue="Limassol, Cyprus" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Operating Address</label>
                <input type="text" defaultValue="Piraeus, Greece" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Phone</label>
                <input type="text" defaultValue="+30 210 XXX XXXX" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Website</label>
                <input type="text" defaultValue="www.polarisfinancial.com" className="settings-input" />
              </div>
              <div className="settings-field full">
                <label>Company Description</label>
                <textarea className="settings-textarea" defaultValue="Third Party Administrator (TPA) providing healthcare management services for the maritime industry." rows={3} />
              </div>
            </div>
            <div className="settings-actions">
              <button className="settings-save-btn" onClick={showSaved}>{"\uD83D\uDCBE"} Save Changes</button>
            </div>
          </div>
        )}

        {/* Email Settings */}
        {activeTab === "email" && (
          <div className="settings-section">
            <h2 className="settings-section-title">{"\uD83D\uDCE7"} Email Configuration</h2>
            <div className="settings-form">
              <div className="settings-field">
                <label>Email Provider</label>
                <select className="settings-input" defaultValue="polaris">
                  <option value="polaris">Polaris Default (Built-in)</option>
                  <option value="smtp">Custom SMTP</option>
                  <option value="gmail">Gmail / Google Workspace</option>
                  <option value="outlook">Outlook / Microsoft 365</option>
                </select>
              </div>
              <div className="settings-field">
                <label>From Name</label>
                <input type="text" defaultValue="Polaris Financial Services" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>From Email</label>
                <input type="email" defaultValue="info@polarisfinancial.com" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Reply-To Email</label>
                <input type="email" defaultValue="support@polarisfinancial.com" className="settings-input" />
              </div>
              <div className="settings-field full">
                <label>Email Signature</label>
                <textarea className="settings-textarea" defaultValue={"Best regards,\nPolaris Financial Services\nHealthcare Solutions for the Maritime Industry"} rows={4} />
              </div>
            </div>
            <div className="settings-info-card">
              <div className="settings-info-title">{"\u2139\uFE0F"} Email Settings</div>
              <p>Email configuration can also be managed from the Email Center module. Changes here apply globally to all email templates and automated notifications.</p>
            </div>
            <div className="settings-actions">
              <button className="settings-save-btn" onClick={showSaved}>{"\uD83D\uDCBE"} Save Changes</button>
              <button className="settings-test-btn">{"\uD83D\uDD0D"} Test Connection</button>
            </div>
          </div>
        )}

        {/* User Management */}
        {activeTab === "users" && (
          <div className="settings-section">
            <h2 className="settings-section-title">{"\uD83D\uDC65"} User Management</h2>
            <div className="settings-users-table">
              <table>
                <thead>
                  <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="settings-user-name">Apostolos Kagelaris</td>
                    <td>apostolos@polarisfinancial.com</td>
                    <td><span className="settings-role-badge ceo">CEO</span></td>
                    <td><span className="settings-status-badge active">Active</span></td>
                    <td>Today</td>
                  </tr>
                  <tr>
                    <td className="settings-user-name">Nikos Tsagas</td>
                    <td>nikos@polarisfinancial.com</td>
                    <td><span className="settings-role-badge admin">Admin</span></td>
                    <td><span className="settings-status-badge active">Active</span></td>
                    <td>Today</td>
                  </tr>
                  <tr>
                    <td className="settings-user-name">Maria Papadopoulou</td>
                    <td>maria@polarisfinancial.com</td>
                    <td><span className="settings-role-badge manager">Manager</span></td>
                    <td><span className="settings-status-badge active">Active</span></td>
                    <td>Yesterday</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="settings-actions">
              <button className="settings-add-btn">{"\u2795"} Add User</button>
            </div>
          </div>
        )}

        {/* System */}
        {activeTab === "system" && (
          <div className="settings-section">
            <h2 className="settings-section-title">{"\uD83D\uDD27"} System Preferences</h2>
            <div className="settings-form">
              <div className="settings-field">
                <label>Currency</label>
                <select className="settings-input" defaultValue="USD">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (\u20AC)</option>
                  <option value="GBP">GBP (\u00A3)</option>
                </select>
              </div>
              <div className="settings-field">
                <label>Date Format</label>
                <select className="settings-input" defaultValue="DD/MM/YYYY">
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="settings-field">
                <label>Timezone</label>
                <select className="settings-input" defaultValue="Europe/Athens">
                  <option value="Europe/Athens">Europe/Athens (GMT+3)</option>
                  <option value="Europe/Nicosia">Europe/Nicosia (GMT+3)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="settings-field">
                <label>Language</label>
                <select className="settings-input" defaultValue="en">
                  <option value="en">English</option>
                  <option value="el">Greek</option>
                </select>
              </div>
            </div>

            <h3 className="settings-subsection-title">{"\uD83D\uDCCA"} Polaris Fee Structure</h3>
            <div className="settings-form">
              <div className="settings-field">
                <label>Audit Fee (%)</label>
                <input type="number" defaultValue="15" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Registration Fee ($/member/year)</label>
                <input type="number" defaultValue="24" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Monthly Fee ($/member/month)</label>
                <input type="number" defaultValue="9" className="settings-input" />
              </div>
              <div className="settings-field">
                <label>Dental Fee ($/member/month)</label>
                <input type="number" defaultValue="9.50" step="0.50" className="settings-input" />
              </div>
            </div>

            <h3 className="settings-subsection-title">{"\uD83D\uDEE1\uFE0F"} System Info</h3>
            <div className="settings-info-grid">
              <div className="settings-info-item"><span className="settings-info-label">Platform</span><span className="settings-info-value">Polaris TPA v2.0</span></div>
              <div className="settings-info-item"><span className="settings-info-label">Framework</span><span className="settings-info-value">Next.js 14 + React</span></div>
              <div className="settings-info-item"><span className="settings-info-label">Backend</span><span className="settings-info-value">Google Apps Script (migrating to Azure)</span></div>
              <div className="settings-info-item"><span className="settings-info-label">Database</span><span className="settings-info-value">Google Sheets (migrating to Cosmos DB)</span></div>
              <div className="settings-info-item"><span className="settings-info-label">Auth</span><span className="settings-info-value">NextAuth.js (Azure AD ready)</span></div>
              <div className="settings-info-item"><span className="settings-info-label">Modules</span><span className="settings-info-value">15 active</span></div>
            </div>
            <div className="settings-actions">
              <button className="settings-save-btn" onClick={showSaved}>{"\uD83D\uDCBE"} Save Changes</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .settings-page { padding: 1.5rem 2rem; }
        .settings-header { margin-bottom: 1.5rem; }
        .settings-title { font-family: 'Montserrat', sans-serif; font-size: 1.6rem; font-weight: 800; color: #ffffff; }
        .settings-subtitle { color: #7aa0c0; font-size: 0.9rem; margin-top: 0.25rem; }
        .settings-saved { background: rgba(76,175,80,0.15); border: 1px solid rgba(76,175,80,0.3); color: #81C784; padding: 0.75rem 1.25rem; border-radius: 10px; margin-bottom: 1rem; font-weight: 600; text-align: center; }
        .settings-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .settings-tab { padding: 0.65rem 1.25rem; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.15); color: rgba(255,255,255,0.6); font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .settings-tab.active { background: rgba(212,175,55,0.15); border-color: rgba(212,175,55,0.4); color: #D4AF37; }
        .settings-tab:hover { border-color: rgba(255,255,255,0.2); }
        .settings-content { background: linear-gradient(145deg, #1a3a5c, #15304d); border: 1px solid rgba(212,175,55,0.12); border-radius: 16px; overflow: hidden; }
        .settings-section { padding: 2rem; }
        .settings-section-title { font-family: 'Montserrat', sans-serif; font-size: 1.25rem; font-weight: 700; color: #D4AF37; margin: 0 0 1.5rem 0; padding-bottom: 0.75rem; border-bottom: 2px solid rgba(212,175,55,0.15); }
        .settings-subsection-title { font-family: 'Montserrat', sans-serif; font-size: 1.05rem; font-weight: 700; color: #ffffff; margin: 2rem 0 1rem; }
        .settings-form { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
        .settings-field { }
        .settings-field.full { grid-column: span 2; }
        .settings-field label { display: block; font-size: 0.82rem; color: #7aa0c0; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.3px; }
        .settings-input { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.65rem 0.85rem; color: #ffffff; font-size: 0.9rem; transition: border-color 0.2s; font-family: inherit; }
        .settings-input:focus { outline: none; border-color: rgba(212,175,55,0.5); }
        .settings-input option { background: #0d1f2d; }
        .settings-textarea { width: 100%; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.65rem 0.85rem; color: #ffffff; font-size: 0.9rem; font-family: inherit; resize: vertical; }
        .settings-textarea:focus { outline: none; border-color: rgba(212,175,55,0.5); }
        .settings-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .settings-save-btn { padding: 0.7rem 1.5rem; border-radius: 10px; border: none; background: linear-gradient(135deg, #D4AF37, #c49932); color: #0a1628; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: 'Montserrat', sans-serif; transition: all 0.2s; }
        .settings-save-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(212,175,55,0.3); }
        .settings-test-btn { padding: 0.7rem 1.5rem; border-radius: 10px; border: 1px solid rgba(33,150,243,0.3); background: rgba(33,150,243,0.1); color: #64B5F6; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: 'Montserrat', sans-serif; }
        .settings-add-btn { padding: 0.7rem 1.5rem; border-radius: 10px; border: 1px solid rgba(76,175,80,0.3); background: rgba(76,175,80,0.1); color: #81C784; font-weight: 700; font-size: 0.9rem; cursor: pointer; font-family: 'Montserrat', sans-serif; }
        .settings-info-card { background: rgba(33,150,243,0.08); border: 1px solid rgba(33,150,243,0.2); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; }
        .settings-info-title { font-weight: 700; color: #64B5F6; margin-bottom: 0.5rem; }
        .settings-info-card p { color: rgba(255,255,255,0.6); font-size: 0.88rem; line-height: 1.5; }
        .settings-users-table { overflow-x: auto; margin-bottom: 1rem; }
        .settings-users-table table { width: 100%; border-collapse: collapse; }
        .settings-users-table th { text-align: left; padding: 0.85rem 1rem; color: #D4AF37; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid rgba(212,175,55,0.2); }
        .settings-users-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); font-size: 0.9rem; }
        .settings-user-name { font-weight: 700; color: #ffffff; }
        .settings-role-badge { padding: 0.2rem 0.6rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }
        .settings-role-badge.ceo { background: rgba(212,175,55,0.15); color: #D4AF37; }
        .settings-role-badge.admin { background: rgba(33,150,243,0.15); color: #64B5F6; }
        .settings-role-badge.manager { background: rgba(76,175,80,0.15); color: #81C784; }
        .settings-status-badge { padding: 0.2rem 0.6rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }
        .settings-status-badge.active { background: rgba(76,175,80,0.15); color: #4CAF50; }
        .settings-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
        .settings-info-item { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.85rem 1rem; }
        .settings-info-label { display: block; font-size: 0.75rem; color: #7aa0c0; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 0.25rem; }
        .settings-info-value { font-weight: 700; color: #ffffff; font-size: 0.95rem; }
        @media (max-width: 768px) { .settings-form { grid-template-columns: 1fr; } .settings-field.full { grid-column: span 1; } .settings-info-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
