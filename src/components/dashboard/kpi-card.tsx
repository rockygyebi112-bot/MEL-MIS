import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </p>
      <p className="text-3xl font-bold mt-1.5 tracking-tight text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend.value >= 0 ? (
            <TrendingUp className="size-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="size-3.5 text-red-500" />
          )}
          <span
            className={`text-xs font-semibold ${
              trend.value >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-[11px] text-muted-foreground/60">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
