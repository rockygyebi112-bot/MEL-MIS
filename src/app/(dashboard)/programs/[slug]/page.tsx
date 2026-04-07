import { PROGRAMS } from "@/lib/constants";
import { notFound } from "next/navigation";

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
    <div>
      <h1 className="text-2xl font-bold">{program.name}</h1>
      <p className="text-muted-foreground mt-2">
        Program dashboard coming in Phase 3.
      </p>
    </div>
  );
}
