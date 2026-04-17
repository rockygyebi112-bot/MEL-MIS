"use client";

interface QuarterSelectorProps {
  year: number;
  quarter: number;
  onYearChange: (y: number) => void;
  onQuarterChange: (q: number) => void;
}

export function QuarterSelector({
  year,
  quarter,
  onYearChange,
  onQuarterChange,
}: QuarterSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <div className="flex rounded-md border border-input overflow-hidden">
        {[1, 2, 3, 4].map((q) => (
          <button
            key={q}
            onClick={() => onQuarterChange(q)}
            className={`px-4 h-9 text-sm font-medium transition-colors ${
              quarter === q
                ? "bg-[#6B2D7B] text-white"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Q{q}
          </button>
        ))}
      </div>
    </div>
  );
}
