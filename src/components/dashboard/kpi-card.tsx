import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string }; // value is percentage, e.g. 12.5 means +12.5%
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.value >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={`text-xs font-medium ${
              trend.value >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
