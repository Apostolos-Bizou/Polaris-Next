'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  costPerMember?: number;
  auditFeePercent?: number;
  registrationFee?: number;
  monthlyFee?: number;
  hasDental?: boolean;
}

export default function FeesCharges({
  costPerMember = 42.35,
  auditFeePercent = 15,
  registrationFee = 24,
  monthlyFee = 9,
  hasDental = true,
}: Props) {
  const baseCost = costPerMember * 0.7;
  const auditFee = baseCost * (auditFeePercent / 100);

  const chartData = {
    labels: ['Base Claims', 'Audit Fee', 'Registration', 'Monthly', 'Total'],
    datasets: [
      {
        data: [
          parseFloat(baseCost.toFixed(2)),
          parseFloat(auditFee.toFixed(2)),
          registrationFee,
          monthlyFee,
          parseFloat(costPerMember.toFixed(2)),
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.85)',
          'rgba(212, 175, 55, 0.85)',
          'rgba(33, 150, 243, 0.85)',
          'rgba(0, 188, 212, 0.85)',
          'rgba(244, 67, 54, 0.85)',
        ],
        borderColor: [
          '#1B5E20',
          '#F57F17',
          '#1565C0',
          '#006064',
          '#B71C1C',
        ],
        borderWidth: 2,
        borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 } as any,
        barPercentage: 0.7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 26, 10, 0.95)',
        titleColor: '#D4AF37',
        bodyColor: '#e8f5e9',
        borderColor: 'rgba(46, 125, 50, 0.3)',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#b8c9b8', font: { weight: 'bold' as const, size: 10 } },
      },
      y: {
        grid: { color: 'rgba(30,58,30,0.3)' },
        ticks: { color: '#7a8f7a', callback: (v: any) => '$' + Number(v).toFixed(0) },
      },
    },
  };

  const feeCards = [
    { icon: '📋', value: `${auditFeePercent}%`, label: 'Audit Fee' },
    { icon: '📝', value: `$${registrationFee}`, label: 'Registration Fee (Annual)' },
    { icon: '📅', value: `$${monthlyFee}`, label: 'Monthly Fee (Annual)' },
    { icon: '🦷', value: hasDental ? 'Yes' : 'No', label: 'Dental Coverage', sublabel: '(via CBMS)' },
  ];

  return (
    <section className="fees-section">
      <h2 className="section-title">💳 Fees & Charges Breakdown</h2>

      {/* Fee Stat Cards */}
      <div className="fees-stats-grid">
        {feeCards.map((card) => (
          <div key={card.label} className="stat-mini">
            <div className="stat-mini-icon">{card.icon}</div>
            <div className="stat-mini-value">{card.value}</div>
            <div className="stat-mini-label">{card.label}</div>
            {card.sublabel && <div className="stat-mini-sub">{card.sublabel}</div>}
          </div>
        ))}
      </div>

      {/* Cost Breakdown Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">📊 Annualized Cost Breakdown</h3>
          <span className="chart-badge">Per Member</span>
        </div>
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <style jsx>{`
        .fees-section {
          margin-bottom: 2rem;
        }
        .section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8f5e9;
          margin-bottom: 1.5rem;
        }
        .fees-stats-grid {
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
        .stat-mini-sub {
          font-size: 0.8rem;
          color: #5a6f5a;
          margin-top: 0.15rem;
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
          .fees-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .fees-stats-grid { grid-template-columns: 1fr; }
          .stat-mini-value { font-size: 1.6rem; }
        }
      `}</style>
    </section>
  );
}
