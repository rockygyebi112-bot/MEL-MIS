"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavigatorProps {
  weekDate: Date;
  onChange: (d: Date) => void;
}

function getWeekLabel(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (dt: Date) =>
    dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const isThisWeek = (() => {
    const now = new Date();
    const nowMon = new Date(now);
    nowMon.setDate(now.getDate() + (now.getDay() === 0 ? -6 : 1 - now.getDay()));
    nowMon.setHours(0, 0, 0, 0);
    const monCopy = new Date(mon);
    monCopy.setHours(0, 0, 0, 0);
    return monCopy.getTime() === nowMon.getTime();
  })();

  return isThisWeek ? `This week (${fmt(mon)} – ${fmt(sun)})` : `${fmt(mon)} – ${fmt(sun)}`;
}

export function WeekNavigator({ weekDate, onChange }: WeekNavigatorProps) {
  function shift(days: number) {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + days);
    onChange(d);
  }

  const isFuture = (() => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return weekDate >= nextWeek;
  })();

  return (
    <div className="flex items-center justify-between rounded-full bg-muted px-2 py-1.5">
      <button
        onClick={() => shift(-7)}
        className="size-7 flex items-center justify-center rounded-full hover:bg-background transition-colors"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-xs font-semibold text-foreground px-2">{getWeekLabel(weekDate)}</span>
      <button
        onClick={() => shift(7)}
        disabled={isFuture}
        className="size-7 flex items-center justify-center rounded-full hover:bg-background transition-colors disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
