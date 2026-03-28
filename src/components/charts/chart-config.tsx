"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─── Shared 3D-style options ─────────────────────────────
const FONT_FAMILY = "'Montserrat', 'Open Sans', sans-serif";

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#b8d4e8",
        font: { family: FONT_FAMILY, size: 11 },
        padding: 15,
        usePointStyle: true,
        pointStyleWidth: 10,
      },
    },
    tooltip: {
      backgroundColor: "rgba(10, 22, 40, 0.95)",
      titleColor: "#D4AF37",
      bodyColor: "#b8d4e8",
      borderColor: "rgba(212, 175, 55, 0.3)",
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
      titleFont: { family: FONT_FAMILY, weight: "bold" as const, size: 13 },
      bodyFont: { family: FONT_FAMILY, size: 12 },
    },
  },
  scales: {
    x: {
      ticks: { color: "#7aa0c0", font: { family: FONT_FAMILY, size: 11 } },
      grid: { color: "rgba(45, 80, 112, 0.2)" },
      border: { color: "rgba(45, 80, 112, 0.3)" },
    },
    y: {
      ticks: { color: "#7aa0c0", font: { family: FONT_FAMILY, size: 11 } },
      grid: { color: "rgba(45, 80, 112, 0.15)" },
      border: { color: "rgba(45, 80, 112, 0.3)" },
    },
  },
};

// ─── Create gradient helper ──────────────────────────────
function createGradient(
  ctx: CanvasRenderingContext2D,
  color: string,
  opacity1 = 0.6,
  opacity2 = 0.05
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color.replace(")", `,${opacity1})`).replace("rgb", "rgba"));
  gradient.addColorStop(1, color.replace(")", `,${opacity2})`).replace("rgb", "rgba"));
  return gradient;
}

// ─── Exports ─────────────────────────────────────────────
export {
  ChartJS,
  Line,
  Bar,
  Doughnut,
  Pie,
  baseOptions,
  createGradient,
  FONT_FAMILY,
};
