"use client";

import { type ReactNode } from "react";
import clsx from "clsx";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  accentColor?: "blue" | "emerald" | "amber" | "rose" | "violet";
}

const accentMap = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    ring: "ring-blue-100",
    glow: "shadow-blue-500/5",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "ring-emerald-100",
    glow: "shadow-emerald-500/5",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    ring: "ring-amber-100",
    glow: "shadow-amber-500/5",
  },
  rose: {
    bg: "bg-rose-50",
    text: "text-rose-600",
    ring: "ring-rose-100",
    glow: "shadow-rose-500/5",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    ring: "ring-violet-100",
    glow: "shadow-violet-500/5",
  },
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = "blue",
}: KpiCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className={clsx(
        "group relative rounded-2xl bg-white p-6",
        "border border-slate-100",
        "shadow-card hover:shadow-card-hover",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5"
      )}
    >
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={clsx(
            "flex items-center justify-center w-11 h-11 rounded-xl",
            accent.bg,
            accent.text,
            "ring-1",
            accent.ring
          )}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={clsx(
              "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
              trend.value >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(trend.value).toFixed(1)}%
            <span className="text-slate-400 ml-0.5">{trend.label}</span>
          </span>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      {/* Title + subtitle */}
      <p className="mt-1.5 text-sm font-medium text-slate-500">{title}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}
