import { TrendingUp, TrendingDown } from "lucide-react";

type AccentColor = "green" | "purple" | "blue" | "amber" | "teal" | "pink";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  accent?: AccentColor;
}

const ACCENT_BORDER: Record<AccentColor, string> = {
  green: "border-t-4 border-t-[#5BBF3A]",
  purple: "border-t-4 border-t-[#6B2D7B]",
  blue: "border-t-4 border-t-blue-500",
  amber: "border-t-4 border-t-amber-400",
  teal: "border-t-4 border-t-teal-500",
  pink: "border-t-4 border-t-pink-500",
};

const ACCENT_BG: Record<AccentColor, string> = {
  green: "bg-gradient-to-br from-green-50/70 to-white",
  purple: "bg-gradient-to-br from-purple-50/70 to-white",
  blue: "bg-gradient-to-br from-blue-50/70 to-white",
  amber: "bg-gradient-to-br from-amber-50/70 to-white",
  teal: "bg-gradient-to-br from-teal-50/70 to-white",
  pink: "bg-gradient-to-br from-pink-50/70 to-white",
};

const ACCENT_VALUE: Record<AccentColor, string> = {
  green: "text-[#3a9920]",
  purple: "text-[#6B2D7B]",
  blue: "text-blue-700",
  amber: "text-amber-700",
  teal: "text-teal-700",
  pink: "text-pink-700",
};

export function KpiCard({ label, value, trend, accent }: KpiCardProps) {
  const borderClass = accent ? ACCENT_BORDER[accent] : "border-t-4 border-t-gray-200";
  const bgClass = accent ? ACCENT_BG[accent] : "bg-white";
  const valueClass = accent ? ACCENT_VALUE[accent] : "text-foreground";
  return (
    <div
      className={`rounded-xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${borderClass} ${bgClass}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </p>
      <p className={`text-4xl font-extrabold mt-2 tracking-tight ${valueClass}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {trend && (
        <div className="flex items-center gap-1.5 mt-2.5">
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
