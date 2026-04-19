"use client";

interface StatusSegmentedBarProps {
  onTrack: number;
  atRisk: number;
  behind: number;
  showLabels?: boolean;
}

export function StatusSegmentedBar({
  onTrack,
  atRisk,
  behind,
  showLabels = true,
}: StatusSegmentedBarProps) {
  const total = onTrack + atRisk + behind;
  const safeTotal = total === 0 ? 1 : total;

  return (
    <div>
      <div className="flex gap-[3px] h-1.5 rounded-full overflow-hidden bg-[#1A2030]">
        {onTrack > 0 && (
          <div style={{ flex: onTrack / safeTotal }} className="bg-[#22C55E]" />
        )}
        {atRisk > 0 && (
          <div style={{ flex: atRisk / safeTotal }} className="bg-[#F59E0B]" />
        )}
        {behind > 0 && (
          <div style={{ flex: behind / safeTotal }} className="bg-[#DC2626]" />
        )}
      </div>
      {showLabels && (
        <div className="mt-1.5 flex justify-between text-[10px] tracking-wider text-[#8891A6]">
          <span>{onTrack} ON TRACK</span>
          <span>{atRisk} AT RISK</span>
          <span>{behind} BEHIND</span>
        </div>
      )}
    </div>
  );
}
