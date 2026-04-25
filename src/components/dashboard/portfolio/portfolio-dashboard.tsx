"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchAttentionRows,
  fetchDeliveryTrend,
  fetchPortfolioHealth,
  fetchWorkload,
} from "@/lib/portfolio/queries";
import type {
  AttentionRow,
  DeliveryTrendPoint,
  PortfolioHealth,
  Timeframe,
  WorkloadRow,
} from "@/lib/portfolio/types";
import { createClient } from "@/lib/supabase/client";
import { PortfolioSection } from "./portfolio-section";
import { HealthKpis } from "./health-kpis";
import { AttentionTable } from "./attention-table";
import { DeliveryTrend } from "./delivery-trend";
import { WorkloadChart } from "./workload-chart";

interface ProgramOption {
  slug: string;
  name: string;
}

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "quarter", label: "Quarter" },
  { value: "ytd", label: "Year to date" },
];

function isTimeframe(value: string | null): value is Timeframe {
  return value === "30d" || value === "quarter" || value === "ytd";
}

export function PortfolioDashboard() {
  const router = useRouter();
  const params = useSearchParams();

  const programSlug = params.get("program");
  const timeframeParam = params.get("timeframe");
  const timeframe: Timeframe = isTimeframe(timeframeParam)
    ? timeframeParam
    : "30d";

  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  const [health, setHealth] = useState<PortfolioHealth | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);

  const [attention, setAttention] = useState<AttentionRow[] | null>(null);
  const [attentionErr, setAttentionErr] = useState<string | null>(null);

  const [trend, setTrend] = useState<DeliveryTrendPoint[] | null>(null);
  const [trendErr, setTrendErr] = useState<string | null>(null);

  const [workload, setWorkload] = useState<WorkloadRow[] | null>(null);
  const [workloadErr, setWorkloadErr] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load programs once for the filter dropdown.
  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("programs")
        .select("slug,name")
        .order("name");
      setPrograms((data ?? []) as ProgramOption[]);
    })();
  }, []);

  const loadHealth = useCallback(() => {
    setHealthErr(null);
    fetchPortfolioHealth(programSlug)
      .then(setHealth)
      .catch((e: Error) => setHealthErr(e.message));
  }, [programSlug]);

  const loadAttention = useCallback(() => {
    setAttentionErr(null);
    fetchAttentionRows(programSlug, 10)
      .then(setAttention)
      .catch((e: Error) => setAttentionErr(e.message));
  }, [programSlug]);

  const loadTrend = useCallback(() => {
    setTrendErr(null);
    fetchDeliveryTrend(programSlug, timeframe)
      .then(setTrend)
      .catch((e: Error) => setTrendErr(e.message));
  }, [programSlug, timeframe]);

  const loadWorkload = useCallback(() => {
    setWorkloadErr(null);
    fetchWorkload(programSlug, 10)
      .then(setWorkload)
      .catch((e: Error) => setWorkloadErr(e.message));
  }, [programSlug]);

  useEffect(() => {
    loadHealth();
    loadAttention();
    loadTrend();
    loadWorkload();
    setLastUpdated(new Date());
  }, [loadHealth, loadAttention, loadTrend, loadWorkload]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      router.replace(`/dashboard?${next.toString()}`);
    },
    [params, router],
  );

  const lastUpdatedLabel = useMemo(
    () =>
      lastUpdated
        ? lastUpdated.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    [lastUpdated],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="text-sm font-medium">
          Program
          <select
            className="ml-2 rounded border border-border bg-background px-2 py-1 text-sm"
            value={programSlug ?? ""}
            onChange={(e) =>
              setParam("program", e.target.value ? e.target.value : null)
            }
          >
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex rounded border border-border overflow-hidden">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setParam("timeframe", t.value)}
              className={`px-3 py-1 text-xs font-semibold ${
                timeframe === t.value
                  ? "bg-srsf-green-500/10 text-srsf-green-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-muted-foreground">
          {lastUpdatedLabel ? `Updated ${lastUpdatedLabel}` : ""}
        </span>
      </div>

      <PortfolioSection
        title="Portfolio Health"
        loading={health === null && !healthErr}
        error={healthErr}
        onRetry={loadHealth}
      >
        {health && <HealthKpis data={health} />}
      </PortfolioSection>

      <PortfolioSection
        title="Projects Requiring Attention"
        loading={attention === null && !attentionErr}
        error={attentionErr}
        onRetry={loadAttention}
      >
        {attention && <AttentionTable rows={attention} />}
      </PortfolioSection>

      <PortfolioSection
        title="Delivery Trend"
        loading={trend === null && !trendErr}
        error={trendErr}
        onRetry={loadTrend}
      >
        {trend && <DeliveryTrend points={trend} />}
      </PortfolioSection>

      <PortfolioSection
        title="Workload Distribution"
        loading={workload === null && !workloadErr}
        error={workloadErr}
        onRetry={loadWorkload}
      >
        {workload && <WorkloadChart rows={workload} />}
      </PortfolioSection>
    </div>
  );
}
