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
import { ArrowLeft, Check } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const STEPS = ["Select Programme", "Personal Info", "Business Info", "Review & Submit"];

function StepBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex items-center px-6 py-3 bg-card border border-border/50 rounded-xl">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "size-[22px] rounded-full border-2 flex items-center justify-center shrink-0 text-[9.5px] font-bold",
                i <= activeStep
                  ? "bg-srsf-green-500 border-srsf-green-500 text-white"
                  : "border-border text-muted-foreground",
              )}
            >
              {i < activeStep ? <Check className="size-3" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[11px] whitespace-nowrap hidden sm:inline",
                i === activeStep ? "font-bold text-foreground" : "font-medium text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "flex-1 h-[1.5px] mx-3 min-w-4",
                i < activeStep ? "bg-srsf-green-500" : "bg-border",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

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
          <div className="mb-6">
            <StepBar activeStep={selectedProgram ? (editEntry ? 3 : 1) : 0} />
          </div>
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
              {renderForm()}

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
