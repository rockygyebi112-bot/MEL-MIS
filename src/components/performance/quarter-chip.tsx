"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface QuarterChipProps {
  year: number;
  quarter: number;
  onYearChange: (y: number) => void;
  onQuarterChange: (q: number) => void;
}

export function QuarterChip({
  year,
  quarter,
  onYearChange,
  onQuarterChange,
}: QuarterChipProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3.5 py-2 text-[11px] font-semibold text-foreground"
      >
        Q{quarter} · {year}
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-10 rounded-xl bg-popover p-2 shadow-xl border border-border min-w-[160px]">
          <div className="flex gap-1 p-1">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => onYearChange(y)}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] ${
                  y === year
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  onQuarterChange(q);
                  setOpen(false);
                }}
                className={`flex-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                  q === quarter
                    ? "bg-[#5BBF3A] text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Q{q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
