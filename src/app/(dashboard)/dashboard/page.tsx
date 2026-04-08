import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Executive Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Cross-program overview of all SRSF initiatives
        </p>
      </div>
      <ExecutiveDashboard />
    </div>
  );
}
