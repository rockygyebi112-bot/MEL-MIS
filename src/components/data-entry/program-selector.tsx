"use client";

import { DATA_ENTRY_PROGRAMS } from "@/lib/constants";
import { ProgramSlug } from "@/lib/types";
import { ImageIcon } from "lucide-react";

// Per-program gradient for the image placeholder area
const PROGRAM_GRADIENTS: Record<string, string> = {
  "enterprise-spotlight": "from-emerald-400 to-green-600",
  "virtual-university":   "from-blue-400 to-indigo-600",
  "hangout":              "from-purple-400 to-violet-600",
  "absa-onboarding":      "from-amber-400 to-orange-500",
  "learnings":            "from-teal-400 to-cyan-600",
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
          const gradient = PROGRAM_GRADIENTS[program.slug] ?? "from-gray-300 to-gray-400";
          return (
            <button
              key={program.slug}
              type="button"
              onClick={() => onSelect(program.slug as ProgramSlug)}
              className="rounded-xl border border-border/60 bg-card overflow-hidden text-left transition-all hover:border-srsf-green-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-srsf-green-500"
            >
              {/* Image placeholder */}
              <div className={`w-full h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <ImageIcon className="h-10 w-10 text-white/60" />
              </div>
              {/* Program name */}
              <div className="px-4 py-3">
                <h3 className="font-semibold text-sm">{program.name}</h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
