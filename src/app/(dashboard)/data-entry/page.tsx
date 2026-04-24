"use client";

import { useState, useCallback } from "react";
import { ProgramSlug } from "@/lib/types";
import { ProgramSelector } from "@/components/data-entry/program-selector";
import { EnterpriseSpotlightForm } from "@/components/data-entry/enterprise-spotlight-form";
import { MediaProgramForm } from "@/components/data-entry/media-program-form";
import { AbsaOnboardingForm } from "@/components/data-entry/absa-onboarding-form";
import { LearningsForm } from "@/components/data-entry/learnings-form";
import { RecentEntriesTable } from "@/components/data-entry/recent-entries-table";
import { BulkUpload } from "@/components/data-entry/bulk-upload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FilePenLine, LayoutGrid, Smartphone } from "lucide-react";

const PROGRAM_LABELS: Record<ProgramSlug, string> = {
  "enterprise-spotlight": "Enterprise Spotlight",
  "virtual-university": "Virtual University",
  "hangout": "Hangout",
  "absa-onboarding": "ABSA Onboarding",
  learnings: "Learnings",
};

export default function DataEntryPage() {
  const [selectedProgram, setSelectedProgram] = useState<ProgramSlug | null>(
    null
  );
  const [editEntry, setEditEntry] = useState<Record<string, unknown> | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setEditEntry(null);
  }, []);

  const handleEdit = useCallback((entry: Record<string, unknown>) => {
    setEditEntry(entry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCancel = useCallback(() => {
    setEditEntry(null);
  }, []);

  function renderForm() {
    switch (selectedProgram) {
      case "enterprise-spotlight":
        return (
          <EnterpriseSpotlightForm
            editEntry={editEntry as never}
            onSaved={handleSaved}
            onCancel={editEntry ? handleCancel : undefined}
          />
        );
      case "virtual-university":
        return (
          <MediaProgramForm
            tableName="virtual_university_entries"
            programSlug="virtual-university"
            programLabel="Virtual University"
            editEntry={editEntry as never}
            onSaved={handleSaved}
            onCancel={editEntry ? handleCancel : undefined}
          />
        );
      case "hangout":
        return (
          <MediaProgramForm
            tableName="hangout_entries"
            programSlug="hangout"
            programLabel="Hangout"
            editEntry={editEntry as never}
            onSaved={handleSaved}
            onCancel={editEntry ? handleCancel : undefined}
          />
        );
      case "absa-onboarding":
        return (
          <AbsaOnboardingForm
            editEntry={editEntry as never}
            onSaved={handleSaved}
            onCancel={editEntry ? handleCancel : undefined}
          />
        );
      case "learnings":
        return (
          <LearningsForm
            editEntry={editEntry as never}
            onSaved={handleSaved}
            onCancel={editEntry ? handleCancel : undefined}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Entry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter data for any program. All submissions feed into dashboards
          automatically.
        </p>
      </div>

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          {!selectedProgram ? (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
                <div>
                  <Badge variant="secondary" className="mb-3">
                    Single entry workflow
                  </Badge>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Choose a program and start entering clean data fast
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Each form is tailored to the selected program. Drafts are
                    supported, and completed entries flow straight into
                    dashboards.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Smartphone className="size-4 text-srsf-green-600" />
                      Mobile-friendly
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clear sections and sticky actions keep forms easier to
                      complete on smaller screens.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <LayoutGrid className="size-4 text-srsf-green-600" />
                      Program-specific
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Only the fields relevant to that program are shown, which
                      keeps data entry focused.
                    </p>
                  </div>
                </div>
              </div>
              <ProgramSelector onSelect={setSelectedProgram} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-srsf-green-100 text-srsf-green-800 hover:bg-srsf-green-100">
                        {PROGRAM_LABELS[selectedProgram]}
                      </Badge>
                      <Badge variant="outline">
                        {editEntry ? "Editing entry" : "New entry"}
                      </Badge>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">
                        {editEntry
                          ? "Update and resubmit your entry"
                          : "Fill out the form below"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Keep it lightweight: enter what you know now, save a
                        draft if needed, and review recent submissions below.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProgram(null);
                      setEditEntry(null);
                    }}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to programs
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-srsf-green-500/10 p-2 text-srsf-green-700">
                    <FilePenLine className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Entry tips</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Required fields are marked with{" "}
                      <span className="font-semibold">*</span>. Numeric fields
                      can be left blank until the data is available, and drafts
                      can be finished later.
                    </p>
                  </div>
                </div>
              </div>

              {renderForm()}

              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold">Recent Entries</h3>
                  <p className="text-sm text-muted-foreground">
                    Your latest submissions for {PROGRAM_LABELS[selectedProgram]}.
                  </p>
                </div>
                <RecentEntriesTable
                  programSlug={selectedProgram}
                  refreshKey={refreshKey}
                  onEdit={handleEdit}
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bulk">
          <BulkUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
