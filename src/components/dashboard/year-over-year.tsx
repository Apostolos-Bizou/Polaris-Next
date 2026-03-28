'use client';

import { useRef, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

interface YoYData {
  data2024: { claims: number; cost: number; members: number };
  data2025: { claims: number; cost: number; members: number };
  quarterly: {
    '2024': { Q1: { claims: number; cost: number }; Q2: { claims: number; cost: number }; Q3: { claims: number; cost: number }; Q4: { claims: number; cost: number } };
    '2025': { Q1: { claims: number; cost: number }; Q2: { claims: number; cost: number }; Q3: { claims: number; cost: number }; Q4: { claims: number; cost: number } };
  };
}

interface Props {
  yearOverYear?: YoYData | null;
  currentYear?: number;
}

// Dummy data for development
const dummyYoY: YoYData = {
  data2024: { claims: 11234, cost: 345678, members: 10890 },
  data2025: { claims: 12580, cost: 378450, members: 12450 },
  quarterly: {
    '2024': { Q1: { claims: 2456, cost: 78900 }, Q2: { claims: 2890, cost: 89200 }, Q3: { claims: 3012, cost: 92340 }, Q4: { claims: 2876, cost: 85238 } },
    '2025': { Q1: { claims: 3120, cost: 94500 }, Q2: { claims: 3250, cost: 98700 }, Q3: { claims: 3340, cost: 101200 }, Q4: { claims: 2870, cost: 84050 } },
  },
};

const fmt = (n: number) => n.toLocaleString();

export default function YearOverYear({ yearOverYear, currentYear = 2025 }: Props) {
  const yoy = yearOverYear || dummyYoY;
  const prevYear = currentYear - 1;

  const d2024 = yoy.data2024 || { claims: 0, cost: 0, members: 0 };
  const d2025 = yoy.data2025 || { claims: 0, cost: 0, members: 0 };
  const q2024 = yoy.quarterly?.['2024'] || { Q1: { claims: 0, cost: 0 }, Q2: { claims: 0, cost: 0 }, Q3: { claims: 0, cost: 0 }, Q4: { claims: 0, cost: 0 } };
  const q2025 = yoy.quarterly?.['2025'] || { Q1: { claims: 0, cost: 0 }, Q2: { claims: 0, cost: 0 }, Q3: { claims: 0, cost: 0 }, Q4: { claims: 0, cost: 0 } };

  const has2024 = d2024.claims > 0 || d2024.cost > 0;

  const calcChange = (curr: number, prev: number): string | null => {
    if (!has2024 || prev === 0) return null;
    return ((curr - prev) / prev * 100).toFixed(0);
  };

  const claimsChange = calcChange(d2025.claims, d2024.claims);
  const costChange = calcChange(d2025.cost, d2024.cost);
  const memberChange = calcChange(d2025.members, d2024.members);
  const cpm2024 = d2024.members > 0 ? d2024.cost / d2024.members : 0;
  const cpm2025 = d2025.members > 0 ? d2025.cost / d2025.members : 0;
  const cpmChange = calcChange(cpm2025, cpm2024);

  const fmtChange = (val: string | null) => val !== null ? ((parseFloat(val) > 0 ? '+' : '') + val + '%') : 'N/A';
  const changeColor = (val: string | null) => {
    if (val === null) return '#b8c9b8';
    const v = parseFloat(val);
    return v > 0 ? '#4CAF50' : v < 0 ? '#e74c3c' : '#b8c9b8';
  };

  const darkChartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const, labels: { color: '#b8c9b8', font: { size: 14, weight: 'bold' as const }, padding: 20 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#b8c9b8' } },
      y: { grid: { color: 'rgba(30,58,30,0.3)' }, ticks: { color: '#7a8f7a' } },
    },
  };

  const claimsChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      { label: `${prevYear}`, data: [q2024.Q1.claims, q2024.Q2.claims, q2024.Q3.claims, q2024.Q4.claims], backgroundColor: 'rgba(122,143,122,0.7)', borderRadius: 4 },
      { label: `${currentYear}`, data: [q2025.Q1.claims, q2025.Q2.claims, q2025.Q3.claims, q2025.Q4.claims], backgroundColor: 'rgba(212,175,55,0.8)', borderRadius: 4 },
    ],
  };

  const costChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      { label: `${prevYear}`, data: [q2024.Q1.cost, q2024.Q2.cost, q2024.Q3.cost, q2024.Q4.cost], backgroundColor: 'rgba(122,143,122,0.7)', borderRadius: 4 },
      { label: `${currentYear}`, data: [q2025.Q1.cost, q2025.Q2.cost, q2025.Q3.cost, q2025.Q4.cost], backgroundColor: 'rgba(76,175,80,0.8)', borderRadius: 4 },
    ],
  };

  const trendChartData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: `${prevYear} Claims`,
        data: [q2024.Q1.claims, q2024.Q2.claims, q2024.Q3.claims, q2024.Q4.claims],
        borderColor: '#7a8f7a',
        backgroundColor: 'rgba(122,143,122,0.1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#7a8f7a',
        fill: false,
      },
      {
        label: `${currentYear} Claims`,
        data: [q2025.Q1.claims, q2025.Q2.claims, q2025.Q3.claims, q2025.Q4.claims],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212,175,55,0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#D4AF37',
        fill: false,
      },
      {
        label: `${prevYear} Cost ($)`,
        data: [q2024.Q1.cost, q2024.Q2.cost, q2024.Q3.cost, q2024.Q4.cost],
        borderColor: '#607D8B',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#607D8B',
        borderDash: [5, 5],
        fill: false,
        yAxisID: 'y1',
      },
      {
        label: `${currentYear} Cost ($)`,
        data: [q2025.Q1.cost, q2025.Q2.cost, q2025.Q3.cost, q2025.Q4.cost],
        borderColor: '#4CAF50',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#4CAF50',
        borderDash: [5, 5],
        fill: false,
        yAxisID: 'y1',
      },
    ],
  };

  const trendChartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const, labels: { color: '#b8c9b8', font: { size: 12, weight: 'bold' as const }, padding: 15 } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#b8c9b8' } },
      y: { position: 'left' as const, grid: { color: 'rgba(30,58,30,0.3)' }, ticks: { color: '#D4AF37' }, title: { display: true, text: 'Claims', color: '#D4AF37' } },
      y1: { position: 'right' as const, grid: { display: false }, ticks: { color: '#4CAF50', callback: (v: any) => '$' + Number(v).toLocaleString() }, title: { display: true, text: 'Cost (USD)', color: '#4CAF50' } },
    },
  };

  const summaryItems = [
    { label: 'Claims Change', value: fmtChange(claimsChange), color: changeColor(claimsChange), bg: 'rgba(76,175,80,0.1)' },
    { label: 'Cost Change', value: fmtChange(costChange), color: changeColor(costChange), bg: 'rgba(231,76,60,0.1)' },
    { label: 'Member Growth', value: fmtChange(memberChange), color: changeColor(memberChange), bg: 'rgba(52,152,219,0.1)' },
    { label: 'Cost/Member', value: fmtChange(cpmChange), color: changeColor(cpmChange), bg: 'rgba(212,175,55,0.1)' },
  ];

  return (
    <section className="yoy-section">
      <h2 className="section-title">📈 Year-over-Year Comparison</h2>
      <div className="chart-grid">
        {/* Claims Comparison */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">📊 Annual Claims Comparison</h3>
          </div>
          <div className="stats-mini">
            <div className="stat-mini" style={{ borderLeft: '4px solid #D4AF37' }}>
              <div className="stat-mini-label">{currentYear} YTD</div>
              <div className="stat-mini-value" style={{ color: '#D4AF37' }}>{fmt(d2025.claims)}</div>
            </div>
            <div className="stat-mini" style={{ borderLeft: '4px solid #7a8f7a' }}>
              <div className="stat-mini-label">{prevYear}</div>
              <div className="stat-mini-value" style={{ color: '#7a8f7a' }}>{has2024 ? fmt(d2024.claims) : 'No Data'}</div>
            </div>
          </div>
          <div className="chart-container">
            <Bar data={claimsChartData} options={darkChartOpts} />
          </div>
        </div>

        {/* Cost Comparison */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">💰 Annual Cost Comparison</h3>
          </div>
          <div className="stats-mini">
            <div className="stat-mini" style={{ borderLeft: '4px solid #4CAF50' }}>
              <div className="stat-mini-label">{currentYear} YTD</div>
              <div className="stat-mini-value" style={{ color: '#4CAF50' }}>${fmt(Math.round(d2025.cost))}</div>
            </div>
            <div className="stat-mini" style={{ borderLeft: '4px solid #7a8f7a' }}>
              <div className="stat-mini-label">{prevYear}</div>
              <div className="stat-mini-value" style={{ color: '#7a8f7a' }}>{has2024 ? '$' + fmt(Math.round(d2024.cost)) : 'No Data'}</div>
            </div>
          </div>
          <div className="chart-container">
            <Bar data={costChartData} options={darkChartOpts} />
          </div>
        </div>

        {/* Monthly YoY Trend (wide) */}
        <div className="chart-card wide">
          <div className="chart-header">
            <h3 className="chart-title">📈 Monthly YoY Trend</h3>
            <span className="chart-badge">{currentYear} vs {prevYear}</span>
          </div>
          <div className="yoy-summary">
            {summaryItems.map((item) => (
              <div key={item.label} className="summary-card" style={{ background: item.bg }}>
                <div className="summary-label">{item.label}</div>
                <div className="summary-value" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="chart-container tall">
            <Line data={trendChartData} options={trendChartOpts} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .yoy-section {
          margin-bottom: 2rem;
        }
        .section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8f5e9;
          margin-bottom: 1.5rem;
        }
        .chart-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .chart-card {
          background: linear-gradient(145deg, rgba(20, 40, 20, 0.9), rgba(10, 26, 10, 0.95));
          border: 1px solid rgba(46, 125, 50, 0.25);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .chart-card.wide {
          grid-column: 1 / -1;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .chart-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #e8f5e9;
        }
        .chart-badge {
          background: rgba(212, 175, 55, 0.15);
          color: #D4AF37;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .stats-mini {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .stat-mini {
          padding: 0.5rem 0.75rem;
        }
        .stat-mini-label {
          font-size: 0.9rem;
          color: #7a8f7a;
        }
        .stat-mini-value {
          font-size: 1.6rem;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
        }
        .chart-container {
          height: 250px;
          position: relative;
        }
        .chart-container.tall {
          height: 320px;
        }
        .yoy-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .summary-card {
          text-align: center;
          padding: 1rem;
          border-radius: 10px;
        }
        .summary-label {
          font-size: 0.95rem;
          color: #7a8f7a;
        }
        .summary-value {
          font-size: 1.8rem;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
        }
        @media (max-width: 1024px) {
          .chart-grid { grid-template-columns: 1fr; }
          .yoy-summary { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .yoy-summary { grid-template-columns: 1fr; }
          .summary-value { font-size: 1.4rem; }
        }
      `}</style>
    </section>
  );
}
