"use client";

import { DATA_ENTRY_PROGRAMS } from "@/lib/constants";
import { ProgramSlug } from "@/lib/types";
import {
  Briefcase,
  MonitorPlay,
  Users,
  Landmark,
  Lightbulb,
  LucideIcon,
} from "lucide-react";

const PROGRAM_ICONS: Record<string, LucideIcon> = {
  "enterprise-spotlight": Briefcase,
  "virtual-university": MonitorPlay,
  "hangout": Users,
  "absa-onboarding": Landmark,
  "learnings": Lightbulb,
};

interface ProgramSelectorProps {
  onSelect: (slug: ProgramSlug) => void;
}

export function ProgramSelector({ onSelect }: ProgramSelectorProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Select a Program</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DATA_ENTRY_PROGRAMS.map((program) => {
          const Icon = PROGRAM_ICONS[program.slug];
          return (
            <button
              key={program.slug}
              onClick={() => onSelect(program.slug as ProgramSlug)}
              className="flex flex-col items-start gap-2 rounded-lg border bg-card p-5 text-left transition-colors hover:border-srsf-green-500 hover:bg-srsf-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-srsf-green-500"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-srsf-green-100 p-2 text-srsf-green-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{program.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {program.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
