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
import { ArrowLeft } from "lucide-react";

const PROGRAM_LABELS: Record<ProgramSlug, string> = {
  "enterprise-spotlight": "Enterprise Spotlight",
  "virtual-university": "Virtual University",
  "hangout": "Hangout",
  "absa-onboarding": "ABSA Onboarding",
  "learnings": "Learnings",
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
        <p className="text-sm text-muted-foreground mt-1">
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
            <ProgramSelector onSelect={setSelectedProgram} />
          ) : (
            <div className="space-y-6">
              {/* Back button + program title */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProgram(null);
                    setEditEntry(null);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h2 className="text-lg font-semibold">
                  {PROGRAM_LABELS[selectedProgram]}
                  {editEntry ? " — Editing Entry" : " — New Entry"}
                </h2>
              </div>

              {/* Form */}
              <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">{renderForm()}</div>

              {/* Recent entries */}
              <div>
                <h3 className="text-base font-semibold mb-3">Recent Entries</h3>
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
