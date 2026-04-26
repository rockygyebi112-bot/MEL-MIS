import { TrendingUp, TrendingDown } from "lucide-react";

type AccentColor = "green" | "purple" | "blue" | "amber" | "teal" | "pink";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: number; label: string };
  accent?: AccentColor;
  colorAccent?: string;
  sublabel?: string;
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

export function KpiCard({
  label,
  value,
  trend,
  accent,
  colorAccent,
  sublabel,
}: KpiCardProps) {
  const borderClass = accent ? ACCENT_BORDER[accent] : "border-t-4 border-t-gray-200";
  const bgClass = accent ? ACCENT_BG[accent] : "bg-white";
  const valueClass = accent ? ACCENT_VALUE[accent] : "text-foreground";
  return (
    <div
      className={`relative rounded-lg border border-border bg-card px-4 py-3 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ease-out ${borderClass} ${bgClass}`}
    >
      {colorAccent && (
        <div
          className="absolute left-0 top-0 h-full w-[3px] rounded-l-lg"
          style={{ background: colorAccent }}
        />
      )}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </p>
      <p className={`text-4xl font-bold mt-2 tracking-tight ${valueClass}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{sublabel}</p>
      )}
      {trend && (
        <div className="flex items-center gap-1.5 mt-3">
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
