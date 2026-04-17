import { ManagerDashboard } from "@/components/performance/manager-dashboard";

interface Props {
  params: Promise<{ departmentId: string }>;
}

export default async function ManagerPage({ params }: Props) {
  const { departmentId } = await params;
  return <ManagerDashboard departmentId={departmentId} />;
}
