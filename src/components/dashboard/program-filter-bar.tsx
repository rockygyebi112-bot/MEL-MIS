"use client";

export type ProgramFilter =
  | "all"
  | "enterprise-spotlight"
  | "virtual-university"
  | "hangout"
  | "absa-onboarding";

const FILTER_OPTIONS: { value: ProgramFilter; label: string }[] = [
  { value: "all", label: "All Programs" },
  { value: "enterprise-spotlight", label: "Enterprise Spotlight" },
  { value: "virtual-university", label: "Virtual University" },
  { value: "hangout", label: "Hangout" },
  { value: "absa-onboarding", label: "ABSA Onboarding" },
];

interface ProgramFilterBarProps {
  active: ProgramFilter;
  onChange: (filter: ProgramFilter) => void;
}

export function ProgramFilterBar({ active, onChange }: ProgramFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
            active === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
