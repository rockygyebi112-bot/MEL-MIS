"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProgramFilter =
  | "enterprise-spotlight"
  | "virtual-university"
  | "hangout"
  | "absa-onboarding"
  | "performance";

const FILTER_OPTIONS: { value: ProgramFilter; label: string }[] = [
  { value: "enterprise-spotlight", label: "Enterprise Spotlight" },
  { value: "virtual-university", label: "Virtual University" },
  { value: "hangout", label: "Hangout" },
  { value: "absa-onboarding", label: "ABSA Onboarding" },
  { value: "performance", label: "Performance" },
];

interface ProgramFilterBarProps {
  active: ProgramFilter;
  onChange: (filter: ProgramFilter) => void;
}

export function ProgramFilterBar({ active, onChange }: ProgramFilterBarProps) {
  return (
    <>
      {/* Mobile: compact Select dropdown */}
      <div className="sm:hidden w-full">
        <Select
          value={active}
          onValueChange={(v) => onChange((v ?? active) as ProgramFilter)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop: tab strip */}
      <div className="hidden sm:flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
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
    </>
  );
}
