"use client";

import { Button } from "@/components/ui/button";

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
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={active === opt.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(opt.value)}
          className={
            active === opt.value
              ? "bg-[#5BBF3A] hover:bg-[#4ea832] text-white"
              : ""
          }
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
