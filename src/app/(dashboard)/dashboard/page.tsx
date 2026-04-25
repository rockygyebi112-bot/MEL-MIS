import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { PortfolioDashboard } from "@/components/dashboard/portfolio/portfolio-dashboard";

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
      <PortfolioDashboard />
      <ExecutiveDashboard />
    </div>
  );
}
