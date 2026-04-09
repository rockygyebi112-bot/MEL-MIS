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
      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-widest font-semibold">
          From
        </Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-36 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground/70 uppercase tracking-widest font-semibold">
          To
        </Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="w-36 text-xs"
        />
      </div>
      {(from || to) && (
        <button
          onClick={onClear}
          className="h-8 px-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Clear dates"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
