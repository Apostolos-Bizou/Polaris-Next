"use client";

import type { ClientOption } from "@/hooks/use-dashboard";

interface QuarterSelectorProps {
  clients: ClientOption[];
  selectedClient: string;
  selectedYear: number;
  selectedQuarters: string[];
  cumulativeMode: boolean;
  compareMode: boolean;
  onClientChange: (clientId: string) => void;
  onYearChange: (year: number) => void;
  onQuarterToggle: (quarter: string) => void;
  onCumulativeToggle: () => void;
  onCompareToggle: () => void;
  onRefresh: () => void;
}

export function QuarterSelector({
  clients,
  selectedClient,
  selectedYear,
  selectedQuarters,
  cumulativeMode,
  compareMode,
  onClientChange,
  onYearChange,
  onQuarterToggle,
  onCumulativeToggle,
  onCompareToggle,
  onRefresh,
}: QuarterSelectorProps) {
  return (
    <div className="qs-wrapper">
      {/* Top row: Client selector + Refresh */}
      <div className="qs-top-row">
        <select
          className="qs-client-select"
          value={selectedClient}
          onChange={(e) => onClientChange(e.target.value)}
        >
          <option value="ALL">🏢 All Clients (Company Total)</option>
          {clients.map((c) => (
            <option key={c.client_id} value={c.client_id}>
              {c.has_subsidiaries ? "📂 " : ""}
              {c.company_name}
            </option>
          ))}
        </select>
        <button className="qs-refresh-btn" onClick={onRefresh}>
          🔄 Refresh Data
        </button>
      </div>

      {/* Quarter row */}
      <div className="qs-quarter-row">
        <div className="qs-left">
          <span className="qs-label">📅 Select Period:</span>
          <div className="qs-buttons">
            {["Q1", "Q2", "Q3", "Q4"].map((q) => (
              <button
                key={q}
                className={`qs-btn ${selectedQuarters.includes(q) ? "active" : ""}`}
                onClick={() => onQuarterToggle(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <select
            className="qs-year-select"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>
        <div className="qs-right">
          <button
            className={`qs-mode-btn ${cumulativeMode ? "active-green" : ""}`}
            onClick={onCumulativeToggle}
          >
            📊 {cumulativeMode ? "Cumulative" : "Single Period"}
          </button>
          <button
            className={`qs-mode-btn ${compareMode ? "active-gold" : ""}`}
            onClick={onCompareToggle}
          >
            ⚖️ Compare Quarters
          </button>
          <span className="qs-badge">
            {selectedQuarters.join(compareMode ? " vs " : ", ")} {selectedYear}
          </span>
        </div>
      </div>

      <style jsx>{`
        .qs-wrapper {
          margin-bottom: 1.5rem;
        }
        .qs-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .qs-client-select {
          flex: 1;
          max-width: 400px;
          padding: 0.6rem 1rem;
          background: linear-gradient(135deg, #1e3a5f, #2d4a6f);
          border: 2px solid #3d5a80;
          border-radius: 10px;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .qs-refresh-btn {
          padding: 0.6rem 1.25rem;
          background: linear-gradient(135deg, #1e3a5f, #2d5a87);
          border: 2px solid #d4af37;
          border-radius: 10px;
          color: #d4af37;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          font-family: "Montserrat", sans-serif;
          transition: all 0.3s;
        }
        .qs-refresh-btn:hover {
          background: linear-gradient(135deg, #2d5a87, #3d6a97);
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }
        .qs-quarter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #0a1628, #1e3a5f);
          border: 1px solid #2d5070;
          border-radius: 12px;
        }
        .qs-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .qs-label {
          font-size: 0.85rem;
          color: rgba(184, 212, 232, 0.7);
          font-weight: 600;
        }
        .qs-buttons {
          display: flex;
          gap: 0.35rem;
        }
        .qs-btn {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #1e3a5f, #2d4a6f);
          border: 2px solid #3d5a80;
          border-radius: 8px;
          color: white;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          font-family: "Montserrat", sans-serif;
        }
        .qs-btn:hover {
          border-color: #d4af37;
        }
        .qs-btn.active {
          background: linear-gradient(135deg, #d4af37, #f5d76e);
          border-color: #d4af37;
          color: #0a1628;
        }
        .qs-year-select {
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, #1e3a5f, #2d4a6f);
          border: 2px solid #3d5a80;
          border-radius: 8px;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }
        .qs-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .qs-mode-btn {
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, #1e3a5f, #2d4a6f);
          border: 2px solid #3d5a80;
          border-radius: 8px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
        }
        .qs-mode-btn.active-green {
          background: linear-gradient(135deg, #1a4a3a, #2d6a5a);
          border-color: #4caf50;
          color: #4caf50;
        }
        .qs-mode-btn.active-gold {
          background: linear-gradient(135deg, #3d3010, #5a4a20);
          border-color: #d4af37;
          color: #d4af37;
        }
        .qs-badge {
          padding: 0.4rem 0.75rem;
          background: rgba(212, 175, 55, 0.15);
          border: 1px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          color: #d4af37;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: "Montserrat", sans-serif;
        }
        @media (max-width: 768px) {
          .qs-quarter-row {
            flex-direction: column;
            align-items: stretch;
          }
          .qs-left,
          .qs-right {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
