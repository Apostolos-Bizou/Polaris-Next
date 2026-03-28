"use client";

import clsx from "clsx";

interface TopClientsTableProps {
  clients: Array<{
    id: string;
    name: string;
    members: number;
    claims: number;
    lossRatio: number;
  }>;
}

export function TopClientsTable({ clients }: TopClientsTableProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">
          Top Clients
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Κατά αριθμό μελών
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider pb-3 pr-4">
                Εταιρεία
              </th>
              <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider pb-3 px-4">
                Μέλη
              </th>
              <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider pb-3 px-4">
                Claims
              </th>
              <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider pb-3 pl-4">
                Loss Ratio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.map((client, idx) => (
              <tr
                key={client.id}
                className="group hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold",
                        idx === 0
                          ? "bg-blue-50 text-blue-600"
                          : idx === 1
                            ? "bg-slate-100 text-slate-600"
                            : "bg-slate-50 text-slate-400"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900">
                      {client.name}
                    </span>
                  </div>
                </td>
                <td className="text-right text-sm tabular-nums text-slate-600 py-3.5 px-4">
                  {client.members.toLocaleString("el-GR")}
                </td>
                <td className="text-right text-sm tabular-nums text-slate-600 py-3.5 px-4">
                  {client.claims.toLocaleString("el-GR")}
                </td>
                <td className="text-right py-3.5 pl-4">
                  <LossRatioBadge value={client.lossRatio} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LossRatioBadge({ value }: { value: number }) {
  const pct = (value * 100).toFixed(1);
  const isHigh = value > 0.75;
  const isMid = value > 0.65 && value <= 0.75;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
        isHigh
          ? "bg-rose-50 text-rose-700"
          : isMid
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700"
      )}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full",
          isHigh
            ? "bg-rose-500"
            : isMid
              ? "bg-amber-500"
              : "bg-emerald-500"
        )}
      />
      {pct}%
    </span>
  );
}
