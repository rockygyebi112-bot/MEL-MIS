import type { LucideIcon } from "lucide-react";

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-6 py-4 border-b border-border/50 bg-muted/30">
        <span className="w-[3px] self-stretch rounded-full bg-srsf-green-500 shrink-0" />
        {Icon && (
          <div className="size-8 rounded-lg bg-srsf-green-500/10 text-srsf-green-600 flex items-center justify-center shrink-0">
            <Icon className="size-4" />
          </div>
        )}
        <div>
          <h3 className="text-[14px] font-bold tracking-tight">{title}</h3>
          {description && (
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
