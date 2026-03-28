"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ClaimsChartProps {
  data: Array<{
    month: string;
    submitted: number;
    paid: number;
    amount: number;
  }>;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-4 min-w-[180px]">
      <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-500">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-slate-800">
            {entry.value.toLocaleString("el-GR")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ClaimsChart({ data }: ClaimsChartProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Claims Trend
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Τελευταίοι 7 μήνες
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-500">Υποβληθέντα</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Πληρωθέντα</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="submitted"
            name="Υποβληθέντα"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#gradSubmitted)"
          />
          <Area
            type="monotone"
            dataKey="paid"
            name="Πληρωθέντα"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#gradPaid)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
