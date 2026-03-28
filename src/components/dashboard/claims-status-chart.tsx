"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ClaimsStatusProps {
  data: Record<string, number>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: "Πληρωθέντα", color: "#10b981" },
  approved: { label: "Εγκεκριμένα", color: "#3b82f6" },
  under_review: { label: "Σε αξιολόγηση", color: "#f59e0b" },
  submitted: { label: "Υποβληθέντα", color: "#8b5cf6" },
  rejected: { label: "Απορριφθέντα", color: "#f43f5e" },
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg p-3">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: d.payload.fill }}
        />
        <span className="text-sm font-medium text-slate-700">
          {d.name}: {d.value.toLocaleString("el-GR")}
        </span>
      </div>
    </div>
  );
}

export function ClaimsStatusChart({ data }: ClaimsStatusProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: STATUS_CONFIG[key]?.label || key,
    value,
    fill: STATUS_CONFIG[key]?.color || "#94a3b8",
  }));

  const total = Object.values(data).reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          Claims by Status
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">Κατανομή αιτημάτων</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900">
              {(total / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              Σύνολο
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {chartData.map((item) => {
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
