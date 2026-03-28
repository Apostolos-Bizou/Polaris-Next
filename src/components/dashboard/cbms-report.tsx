'use client';

import { useState, useEffect } from 'react';

interface CBMSData {
  organisations: number;
  claims: number;
  members: number;
  approved_amount: number;
  invoiced_amount: number;
  total_amount: number;
  ex_gratia: number;
  total_incl_exgratia: number;
  average_incl_exgr: number;
  net_average: number;
  per_capita: number;
  paid_to_hm: number;
  charged_to_customer: number;
  fees_to_customer: number;
  total_to_customer: number;
  report_date: string;
}

interface CBMSHistoryRow {
  report_date: string;
  organisations: number;
  claims: number;
  members: number;
  approved_amount: number;
  invoiced_amount: number;
  total_amount: number;
  ex_gratia: number;
  total_incl_exgratia: number;
  average_incl_exgr: number;
  net_average: number;
  per_capita: number;
  paid_to_hm: number;
  charged_to_customer: number;
  fees_to_customer: number;
  total_to_customer: number;
}

// Dummy data for development
const dummyCBMS: CBMSData = {
  organisations: 24,
  claims: 3847,
  members: 12450,
  approved_amount: 8945230.50,
  invoiced_amount: 9123450.75,
  total_amount: 9567890.25,
  ex_gratia: 234567.80,
  total_incl_exgratia: 9802458.05,
  average_incl_exgr: 2548.23,
  net_average: 2325.67,
  per_capita: 787.95,
  paid_to_hm: 7234567.00,
  charged_to_customer: 10345678.50,
  fees_to_customer: 1236758.59,
  total_to_customer: 11582437.09,
  report_date: 'Q1 2025',
};

const dummyHistory: CBMSHistoryRow[] = [
  { report_date: 'Q1 2025', organisations: 24, claims: 3847, members: 12450, approved_amount: 8945230.50, invoiced_amount: 9123450.75, total_amount: 9567890.25, ex_gratia: 234567.80, total_incl_exgratia: 9802458.05, average_incl_exgr: 2548.23, net_average: 2325.67, per_capita: 787.95, paid_to_hm: 7234567.00, charged_to_customer: 10345678.50, fees_to_customer: 1236758.59, total_to_customer: 11582437.09 },
  { report_date: 'Q4 2024', organisations: 22, claims: 3521, members: 11890, approved_amount: 8234560.30, invoiced_amount: 8456780.50, total_amount: 8890120.40, ex_gratia: 198234.50, total_incl_exgratia: 9088354.90, average_incl_exgr: 2581.62, net_average: 2339.80, per_capita: 764.54, paid_to_hm: 6789012.00, charged_to_customer: 9678234.60, fees_to_customer: 1145678.30, total_to_customer: 10823912.90 },
  { report_date: 'Q3 2024', organisations: 21, claims: 3102, members: 11234, approved_amount: 7456890.20, invoiced_amount: 7678901.30, total_amount: 8023456.70, ex_gratia: 178456.20, total_incl_exgratia: 8201912.90, average_incl_exgr: 2642.50, net_average: 2402.85, per_capita: 730.24, paid_to_hm: 6123456.00, charged_to_customer: 8956123.40, fees_to_customer: 1023456.80, total_to_customer: 9979580.20 },
  { report_date: 'Q2 2024', organisations: 20, claims: 2890, members: 10780, approved_amount: 6890123.10, invoiced_amount: 7012345.20, total_amount: 7345678.90, ex_gratia: 156789.30, total_incl_exgratia: 7502468.20, average_incl_exgr: 2596.03, net_average: 2383.78, per_capita: 696.12, paid_to_hm: 5678901.00, charged_to_customer: 8234567.20, fees_to_customer: 967890.40, total_to_customer: 9202457.60 },
];

const PHP_USD_RATE = 56.20;

export default function CBMSReport() {
  const [cbmsData, setCbmsData] = useState<CBMSData>(dummyCBMS);
  const [history, setHistory] = useState<CBMSHistoryRow[]>(dummyHistory);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // In production, this would call the API:
  // useEffect(() => {
  //   async function loadCBMS() {
  //     setLoading(true);
  //     try {
  //       const res = await fetch('/api/proxy/getCBMSReportData');
  //       const result = await res.json();
  //       if (result.success) {
  //         setCbmsData(result.latest);
  //         setHistory(result.aggregated || []);
  //       }
  //     } catch (err) { console.error('CBMS load error:', err); }
  //     setLoading(false);
  //   }
  //   loadCBMS();
  // }, []);

  const fmtPHP = (val: number) => '₱' + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtNum = (val: number) => Math.round(val).toLocaleString();

  const filteredHistory = history.filter(row =>
    searchTerm === '' || row.report_date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Section Divider */}
      <div className="section-divider">
        <span className="divider-icon">📋</span>
        <span className="divider-text">CBMS REPORT TOTALS</span>
      </div>

      {/* Report Summary Stats */}
      <section className="cbms-section">
        <h2 className="section-title">📊 Report Summary</h2>
        <div className="cbms-stats-grid">
          <div className="cbms-stat-card">
            <div className="cbms-stat-icon">🏢</div>
            <div className="cbms-stat-value">{fmtNum(cbmsData.organisations)}</div>
            <div className="cbms-stat-label">Organisations</div>
          </div>
          <div className="cbms-stat-card">
            <div className="cbms-stat-icon">📋</div>
            <div className="cbms-stat-value">{fmtNum(cbmsData.claims)}</div>
            <div className="cbms-stat-label">Total Claims</div>
          </div>
          <div className="cbms-stat-card">
            <div className="cbms-stat-icon">👥</div>
            <div className="cbms-stat-value">{fmtNum(cbmsData.members)}</div>
            <div className="cbms-stat-label">Total Members</div>
          </div>
          <div className="cbms-stat-card highlight-gold">
            <div className="cbms-stat-icon">💰</div>
            <div className="cbms-stat-value">{fmtPHP(cbmsData.approved_amount)}</div>
            <div className="cbms-stat-label">Approved Amount</div>
          </div>
          <div className="cbms-stat-card">
            <div className="cbms-stat-icon">📄</div>
            <div className="cbms-stat-value">{fmtPHP(cbmsData.invoiced_amount)}</div>
            <div className="cbms-stat-label">Invoiced Amount</div>
          </div>
          <div className="cbms-stat-card highlight-green">
            <div className="cbms-stat-icon">💵</div>
            <div className="cbms-stat-value">{fmtPHP(cbmsData.total_amount)}</div>
            <div className="cbms-stat-label">Total Amount</div>
          </div>
        </div>
      </section>

      {/* Financial Breakdown */}
      <section className="cbms-section">
        <h2 className="section-title">💳 Financial Breakdown</h2>
        <div className="cbms-chart-grid">
          <div className="cbms-chart-card">
            <h3 className="cbms-chart-title">📈 Ex Gratia & Totals</h3>
            <div className="cbms-detail-grid">
              <div className="cbms-detail-item">
                <span className="cbms-detail-label">Ex Gratia</span>
                <span className="cbms-detail-value">{fmtPHP(cbmsData.ex_gratia)}</span>
              </div>
              <div className="cbms-detail-item">
                <span className="cbms-detail-label">Total incl Ex Gratia</span>
                <span className="cbms-detail-value">{fmtPHP(cbmsData.total_incl_exgratia)}</span>
              </div>
              <div className="cbms-detail-item">
                <span className="cbms-detail-label">Average incl ExGr</span>
                <span className="cbms-detail-value">{fmtPHP(cbmsData.average_incl_exgr)}</span>
              </div>
              <div className="cbms-detail-item">
                <span className="cbms-detail-label">Net Average</span>
                <span className="cbms-detail-value">{fmtPHP(cbmsData.net_average)}</span>
              </div>
            </div>
          </div>
          <div className="cbms-chart-card">
            <h3 className="cbms-chart-title">💰 Per Capita & Payments</h3>
            <div className="cbms-detail-grid">
              <div className="cbms-detail-item highlight">
                <span className="cbms-detail-label">Per Capita</span>
                <span className="cbms-detail-value gold">{fmtPHP(cbmsData.per_capita)}</span>
              </div>
              <div className="cbms-detail-item">
                <span className="cbms-detail-label">Paid to HM</span>
                <span className="cbms-detail-value">{fmtPHP(cbmsData.paid_to_hm)}</span>
              </div>
              <div className="cbms-detail-item">
                <span className="cbms-detail-label">Charged to Customer</span>
                <span className="cbms-detail-value">{fmtPHP(cbmsData.charged_to_customer)}</span>
              </div>
              <div className="cbms-detail-item">
                <span className="cbms-detail-label">Fees to Customer</span>
                <span className="cbms-detail-value">{fmtPHP(cbmsData.fees_to_customer)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Total to Customer Banner */}
      <section className="cbms-section">
        <div className="cbms-total-banner">
          <div className="cbms-total-label">💎 TOTAL TO CUSTOMER</div>
          <div className="cbms-total-value">{fmtPHP(cbmsData.total_to_customer)}</div>
          <div className="cbms-total-subtext">Combined charges and fees billed to customers</div>
        </div>
      </section>

      {/* Historical Data Table */}
      <section className="cbms-section">
        <div className="table-container">
          <div className="table-header">
            <h3 className="section-title" style={{ margin: 0 }}>📅 Historical Data</h3>
            <input
              type="text"
              className="table-search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Period</th>
                  <th>Members</th>
                  <th>Claims</th>
                  <th>PHP</th>
                  <th>USD</th>
                  <th>Cost/Member</th>
                  <th>Util %</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((row, i) => {
                  const rank = i + 1;
                  const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
                  const usd = row.approved_amount / PHP_USD_RATE;
                  const cpm = row.members > 0 ? usd / row.members : 0;
                  const util = row.members > 0 ? (row.claims / row.members * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={row.report_date}>
                      <td><span className={`rank-badge ${rankClass}`}>{rank}</span></td>
                      <td><strong>{row.report_date}</strong></td>
                      <td>{fmtNum(row.members)}</td>
                      <td>{fmtNum(row.claims)}</td>
                      <td>₱{Math.round(row.approved_amount).toLocaleString()}</td>
                      <td className="currency">${Math.round(usd).toLocaleString()}</td>
                      <td className="currency">${cpm.toFixed(2)}</td>
                      <td>{util}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <style jsx>{`
        .section-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem 0;
          margin: 2rem 0 0;
        }
        .divider-icon {
          font-size: 2rem;
        }
        .divider-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #D4AF37;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .cbms-section {
          margin-bottom: 2rem;
        }
        .section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8f5e9;
          margin-bottom: 1.5rem;
        }
        .cbms-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
        }
        .cbms-stat-card {
          background: linear-gradient(145deg, rgba(20, 40, 20, 0.9), rgba(10, 26, 10, 0.95));
          border: 1px solid rgba(46, 125, 50, 0.25);
          border-radius: 16px;
          padding: 1.25rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .cbms-stat-card:hover {
          transform: translateY(-3px);
          border-color: rgba(46, 125, 50, 0.5);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        .cbms-stat-card.highlight-gold {
          border-color: rgba(212, 175, 55, 0.4);
          background: linear-gradient(145deg, rgba(212, 175, 55, 0.1), rgba(10, 26, 10, 0.95));
        }
        .cbms-stat-card.highlight-green {
          border-color: rgba(76, 175, 80, 0.4);
          background: linear-gradient(145deg, rgba(76, 175, 80, 0.1), rgba(10, 26, 10, 0.95));
        }
        .cbms-stat-icon {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .cbms-stat-value {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #e8f5e9;
          word-break: break-word;
        }
        .cbms-stat-label {
          font-size: 0.85rem;
          color: #7a8f7a;
          margin-top: 0.25rem;
        }
        .cbms-chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .cbms-chart-card {
          background: linear-gradient(145deg, rgba(20, 40, 20, 0.9), rgba(10, 26, 10, 0.95));
          border: 1px solid rgba(46, 125, 50, 0.25);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .cbms-chart-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #e8f5e9;
          margin-bottom: 1.25rem;
        }
        .cbms-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .cbms-detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(10, 26, 10, 0.5);
          border-radius: 10px;
          border: 1px solid rgba(46, 125, 50, 0.15);
        }
        .cbms-detail-item.highlight {
          border-color: rgba(212, 175, 55, 0.3);
          background: rgba(212, 175, 55, 0.08);
        }
        .cbms-detail-label {
          font-size: 0.85rem;
          color: #7a8f7a;
        }
        .cbms-detail-value {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          color: #e8f5e9;
          font-size: 0.95rem;
        }
        .cbms-detail-value.gold {
          color: #D4AF37;
        }
        .cbms-total-banner {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(46, 125, 50, 0.15));
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
        }
        .cbms-total-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #D4AF37;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .cbms-total-value {
          font-family: 'Montserrat', sans-serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: #e8f5e9;
          text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
        }
        .cbms-total-subtext {
          font-size: 0.9rem;
          color: #7a8f7a;
          margin-top: 0.5rem;
        }
        .table-container {
          background: linear-gradient(145deg, rgba(20, 40, 20, 0.9), rgba(10, 26, 10, 0.95));
          border: 1px solid rgba(46, 125, 50, 0.25);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .table-search {
          background: rgba(10, 26, 10, 0.7);
          border: 1px solid rgba(46, 125, 50, 0.3);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          color: #e8f5e9;
          font-size: 0.9rem;
          width: 200px;
          outline: none;
        }
        .table-search:focus {
          border-color: #D4AF37;
        }
        .table-scroll {
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #D4AF37;
          text-align: left;
          padding: 0.75rem;
          border-bottom: 2px solid rgba(212, 175, 55, 0.2);
          white-space: nowrap;
        }
        .data-table td {
          font-size: 0.9rem;
          color: #b8c9b8;
          padding: 0.75rem;
          border-bottom: 1px solid rgba(46, 125, 50, 0.1);
        }
        .data-table tr:hover td {
          background: rgba(46, 125, 50, 0.08);
        }
        .currency {
          color: #4CAF50;
          font-weight: 600;
        }
        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 700;
          background: rgba(46, 125, 50, 0.2);
          color: #b8c9b8;
        }
        .rank-badge.gold {
          background: #FFD700;
          color: #1a1a1a;
        }
        .rank-badge.silver {
          background: #C0C0C0;
          color: #1a1a1a;
        }
        .rank-badge.bronze {
          background: #CD7F32;
          color: #1a1a1a;
        }

        @media (max-width: 1200px) {
          .cbms-stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .cbms-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .cbms-chart-grid { grid-template-columns: 1fr; }
          .cbms-detail-grid { grid-template-columns: 1fr; }
          .cbms-total-value { font-size: 1.8rem; }
        }
        @media (max-width: 480px) {
          .cbms-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
