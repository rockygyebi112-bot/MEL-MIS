"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AbsaOnboardingEntry } from "@/lib/types";
import { EChart } from "./echart";
import { KpiCard } from "./kpi-card";
import { DateRangeFilter } from "./date-range-filter";
import { ExportButton } from "./export-button";
import {
  countByField,
  barChartOption,
  donutChartOption,
  pieChartOption,
} from "./chart-builders";

export function AbsaOnboardingDashboard() {
  const [entries, setEntries] = useState<AbsaOnboardingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("absa_onboarding_entries")
        .select("*")
        .eq("is_draft", false)
        .order("created_at", { ascending: false });

      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", `${to}T23:59:59`);

      const { data } = await query;
      setEntries((data as AbsaOnboardingEntry[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase, from, to]);

  const totalParticipants = entries.length;

  const genderCounts = useMemo(() => countByField(entries, "gender"), [entries]);
  const ageCounts = useMemo(() => countByField(entries, "age_bracket"), [entries]);
  const regionCounts = useMemo(() => countByField(entries, "region"), [entries]);
  const employmentCounts = useMemo(() => countByField(entries, "employment_status"), [entries]);
  const disabilityCounts = useMemo(() => countByField(entries, "disability_status"), [entries]);

  if (loading) {
    return <p className="text-muted-foreground py-8">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onClear={() => { setFrom(""); setTo(""); }}
        />
        <ExportButton
          data={entries}
          filename="absa-onboarding-export"
          columns={[
            { key: "participant_name", label: "Participant" },
            { key: "gender", label: "Gender" },
            { key: "age", label: "Age" },
            { key: "age_bracket", label: "Age Bracket" },
            { key: "region", label: "Region" },
            { key: "employment_status", label: "Employment" },
            { key: "disability_status", label: "Disability" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Participants Onboarded" value={totalParticipants} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <EChart option={donutChartOption(genderCounts, "Gender Distribution")} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <EChart option={barChartOption(ageCounts, "Age Bracket")} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <EChart option={barChartOption(regionCounts, "Region")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <EChart option={pieChartOption(employmentCounts, "Employment Status")} />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <EChart option={donutChartOption(disabilityCounts, "Disability Status")} />
        </div>
      </div>
    </div>
  );
}
