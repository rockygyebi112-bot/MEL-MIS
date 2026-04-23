import type { ComputedProjectStatus } from "@/lib/projects/types";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/projects/status";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<(typeof STATUS_TONE)[ComputedProjectStatus], string> = {
  neutral: "bg-muted text-muted-foreground",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
};

export function StatusPill({
  status,
  className,
}: {
  status: ComputedProjectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        TONE_CLASSES[STATUS_TONE[status]],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
