"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import type { ProgramFilter } from "./program-filter-bar";
import { DashboardSkeleton } from "./dashboard-skeleton";
import {
  countByField,
  groupByGranularity,
  type Granularity,
  barChartOption,
  horizontalBarChartOption,
  donutChartOption,
  pieChartOption,
  multiLineChartOption,
  groupedBarChartOption,
} from "./chart-builders";
import { usePreviousPeriodCounts } from "@/hooks/use-previous-period-counts";
import { GranularityToggle } from "./granularity-toggle";
import { CustomIndicatorCharts } from "./custom-indicator-charts";
import { EmbeddedProjectOverview } from "./embedded-project-overview";

// ─── Helpers ────────────────────────────────────────────────────

function totalMediaViews(entry: MediaProgramEntry): number {
  let total = 0;
  if (entry.metrics.facebook) total += entry.metrics.facebook.views;
  if (entry.metrics.youtube) total += entry.metrics.youtube.views;
  return total;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-1 h-6 rounded-full bg-srsf-green-500 shrink-0" />
      <h2 className="text-lg font-bold text-foreground">{children}</h2>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────

interface Props {
  programFilter: ProgramFilter;
}

export function ExecutiveDashboard({ programFilter }: Props) {
  const [esEntries, setEsEntries] = useState<EnterpriseSpotlightEntry[]>([]);
  const [vuEntries, setVuEntries] = useState<MediaProgramEntry[]>([]);
  const [hangoutEntries, setHangoutEntries] = useState<MediaProgramEntry[]>([]);
  const [absaEntries, setAbsaEntries] = useState<AbsaOnboardingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const periodLabel = granularity === "week" ? "Weekly" : granularity === "quarter" ? "Quarterly" : "Monthly";
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

      const buildMediaQuery = (table: string) => {
        let q = supabase
          .from(table)
          .select("*")
          .eq("is_draft", false)
          .order("date_aired", { ascending: false });
        if (from) q = q.gte("date_aired", from);
        if (to) q = q.lte("date_aired", to);
        return q;
      };

      const [esRes, vuRes, hangoutRes, absaRes] = await Promise.all([
        buildQuery("enterprise_spotlight_entries"),
        buildMediaQuery("virtual_university_entries"),
        buildMediaQuery("hangout_entries"),
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

  const trendInputs = useMemo(
    () => [
      { key: "es", table: "enterprise_spotlight_entries", from, to },
      { key: "vu", table: "virtual_university_entries", from, to },
      { key: "hangout", table: "hangout_entries", from, to },
      { key: "absa", table: "absa_onboarding_entries", from, to },
    ],
    [from, to]
  );
  const trends = usePreviousPeriodCounts(trendInputs);

  // ─── Show/hide based on program filter ────────────────────────

  const showES = programFilter === "enterprise-spotlight";
  const showVU = programFilter === "virtual-university";
  const showHangout = programFilter === "hangout";
  const showABSA = programFilter === "absa-onboarding";
  const showNkabom = programFilter === "nkabom-collaborative";
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
      const groups = groupByGranularity(vuEntries, "date_aired", granularity);
      const totals: Record<string, number> = {};
      for (const [period, items] of Object.entries(groups)) {
        totals[period] = (items as MediaProgramEntry[]).reduce(
          (sum, e) => sum + totalMediaViews(e),
          0
        );
      }
      series.push({ name: "Virtual University", data: totals });
    }

    if (showHangout) {
      const groups = groupByGranularity(hangoutEntries, "date_aired", granularity);
      const totals: Record<string, number> = {};
      for (const [period, items] of Object.entries(groups)) {
        totals[period] = (items as MediaProgramEntry[]).reduce(
          (sum, e) => sum + totalMediaViews(e),
          0
        );
      }
      series.push({ name: "Hangout", data: totals });
    }

    return series;
  }, [vuEntries, hangoutEntries, showVU, showHangout, granularity]);

  // ─── Media Programs: Monthly episodes (grouped bar) ───────────

  const mediaMonthlyEpisodes = useMemo(() => {
    const series: { name: string; data: Record<string, number> }[] = [];

    if (showVU) {
      const groups = groupByGranularity(vuEntries, "date_aired", granularity);
      const counts: Record<string, number> = {};
      for (const [period, items] of Object.entries(groups)) {
        counts[period] = items.length;
      }
      series.push({ name: "Virtual University", data: counts });
    }

    if (showHangout) {
      const groups = groupByGranularity(hangoutEntries, "date_aired", granularity);
      const counts: Record<string, number> = {};
      for (const [period, items] of Object.entries(groups)) {
        counts[period] = items.length;
      }
      series.push({ name: "Hangout", data: counts });
    }

    return series;
  }, [vuEntries, hangoutEntries, showVU, showHangout, granularity]);

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

  // Reusable chart card wrapper class - consistent with KPI cards
  const chartCard = "rounded-xl border border-border/60 bg-white p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ease-out";
  if (loading) {
    return <DashboardSkeleton kpis={4} charts={4} />;
  }

  return (
    <div className="space-y-8">
      {/* Date range + Export (program filter is now lifted to the page level) */}
      <div className="flex flex-wrap items-end justify-end gap-3">
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

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {showES && (
          <KpiCard label="Total Applications" value={totalApplications} trend={trends["es"]} accent="green" />
        )}
        {showVU && (
          <KpiCard label="VU Episodes" value={totalVuEpisodes} trend={trends["vu"]} accent="blue" />
        )}
        {showHangout && (
          <KpiCard label="Hangout Episodes" value={totalHangoutEpisodes} trend={trends["hangout"]} accent="purple" />
        )}
        {showABSA && (
          <KpiCard label="ABSA Participants" value={totalAbsaParticipants} trend={trends["absa"]} accent="amber" />
        )}
        {(showES || showABSA) && (
          <KpiCard label="Regions Represented" value={uniqueRegionCount} accent="teal" />
        )}
      </div>

      {/* Demographics Section — only programs/projects with participant-level M&E data */}
      {(showES || showVU || showHangout || showABSA) && (
        <section>
          <SectionHeading>Demographics</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={chartCard}>
              <EChart option={donutChartOption(genderCounts, "Gender Distribution")} />
            </div>
            <div className={chartCard}>
              <EChart
                option={groupedBarChartOption(ageBracketByProgram, "Age Bracket by Program")}
              />
            </div>
            {(showES || showABSA) && (
              <div className={chartCard}>
                <EChart
                  option={donutChartOption(disabilityCounts, "Disability Status")}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Geographic Section */}
      {(showES || showABSA) && (
        <section>
          <SectionHeading>Geographic</SectionHeading>
          <div className={chartCard}>
            <EChart
              option={horizontalBarChartOption(regionCounts, "Regional Representation")}
              height={Math.max(320, Object.keys(regionCounts).length * 40 + 90)}
            />
          </div>
        </section>
      )}

      {/* Enterprise Spotlight — project activity progress */}
      {showES && (
        <section>
          <SectionHeading>Project Progress</SectionHeading>
          <EmbeddedProjectOverview slug="enterprise-spotlight" />
        </section>
      )}

      {/* Enterprise Spotlight Specifics */}
      {showES && (
        <section>
          <SectionHeading>Business Information</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={chartCard}>
              <EChart
                option={pieChartOption(esRegistrationCounts, "Business Registration Status")}
              />
            </div>
            <div className={chartCard}>
              <EChart
                option={horizontalBarChartOption(esSectorCounts, "Business Sector")}
                height={Math.max(300, Object.keys(esSectorCounts).length * 40 + 90)}
              />
            </div>
          </div>
          <div className="mt-4">
            <CustomIndicatorCharts
              programSlug="enterprise-spotlight"
              entries={esEntries as unknown as Record<string, unknown>[]}
              showOnExecutiveOnly
            />
          </div>
        </section>
      )}

      {/* Media Programs Section (VU + Hangout) */}
      {showMedia && (
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-srsf-green-500 shrink-0" />
              <h2 className="text-lg font-bold text-foreground">Media Programs</h2>
            </div>
            <GranularityToggle value={granularity} onChange={setGranularity} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={chartCard}>
              <EChart
                option={
                  mediaMonthlyViews.length > 0
                    ? multiLineChartOption(mediaMonthlyViews, `${periodLabel} Views Trend`)
                    : barChartOption({}, `${periodLabel} Views Trend`)
                }
              />
            </div>
            <div className={chartCard}>
              <EChart
                option={
                  mediaMonthlyEpisodes.length > 0
                    ? groupedBarChartOption(mediaMonthlyEpisodes, `${periodLabel} Episodes Aired`)
                    : barChartOption({}, `${periodLabel} Episodes Aired`)
                }
              />
            </div>
            <div className={chartCard}>
              <EChart
                option={barChartOption(mediaPlatformViews, "Views per Platform")}
              />
            </div>
          </div>
          {showVU && (
            <div className="mt-4">
              <CustomIndicatorCharts
                programSlug="virtual-university"
                entries={vuEntries as unknown as Record<string, unknown>[]}
                showOnExecutiveOnly
              />
            </div>
          )}
          {showHangout && (
            <div className="mt-4">
              <CustomIndicatorCharts
                programSlug="hangout"
                entries={hangoutEntries as unknown as Record<string, unknown>[]}
                showOnExecutiveOnly
              />
            </div>
          )}
        </section>
      )}

      {/* Nkabom Collaborative — surface project activity progress */}
      {showNkabom && (
        <section>
          <SectionHeading>Nkabom Collaborative</SectionHeading>
          <EmbeddedProjectOverview slug="nkabom-collaborative" />
        </section>
      )}

      {/* ABSA Onboarding — project activity progress */}
      {showABSA && (
        <section>
          <SectionHeading>Project Progress</SectionHeading>
          <EmbeddedProjectOverview slug="absa-onboarding" />
        </section>
      )}

      {/* ABSA Section */}
      {showABSA && (
        <section>
          <SectionHeading>ABSA Onboarding</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={chartCard}>
              <EChart
                option={horizontalBarChartOption(absaRegionCounts, "Region Breakdown")}
                height={320}
              />
            </div>
          </div>
          <div className="mt-4">
            <CustomIndicatorCharts
              programSlug="absa-onboarding"
              entries={absaEntries as unknown as Record<string, unknown>[]}
              showOnExecutiveOnly
            />
          </div>
        </section>
      )}
    </div>
  );
}
