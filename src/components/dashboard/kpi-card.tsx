import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="text-3xl font-bold mt-2 tracking-tight text-gray-900">
        {value}
      </p>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2.5">
          {trend.value >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span
            className={`text-xs font-semibold ${
              trend.value >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-[11px] text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
