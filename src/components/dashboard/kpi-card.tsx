import { TrendingUp, TrendingDown } from "lucide-react";

type AccentColor = "green" | "purple" | "blue" | "amber" | "teal" | "pink";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  accent?: AccentColor;
}

const ACCENT_CLASSES: Record<AccentColor, string> = {
  green: "border-t-[3px] border-t-[#5BBF3A]",
  purple: "border-t-[3px] border-t-[#6B2D7B]",
  blue: "border-t-[3px] border-t-blue-500",
  amber: "border-t-[3px] border-t-amber-400",
  teal: "border-t-[3px] border-t-teal-500",
  pink: "border-t-[3px] border-t-pink-500",
};

export function KpiCard({ label, value, trend, accent }: KpiCardProps) {
  const accentClass = accent ? ACCENT_CLASSES[accent] : "";
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${accentClass}`}
    >
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
