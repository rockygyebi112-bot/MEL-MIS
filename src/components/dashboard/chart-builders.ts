import type { EChartsOption } from "echarts";

// SRSF brand chart palette — green, purple, then complementary colors
export const CHART_COLORS = [
  "#5BBF3A", // srsf green
  "#6B2D7B", // srsf purple
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EF4444", // red
  "#10B981", // emerald
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6366F1", // indigo
  "#84CC16", // lime
  "#06B6D4", // cyan
];

// ─── Data aggregation helpers ────────────────────────────────────

/** Count occurrences of each value for a given field */
export function countByField<T extends Record<string, unknown>>(
  entries: T[],
  field: keyof T
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const val = entry[field];
    if (val === null || val === undefined || val === "") continue;
    const key = String(val);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/** Group entries by month (YYYY-MM) from a date field */
export function groupByMonth<T extends Record<string, unknown>>(
  entries: T[],
  dateField: keyof T
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const entry of entries) {
    const dateVal = entry[dateField];
    if (!dateVal) continue;
    const month = String(dateVal).slice(0, 7); // "2026-04"
    if (!groups[month]) groups[month] = [];
    groups[month].push(entry);
  }
  return groups;
}

// ─── Chart option builders ───────────────────────────────────────

/** Vertical bar chart from counts */
export function barChartOption(
  counts: Record<string, number>,
  title: string
): EChartsOption {
  const categories = Object.keys(counts);
  const values = Object.values(counts);
  return {
    title: { text: title, left: "center", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { rotate: categories.length > 6 ? 30 : 0, fontSize: 11 },
    },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: values,
        itemStyle: { color: CHART_COLORS[0] },
        barMaxWidth: 50,
      },
    ],
    grid: { bottom: categories.length > 6 ? 80 : 40, containLabel: true },
    color: CHART_COLORS,
  };
}

/** Horizontal bar chart from counts (good for long category names) */
export function horizontalBarChartOption(
  counts: Record<string, number>,
  title: string
): EChartsOption {
  // Sort descending by value
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const categories = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  return {
    title: { text: title, left: "center", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    xAxis: { type: "value" },
    yAxis: {
      type: "category",
      data: categories,
      inverse: true,
      axisLabel: { fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: values,
        itemStyle: { color: CHART_COLORS[0] },
        barMaxWidth: 30,
      },
    ],
    grid: { left: 120, containLabel: false },
    color: CHART_COLORS,
  };
}

/** Donut chart from counts */
export function donutChartOption(
  counts: Record<string, number>,
  title: string
): EChartsOption {
  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));
  return {
    title: { text: title, left: "center", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll" },
    series: [
      {
        type: "pie",
        radius: ["40%", "70%"],
        center: ["50%", "50%"],
        data,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold" },
        },
      },
    ],
    color: CHART_COLORS,
  };
}

/** Pie chart from counts (full circle, not donut) */
export function pieChartOption(
  counts: Record<string, number>,
  title: string
): EChartsOption {
  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));
  return {
    title: { text: title, left: "center", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll" },
    series: [
      {
        type: "pie",
        radius: "65%",
        center: ["50%", "50%"],
        data,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: "bold" },
        },
      },
    ],
    color: CHART_COLORS,
  };
}

/** Line chart from monthly data points */
export function lineChartOption(
  monthlyData: Record<string, number>,
  title: string,
  seriesName: string
): EChartsOption {
  const months = Object.keys(monthlyData).sort();
  const values = months.map((m) => monthlyData[m]);
  return {
    title: { text: title, left: "center", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: months },
    yAxis: { type: "value" },
    series: [
      {
        name: seriesName,
        type: "line",
        data: values,
        smooth: true,
        itemStyle: { color: CHART_COLORS[0] },
        areaStyle: { opacity: 0.1 },
      },
    ],
    color: CHART_COLORS,
  };
}

/** Stacked bar chart — multiple series stacked on categories */
export function stackedBarChartOption(
  seriesData: { name: string; data: Record<string, number> }[],
  title: string
): EChartsOption {
  const categorySet = new Set<string>();
  for (const s of seriesData) {
    for (const k of Object.keys(s.data)) categorySet.add(k);
  }
  const categories = Array.from(categorySet).sort();

  return {
    title: { text: title, left: "center", textStyle: { fontSize: 14 } },
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, type: "scroll" },
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value" },
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: "bar" as const,
      stack: "total",
      data: categories.map((c) => s.data[c] || 0),
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
    })),
    grid: { bottom: 60, containLabel: true },
    color: CHART_COLORS,
  };
}
