import { PROGRAMS } from "@/lib/constants";
import { notFound } from "next/navigation";
import { EnterpriseSpotlightDashboard } from "@/components/dashboard/enterprise-spotlight-dashboard";
import { MediaProgramDashboard } from "@/components/dashboard/media-program-dashboard";
import { AbsaOnboardingDashboard } from "@/components/dashboard/absa-onboarding-dashboard";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;
  const program = PROGRAMS.find((p) => p.slug === slug);

  if (!program) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">{program.name}</h1>
      {slug === "enterprise-spotlight" && <EnterpriseSpotlightDashboard />}
      {slug === "virtual-university" && (
        <MediaProgramDashboard
          tableName="virtual_university_entries"
          programSlug="virtual-university"
          programLabel="Virtual University"
        />
      )}
      {slug === "hangout" && (
        <MediaProgramDashboard
          tableName="hangout_entries"
          programSlug="hangout"
          programLabel="Hangout"
        />
      )}
      {slug === "absa-onboarding" && <AbsaOnboardingDashboard />}
    </div>
  );
}
