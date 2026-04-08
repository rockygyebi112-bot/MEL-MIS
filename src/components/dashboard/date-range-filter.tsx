"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-[11px] text-gray-400 uppercase tracking-wider">
          From
        </Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-36 h-8 text-xs bg-white"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] text-gray-400 uppercase tracking-wider">
          To
        </Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="w-36 h-8 text-xs bg-white"
        />
      </div>
      {(from || to) && (
        <button
          onClick={onClear}
          className="h-8 px-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Clear dates"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
