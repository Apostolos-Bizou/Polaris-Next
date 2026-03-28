"use client";

import type { HospitalData } from "@/hooks/use-dashboard";

interface HospitalsTableProps {
  hospitals: HospitalData[];
}

const fmtUsd = (n: number) =>
  "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export function HospitalsTable({ hospitals }: HospitalsTableProps) {
  if (!hospitals.length) return null;

  const totalCost = hospitals.reduce((a, h) => a + (h.cost_usd || 0), 0);
  const top10 = hospitals.slice(0, 10);

  return (
    <div className="section-polaris">
      <h2 className="section-title-polaris">🏥 Top Hospitals</h2>
      <div className="hosp-card">
        <div className="hosp-table-wrapper">
          <table className="hosp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Hospital</th>
                <th>Claims</th>
                <th>Cost</th>
                <th>Avg Claim</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((h, i) => (
                <tr key={i}>
                  <td>
                    <span
                      className="hosp-rank"
                      style={{
                        background: i < 3 ? "#D4AF37" : "#2E7D32",
                      }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td>
                    <strong>{h.name}</strong>
                    <br />
                    <small className="hosp-city">
                      {h.city || ""} {h.region ? `(${h.region})` : ""}
                    </small>
                  </td>
                  <td>{(h.claims || 0).toLocaleString()}</td>
                  <td>{fmtUsd(h.cost_usd || 0)}</td>
                  <td>{fmtUsd(h.avg_claim || 0)}</td>
                  <td>
                    {totalCost > 0
                      ? (((h.cost_usd || 0) / totalCost) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .section-polaris {
          margin-bottom: 2rem;
        }
        .section-title-polaris {
          font-family: "Montserrat", sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.3);
        }
        .hosp-card {
          background: linear-gradient(145deg, #0d1f2d, #0a1628);
          border: 1px solid #2d5070;
          border-radius: 16px;
          padding: 1.25rem;
        }
        .hosp-table-wrapper {
          overflow-x: auto;
        }
        .hosp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .hosp-table th {
          text-align: left;
          padding: 0.75rem 0.5rem;
          color: #7aa0c0;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #2d5070;
        }
        .hosp-table td {
          padding: 0.75rem 0.5rem;
          color: #b8d4e8;
          border-bottom: 1px solid rgba(45, 80, 112, 0.3);
        }
        .hosp-table tr:hover td {
          background: rgba(212, 175, 55, 0.05);
        }
        .hosp-rank {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #000;
        }
        .hosp-city {
          color: #7a8f7a;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
