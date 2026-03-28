'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

interface CategoryData {
  category: string;
  cases: number;
  cost_usd: number;
  pct_of_total: number;
}

interface Props {
  categories?: CategoryData[];
  periods?: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'General Consultation': '#4CAF50',
  'Medical': '#4CAF50',
  'Dental': '#2196F3',
  'Maternity': '#E91E63',
  'Optical': '#FF9800',
  'Ophthalmology': '#FF9800',
  'Laboratory': '#D4AF37',
  'Laboratory & Diagnostics': '#D4AF37',
  'Pharmacy/Medication': '#9C27B0',
  'Other': '#607D8B',
};

const CATEGORY_DISPLAY = [
  { key: 'Medical', label: 'Medical', color: '#4CAF50' },
  { key: 'Dental', label: 'Dental', color: '#2196F3' },
  { key: 'Maternity', label: 'Maternity', color: '#E91E63' },
  { key: 'Optical', label: 'Optical', color: '#FF9800' },
  { key: 'Laboratory', label: 'Laboratory', color: '#D4AF37' },
  { key: 'Other', label: 'Other', color: '#607D8B' },
];

// Dummy data
const dummyCategories: CategoryData[] = [
  { category: 'Medical', cases: 1245, cost_usd: 89000, pct_of_total: 35 },
  { category: 'Dental', cases: 876, cost_usd: 34500, pct_of_total: 24 },
  { category: 'Maternity', cases: 234, cost_usd: 67800, pct_of_total: 6 },
  { category: 'Optical', cases: 567, cost_usd: 23400, pct_of_total: 16 },
  { category: 'Laboratory', cases: 432, cost_usd: 19800, pct_of_total: 12 },
  { category: 'Other', cases: 234, cost_usd: 12300, pct_of_total: 7 },
];

export default function CategoryTrend({ categories, periods }: Props) {
  const cats = categories && categories.length > 0 ? categories : dummyCategories;
  const months = periods || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  // Match each category to its display config
  const getCatCases = (catName: string): number => {
    const found = cats.find(
      (c) =>
        c.category.toLowerCase().includes(catName.toLowerCase()) ||
        catName.toLowerCase().includes(c.category.toLowerCase())
    );
    return found?.cases || 0;
  };

  // Generate trend data - distribute total cases across months with variation
  const generateMonthlyData = (totalCases: number): number[] => {
    // Use a seeded-ish approach for consistency per render
    const base = totalCases / months.length;
    return months.map((_, i) => {
      const variation = 0.8 + (Math.sin(i * 1.5 + totalCases * 0.01) * 0.2 + 0.2);
      return Math.round(base * variation);
    });
  };

  const datasets = CATEGORY_DISPLAY.slice(0, 4).map((cat) => {
    const cases = getCatCases(cat.key);
    return {
      label: cat.label,
      data: generateMonthlyData(cases),
      borderColor: cat.color,
      backgroundColor: cat.color + '20',
      fill: false,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: cat.color,
      pointHoverRadius: 7,
    };
  });

  const chartData = {
    labels: months,
    datasets,
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { color: 'rgba(184,212,232,0.7)', font: { size: 14, weight: 'bold' as const }, padding: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(10,22,40,0.95)',
        titleColor: '#D4AF37',
        bodyColor: '#ffffff',
        borderColor: 'rgba(45,80,112,0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(184,212,232,0.7)' } },
      y: { grid: { color: 'rgba(45,80,112,0.3)' }, ticks: { color: '#7aa0c0' } },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <div className="trend-card">
      <div className="chart-header">
        <h3 className="chart-title">📈 Category Trend</h3>
      </div>

      {/* Category Mini Stats */}
      <div className="cat-stats-grid">
        {CATEGORY_DISPLAY.map((cat) => {
          const cases = getCatCases(cat.key);
          return (
            <div key={cat.key} className="cat-stat" style={{ borderLeft: `4px solid ${cat.color}` }}>
              <div className="cat-stat-value" style={{ color: cat.color }}>
                {cases > 0 ? cases.toLocaleString() : '-'}
              </div>
              <div className="cat-stat-label">{cat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Trend Line Chart */}
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      <style jsx>{`
        .trend-card {
          background: linear-gradient(145deg, rgba(13,31,45,0.9), rgba(10,22,40,0.95));
          border: 1px solid rgba(45,80,112,0.25);
          border-radius: 16px;
          padding: 1.5rem;
          grid-column: 1 / -1;
        }
        .chart-header {
          margin-bottom: 1rem;
        }
        .chart-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          color: #ffffff;
        }
        .cat-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .cat-stat {
          padding: 0.75rem;
        }
        .cat-stat-value {
          font-size: 1.4rem;
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
        }
        .cat-stat-label {
          font-size: 0.85rem;
          color: #7aa0c0;
        }
        .chart-container {
          height: 300px;
          position: relative;
        }
        @media (max-width: 1024px) {
          .cat-stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 480px) {
          .cat-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .cat-stat-value { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
}
