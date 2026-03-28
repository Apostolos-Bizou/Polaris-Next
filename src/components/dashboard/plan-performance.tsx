'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface PlanBreakdown {
  gold?: { members: number; cost: number };
  platinum?: { members: number; cost: number };
  silver?: { members: number; cost: number };
}

interface Props {
  planBreakdown?: PlanBreakdown | null;
  totalMembers?: number;
}

export default function PlanPerformance({ planBreakdown, totalMembers = 0 }: Props) {
  const plans = planBreakdown || {
    gold: { members: 5420, cost: 245000 },
    platinum: { members: 4230, cost: 312000 },
    silver: { members: 2800, cost: 98000 },
  };

  const goldM = plans.gold?.members || 0;
  const platM = plans.platinum?.members || 0;
  const silverM = plans.silver?.members || 0;
  const total = totalMembers || (goldM + platM + silverM);

  const goldCost = (plans.gold?.cost || 0) / 1000;
  const platCost = (plans.platinum?.cost || 0) / 1000;
  const silverCost = (plans.silver?.cost || 0) / 1000;

  const statCards = [
    { icon: '🥇', value: goldM.toLocaleString(), label: 'Gold Members' },
    { icon: '💎', value: platM.toLocaleString(), label: 'Platinum' },
    { icon: '🥈', value: silverM.toLocaleString(), label: 'Silver' },
    { icon: '📊', value: total.toLocaleString(), label: 'Total Active' },
  ];

  const pieData = {
    labels: ['Gold', 'Platinum', 'Silver'],
    datasets: [
      {
        data: [goldM, platM, silverM],
        backgroundColor: [
          'rgba(255, 193, 7, 0.85)',
          'rgba(189, 189, 189, 0.85)',
          'rgba(158, 158, 158, 0.7)',
        ],
        borderColor: ['#FF8F00', '#757575', '#616161'],
        borderWidth: 3,
        hoverOffset: 15,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#b8c9b8', font: { size: 14, weight: 'bold' as const }, padding: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(10, 26, 10, 0.95)',
        titleColor: '#D4AF37',
        bodyColor: '#e8f5e9',
        borderColor: 'rgba(46, 125, 50, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.parsed;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${ctx.label}: ${value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  const costData = {
    labels: ['Gold', 'Platinum', 'Silver'],
    datasets: [
      {
        data: [goldCost, platCost, silverCost],
        backgroundColor: [
          'rgba(255, 193, 7, 0.85)',
          'rgba(189, 189, 189, 0.85)',
          'rgba(158, 158, 158, 0.7)',
        ],
        borderColor: ['#FF8F00', '#757575', '#616161'],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const costOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 26, 10, 0.95)',
        titleColor: '#D4AF37',
        bodyColor: '#e8f5e9',
        callbacks: {
          label: (ctx: any) => `$${ctx.parsed.x.toFixed(0)}K`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(30,58,30,0.3)' },
        ticks: { color: '#7a8f7a', callback: (v: any) => '$' + v + 'K' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#fff', font: { weight: 'bold' as const } },
      },
    },
  };

  return (
    <section className="plan-section">
      <h2 className="section-title">🏆 Plan Performance</h2>

      {/* Plan Stat Cards */}
      <div className="plan-stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-mini">
            <div className="stat-mini-icon">{card.icon}</div>
            <div className="stat-mini-value">{card.value}</div>
            <div className="stat-mini-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">📊 Member Distribution</h3>
            <span className="chart-badge">By Plan</span>
          </div>
          <div className="chart-container">
            <Doughnut data={pieData} options={pieOptions} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">💰 Cost by Plan</h3>
          </div>
          <div className="chart-container">
            <Bar data={costData} options={costOptions} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .plan-section {
          margin-bottom: 2rem;
        }
        .section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8f5e9;
          margin-bottom: 1.5rem;
        }
        .plan-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .stat-mini {
          background: linear-gradient(145deg, rgba(20, 40, 20, 0.9), rgba(10, 26, 10, 0.95));
          border: 1px solid rgba(46, 125, 50, 0.25);
          border-radius: 16px;
          padding: 1.25rem;
          text-align: center;
          transition: all 0.3s ease;
        }
        .stat-mini:hover {
          transform: translateY(-3px);
          border-color: rgba(46, 125, 50, 0.5);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        .stat-mini-icon {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        .stat-mini-value {
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #e8f5e9;
        }
        .stat-mini-label {
          font-size: 0.85rem;
          color: #7a8f7a;
          margin-top: 0.25rem;
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
        .chart-container {
          height: 280px;
          position: relative;
        }
        @media (max-width: 768px) {
          .plan-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .chart-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .plan-stats-grid { grid-template-columns: 1fr; }
          .stat-mini-value { font-size: 1.6rem; }
        }
      `}</style>
    </section>
  );
}
