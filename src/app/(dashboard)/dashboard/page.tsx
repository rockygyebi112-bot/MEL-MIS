import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Executive Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-program overview of all SRSF initiatives
        </p>
      </div>
      <ExecutiveDashboard />
    </div>
  );
}
