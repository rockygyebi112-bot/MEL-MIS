"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { LEARNING_CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EChart } from "@/components/dashboard/echart";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { ExportButton } from "@/components/dashboard/export-button";
import {
  donutChartOption,
  lineChartOption,
  barChartOption,
} from "@/components/dashboard/chart-builders";
import {
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  SearchX,
} from "lucide-react";
import type { LearningEntry, Program } from "@/lib/types";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

const PAGE_SIZE = 20;

const PROGRAM_COLORS: Record<string, string> = {
  "Enterprise Spotlight": "bg-emerald-100 text-emerald-700",
  "Virtual University": "bg-blue-100 text-blue-700",
  Hangout: "bg-purple-100 text-purple-700",
  "ABSA Onboarding": "bg-amber-100 text-amber-700",
};

export default function LearningsPage() {
  const [learnings, setLearnings] = useState<(LearningEntry & { program?: Program })[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [programFilter, setProgramFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Feed state
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [learningsRes, programsRes] = await Promise.all([
      supabase
        .from("learnings")
        .select("*, program:programs(*)")
        .order("created_at", { ascending: false }),
      supabase.from("programs").select("*").order("name"),
    ]);
    setLearnings((learningsRes.data as (LearningEntry & { program?: Program })[]) ?? []);
    setPrograms((programsRes.data as Program[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = learnings;
    if (programFilter !== "all") {
      result = result.filter((l) => l.program_id === programFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((l) => l.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
      );
    }
    if (from) {
      result = result.filter((l) => l.created_at >= from);
    }
    if (to) {
      result = result.filter((l) => l.created_at <= `${to}T23:59:59`);
    }
    return result;
  }, [learnings, programFilter, categoryFilter, search, from, to]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [programFilter, categoryFilter, search, from, to]);

  // Analytics
  const totalLearnings = filtered.length;
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const learningsThisMonth = filtered.filter(
    (l) => l.created_at.slice(0, 7) === thisMonth
  ).length;

  const mostActiveProgram = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of filtered) {
      const name = l.program?.name ?? "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    }
    let max = 0;
    let best = "—";
    for (const [name, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        best = name;
      }
    }
    return best;
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of filtered) {
      if (l.category) counts[l.category] = (counts[l.category] || 0) + 1;
    }
    return counts;
  }, [filtered]);

  const monthlyTrend = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of filtered) {
      const month = l.created_at.slice(0, 7);
      counts[month] = (counts[month] || 0) + 1;
    }
    return counts;
  }, [filtered]);

  const programCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of filtered) {
      const name = l.program?.name ?? "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    }
    return counts;
  }, [filtered]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return <DashboardSkeleton kpis={3} charts={3} />;
  }

  const hasNoLearnings = learnings.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learnings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Insights and learnings captured across all programs.
          </p>
        </div>
        <ExportButton
          data={filtered.map((l) => ({
            program: l.program?.name ?? "",
            category: l.category,
            title: l.title,
            description: l.description,
            date: l.learning_date ?? "",
            created: l.created_at,
          }))}
          filename="learnings-export"
          columns={[
            { key: "program", label: "Program" },
            { key: "category", label: "Category" },
            { key: "title", label: "Title" },
            { key: "description", label: "Description" },
            { key: "date", label: "Learning Date" },
            { key: "created", label: "Created" },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
            Program
          </span>
          <Select
            value={programFilter}
            onValueChange={(v) => setProgramFilter(v ?? "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
            Category
          </span>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v ?? "all")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {LEARNING_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative space-y-1">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
            Search
          </span>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search learnings..."
              className="pl-7 w-56 h-8 text-xs"
            />
          </div>
        </div>
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Learnings" value={totalLearnings} />
        <KpiCard label="Learnings This Month" value={learningsThisMonth} />
        <KpiCard label="Most Active Program" value={mostActiveProgram} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <EChart
            option={donutChartOption(categoryCounts, "Category Distribution")}
          />
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <EChart
            option={lineChartOption(
              monthlyTrend,
              "Learnings Over Time",
              "Learnings"
            )}
          />
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <EChart
            option={barChartOption(programCounts, "Learnings by Program")}
          />
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            Learning Feed ({filtered.length})
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card">
            {hasNoLearnings ? (
              <EmptyState
                icon={Lightbulb}
                title="No learnings captured yet"
                description="Record insights from your programs in the Data Entry section and they'll show up here."
                variant="page"
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="No matches"
                description="Try adjusting your filters or clearing the search."
                variant="page"
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {paged.map((l) => {
              const isExpanded = expandedId === l.id;
              const programName = l.program?.name ?? "Unknown";
              const colorClass =
                PROGRAM_COLORS[programName] ?? "bg-gray-100 text-gray-700";
              return (
                <div
                  key={l.id}
                  className="rounded-xl border border-border/60 bg-card px-5 py-4 transition-colors hover:border-border hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge
                          variant="secondary"
                          className={colorClass}
                        >
                          {programName}
                        </Badge>
                        {l.category && (
                          <Badge variant="outline">{l.category}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {l.learning_date
                            ? new Date(l.learning_date).toLocaleDateString()
                            : new Date(l.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{l.title}</h4>
                      {l.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {isExpanded
                            ? l.description
                            : l.description.length > 150
                              ? l.description.slice(0, 150) + "..."
                              : l.description}
                        </p>
                      )}
                    </div>
                    {l.description && l.description.length > 150 && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : l.id)
                        }
                        className="shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
