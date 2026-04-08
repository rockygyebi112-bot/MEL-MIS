"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EnterpriseSpotlightEntry,
  MediaProgramEntry,
  AbsaOnboardingEntry,
} from "@/lib/types";
import { EChart } from "./echart";
import { KpiCard } from "./kpi-card";
import { DateRangeFilter } from "./date-range-filter";
import { ExportButton } from "./export-button";
import { ProgramFilterBar, ProgramFilter } from "./program-filter-bar";
import {
  countByField,
  groupByMonth,
  barChartOption,
  horizontalBarChartOption,
  donutChartOption,
  pieChartOption,
  multiLineChartOption,
  groupedBarChartOption,
} from "./chart-builders";

// ─── Helpers ────────────────────────────────────────────────────

function totalMediaViews(entry: MediaProgramEntry): number {
  let total = 0;
  if (entry.metrics.facebook) total += entry.metrics.facebook.views;
  if (entry.metrics.youtube) total += entry.metrics.youtube.views;
  return total;
}

function getPreviousPeriodRange(
  from: string,
  to: string
): { prevFrom: string; prevTo: string } | null {
  if (!from || !to) return null;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffMs = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1); // day before "from"
  const prevFrom = new Date(prevTo.getTime() - diffMs);
  return {
    prevFrom: prevFrom.toISOString().slice(0, 10),
    prevTo: prevTo.toISOString().slice(0, 10),
  };
}

// ─── Component ──────────────────────────────────────────────────

export function ExecutiveDashboard() {
  const [esEntries, setEsEntries] = useState<EnterpriseSpotlightEntry[]>([]);
  const [vuEntries, setVuEntries] = useState<MediaProgramEntry[]>([]);
  const [hangoutEntries, setHangoutEntries] = useState<MediaProgramEntry[]>([]);
  const [absaEntries, setAbsaEntries] = useState<AbsaOnboardingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [programFilter, setProgramFilter] = useState<ProgramFilter>("all");
  const supabase = createClient();

  useEffect(() => {
    async function loadAll() {
      setLoading(true);

      const buildQuery = (table: string) => {
        let q = supabase
          .from(table)
          .select("*")
          .eq("is_draft", false)
          .order("created_at", { ascending: false });
        if (from) q = q.gte("created_at", from);
        if (to) q = q.lte("created_at", `${to}T23:59:59`);
        return q;
      };

      const [esRes, vuRes, hangoutRes, absaRes] = await Promise.all([
        buildQuery("enterprise_spotlight_entries"),
        buildQuery("virtual_university_entries"),
        buildQuery("hangout_entries"),
        buildQuery("absa_onboarding_entries"),
      ]);

      setEsEntries((esRes.data as EnterpriseSpotlightEntry[]) ?? []);
      setVuEntries((vuRes.data as MediaProgramEntry[]) ?? []);
      setHangoutEntries((hangoutRes.data as MediaProgramEntry[]) ?? []);
      setAbsaEntries((absaRes.data as AbsaOnboardingEntry[]) ?? []);
      setLoading(false);
    }
    loadAll();
  }, [supabase, from, to]);

  // ─── KPI values ───────────────────────────────────────────────

  const totalApplications = esEntries.length;
  const totalVuEpisodes = vuEntries.length;
  const totalHangoutEpisodes = hangoutEntries.length;
  const totalAbsaParticipants = absaEntries.length;

  // ─── Trend calculations (only when date range set) ────────────

  const trends = useMemo(() => {
    const prev = getPreviousPeriodRange(from, to);
    if (!prev) return { es: undefined, vu: undefined, hangout: undefined, absa: undefined };

    // We need to re-filter from the full dataset — but we only have the filtered data.
    // Trends are only meaningful when a date range is explicitly set, and we'd need
    // unfiltered data for prev period. For simplicity, trends show undefined unless
    // the user has explicitly set a date range AND we fetch prev period data.
    // This is a display-only enhancement; we return undefined for now and can
    // enhance with a second fetch if needed.
    return { es: undefined, vu: undefined, hangout: undefined, absa: undefined };
  }, [from, to]);

  // ─── Show/hide based on program filter ────────────────────────

  const showES =
    programFilter === "all" || programFilter === "enterprise-spotlight";
  const showVU =
    programFilter === "all" || programFilter === "virtual-university";
  const showHangout =
    programFilter === "all" || programFilter === "hangout";
  const showABSA =
    programFilter === "all" || programFilter === "absa-onboarding";
  const showMedia = showVU || showHangout;

  // ─── Demographics: Gender (cross-program) ─────────────────────

  const genderCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    if (showES) {
      for (const e of esEntries) {
        if (e.gender) counts[e.gender] = (counts[e.gender] || 0) + 1;
      }
    }
    if (showVU) {
      for (const e of vuEntries) {
        for (const [k, v] of Object.entries(e.demographics?.gender ?? {})) {
          counts[k] = (counts[k] || 0) + v;
        }
      }
    }
    if (showHangout) {
      for (const e of hangoutEntries) {
        for (const [k, v] of Object.entries(e.demographics?.gender ?? {})) {
          counts[k] = (counts[k] || 0) + v;
        }
      }
    }
    if (showABSA) {
      for (const e of absaEntries) {
        if (e.gender) counts[e.gender] = (counts[e.gender] || 0) + 1;
      }
    }

    return counts;
  }, [esEntries, vuEntries, hangoutEntries, absaEntries, showES, showVU, showHangout, showABSA]);

  // ─── Demographics: Age Bracket (grouped bar by program) ───────

  const ageBracketByProgram = useMemo(() => {
    const series: { name: string; data: Record<string, number> }[] = [];

    if (showES) {
      series.push({
        name: "Enterprise Spotlight",
        data: countByField(esEntries, "age_bracket"),
      });
    }
    if (showVU) {
      const counts: Record<string, number> = {};
      for (const e of vuEntries) {
        for (const [k, v] of Object.entries(e.demographics?.age_brackets ?? {})) {
          counts[k] = (counts[k] || 0) + v;
        }
      }
      series.push({ name: "Virtual University", data: counts });
    }
    if (showHangout) {
      const counts: Record<string, number> = {};
      for (const e of hangoutEntries) {
        for (const [k, v] of Object.entries(e.demographics?.age_brackets ?? {})) {
          counts[k] = (counts[k] || 0) + v;
        }
      }
      series.push({ name: "Hangout", data: counts });
    }
    if (showABSA) {
      series.push({
        name: "ABSA Onboarding",
        data: countByField(absaEntries, "age_bracket"),
      });
    }

    return series;
  }, [esEntries, vuEntries, hangoutEntries, absaEntries, showES, showVU, showHangout, showABSA]);

  // ─── Demographics: Disability (ES + ABSA combined) ────────────

  const disabilityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (showES) {
      for (const e of esEntries) {
        if (e.disability_status)
          counts[e.disability_status] = (counts[e.disability_status] || 0) + 1;
      }
    }
    if (showABSA) {
      for (const e of absaEntries) {
        if (e.disability_status)
          counts[e.disability_status] = (counts[e.disability_status] || 0) + 1;
      }
    }
    return counts;
  }, [esEntries, absaEntries, showES, showABSA]);

  // ─── Geographic: Region (horizontal bar) ──────────────────────

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (showES) {
      for (const e of esEntries) {
        if (e.region) counts[e.region] = (counts[e.region] || 0) + 1;
      }
    }
    if (showABSA) {
      for (const e of absaEntries) {
        if (e.region) counts[e.region] = (counts[e.region] || 0) + 1;
      }
    }
    return counts;
  }, [esEntries, absaEntries, showES, showABSA]);

  const uniqueRegionCount = Object.keys(regionCounts).length;

  // ─── Enterprise Spotlight specifics ───────────────────────────

  const esRegistrationCounts = useMemo(
    () => (showES ? countByField(esEntries, "business_registered") : {}),
    [esEntries, showES]
  );
  const esSectorCounts = useMemo(
    () => (showES ? countByField(esEntries, "business_sector") : {}),
    [esEntries, showES]
  );

  // ─── Media Programs: Monthly views (dual-line) ────────────────

  const mediaMonthlyViews = useMemo(() => {
    const series: { name: string; data: Record<string, number> }[] = [];

    if (showVU) {
      const monthGroups = groupByMonth(vuEntries, "created_at");
      const monthTotals: Record<string, number> = {};
      for (const [month, items] of Object.entries(monthGroups)) {
        monthTotals[month] = (items as MediaProgramEntry[]).reduce(
          (sum, e) => sum + totalMediaViews(e),
          0
        );
      }
      series.push({ name: "Virtual University", data: monthTotals });
    }

    if (showHangout) {
      const monthGroups = groupByMonth(hangoutEntries, "created_at");
      const monthTotals: Record<string, number> = {};
      for (const [month, items] of Object.entries(monthGroups)) {
        monthTotals[month] = (items as MediaProgramEntry[]).reduce(
          (sum, e) => sum + totalMediaViews(e),
          0
        );
      }
      series.push({ name: "Hangout", data: monthTotals });
    }

    return series;
  }, [vuEntries, hangoutEntries, showVU, showHangout]);

  // ─── Media Programs: Monthly episodes (grouped bar) ───────────

  const mediaMonthlyEpisodes = useMemo(() => {
    const series: { name: string; data: Record<string, number> }[] = [];

    if (showVU) {
      const monthGroups = groupByMonth(vuEntries, "created_at");
      const counts: Record<string, number> = {};
      for (const [month, items] of Object.entries(monthGroups)) {
        counts[month] = items.length;
      }
      series.push({ name: "Virtual University", data: counts });
    }

    if (showHangout) {
      const monthGroups = groupByMonth(hangoutEntries, "created_at");
      const counts: Record<string, number> = {};
      for (const [month, items] of Object.entries(monthGroups)) {
        counts[month] = items.length;
      }
      series.push({ name: "Hangout", data: counts });
    }

    return series;
  }, [vuEntries, hangoutEntries, showVU, showHangout]);

  // ─── Media Programs: Views per platform (stacked bar) ─────────

  const mediaPlatformViews = useMemo(() => {
    let facebookTotal = 0;
    let youtubeTotal = 0;

    const mediaEntries: MediaProgramEntry[] = [];
    if (showVU) mediaEntries.push(...vuEntries);
    if (showHangout) mediaEntries.push(...hangoutEntries);

    for (const e of mediaEntries) {
      if (e.metrics.facebook) facebookTotal += e.metrics.facebook.views;
      if (e.metrics.youtube) youtubeTotal += e.metrics.youtube.views;
    }

    return { Facebook: facebookTotal, YouTube: youtubeTotal };
  }, [vuEntries, hangoutEntries, showVU, showHangout]);

  // ─── ABSA: Region breakdown ───────────────────────────────────

  const absaRegionCounts = useMemo(
    () => (showABSA ? countByField(absaEntries, "region") : {}),
    [absaEntries, showABSA]
  );

  // ─── Export data (flattened summary) ──────────────────────────

  const exportData = useMemo(() => {
    const rows: Record<string, string | number>[] = [];
    if (showES) {
      for (const e of esEntries) {
        rows.push({
          program: "Enterprise Spotlight",
          name: e.applicant_name,
          region: e.region,
          gender: e.gender,
          age_bracket: e.age_bracket,
          date: e.created_at.slice(0, 10),
        });
      }
    }
    if (showVU) {
      for (const e of vuEntries) {
        rows.push({
          program: "Virtual University",
          name: e.episode_title,
          region: "",
          gender: "",
          age_bracket: "",
          date: e.created_at.slice(0, 10),
          views: totalMediaViews(e),
        });
      }
    }
    if (showHangout) {
      for (const e of hangoutEntries) {
        rows.push({
          program: "Hangout",
          name: e.episode_title,
          region: "",
          gender: "",
          age_bracket: "",
          date: e.created_at.slice(0, 10),
          views: totalMediaViews(e),
        });
      }
    }
    if (showABSA) {
      for (const e of absaEntries) {
        rows.push({
          program: "ABSA Onboarding",
          name: e.participant_name,
          region: e.region,
          gender: e.gender,
          age_bracket: e.age_bracket,
          date: e.created_at.slice(0, 10),
        });
      }
    }
    return rows;
  }, [esEntries, vuEntries, hangoutEntries, absaEntries, showES, showVU, showHangout, showABSA]);

  // ─── Render ───────────────────────────────────────────────────

  if (loading) {
    return <p className="text-muted-foreground py-8">Loading executive dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ProgramFilterBar active={programFilter} onChange={setProgramFilter} />
        <div className="flex items-center gap-3">
          <DateRangeFilter
            from={from}
            to={to}
            onFromChange={setFrom}
            onToChange={setTo}
            onClear={() => {
              setFrom("");
              setTo("");
            }}
          />
          <ExportButton
            data={exportData}
            filename="executive-dashboard-export"
            columns={[
              { key: "program", label: "Program" },
              { key: "name", label: "Name" },
              { key: "region", label: "Region" },
              { key: "gender", label: "Gender" },
              { key: "age_bracket", label: "Age Bracket" },
              { key: "date", label: "Date" },
              { key: "views", label: "Views" },
            ]}
          />
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {showES && (
          <KpiCard
            label="Total Applications"
            value={totalApplications}
            trend={trends.es}
          />
        )}
        {showVU && (
          <KpiCard
            label="VU Episodes"
            value={totalVuEpisodes}
            trend={trends.vu}
          />
        )}
        {showHangout && (
          <KpiCard
            label="Hangout Episodes"
            value={totalHangoutEpisodes}
            trend={trends.hangout}
          />
        )}
        {showABSA && (
          <KpiCard
            label="ABSA Participants"
            value={totalAbsaParticipants}
            trend={trends.absa}
          />
        )}
      </div>

      {/* Demographics Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Demographics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <EChart option={donutChartOption(genderCounts, "Gender Distribution")} />
          </div>
          <div className="rounded-lg border bg-card p-4">
            <EChart
              option={groupedBarChartOption(ageBracketByProgram, "Age Bracket by Program")}
            />
          </div>
          {(showES || showABSA) && (
            <div className="rounded-lg border bg-card p-4">
              <EChart
                option={donutChartOption(disabilityCounts, "Disability Status")}
              />
            </div>
          )}
        </div>
      </div>

      {/* Geographic Section */}
      {(showES || showABSA) && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Geographic</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 rounded-lg border bg-card p-4">
              <EChart
                option={horizontalBarChartOption(regionCounts, "Regional Representation")}
              />
            </div>
            <KpiCard label="Regions Represented" value={uniqueRegionCount} />
          </div>
        </div>
      )}

      {/* Enterprise Spotlight Specifics */}
      {showES && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Enterprise Spotlight</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <EChart
                option={pieChartOption(esRegistrationCounts, "Business Registration Status")}
              />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <EChart
                option={horizontalBarChartOption(esSectorCounts, "Business Sector")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Media Programs Section (VU + Hangout) */}
      {showMedia && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Media Programs</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <EChart
                option={
                  mediaMonthlyViews.length > 0
                    ? multiLineChartOption(mediaMonthlyViews, "Monthly Views Trend")
                    : barChartOption({}, "Monthly Views Trend")
                }
              />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <EChart
                option={
                  mediaMonthlyEpisodes.length > 0
                    ? groupedBarChartOption(mediaMonthlyEpisodes, "Monthly Episodes Aired")
                    : barChartOption({}, "Monthly Episodes Aired")
                }
              />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <EChart
                option={barChartOption(mediaPlatformViews, "Views per Platform")}
              />
            </div>
          </div>
        </div>
      )}

      {/* ABSA Section */}
      {showABSA && (
        <div>
          <h2 className="text-lg font-semibold mb-3">ABSA Onboarding</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <EChart
                option={barChartOption(absaRegionCounts, "Region Breakdown")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
