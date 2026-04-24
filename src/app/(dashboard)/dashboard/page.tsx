import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { ProjectsDashboardStrip } from "@/components/projects/projects-dashboard-strip";
import { PageHeader } from "@/components/layout/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Executive Dashboard"
        description="Cross-program overview of all SRSF initiatives"
      />
      <ProjectsDashboardStrip />
      <ExecutiveDashboard />
    </div>
  );
}
