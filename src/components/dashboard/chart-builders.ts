import type { EChartsOption } from "echarts";

// Shared chart text style for clean typography
const TITLE_STYLE = {
  fontSize: 13,
  fontWeight: 600 as const,
  color: "#374151",
  fontFamily: "Inter, system-ui, sans-serif",
};

// Shared top padding for the chart title so toolbox icons don't collide
const TITLE_TOP = 10;

const AXIS_LABEL_STYLE = {
  fontSize: 11,
  color: "#6B7280",
  fontFamily: "Inter, system-ui, sans-serif",
};

// Reusable toolbox — adds PNG export + data view toggle to every chart
const TOOLBOX: EChartsOption["toolbox"] = {
  show: true,
  right: 10,
  top: 6,
  itemSize: 14,
  itemGap: 8,
  iconStyle: {
    borderColor: "#9CA3AF",
  },
  emphasis: {
    iconStyle: {
      borderColor: "#5BBF3A",
    },
  },
  feature: {
    saveAsImage: {
      title: "Save as PNG",
      name: "chart",
      pixelRatio: 2,
    },
    dataView: {
      title: "Data view",
      lang: ["Data view", "Close", "Refresh"],
      readOnly: true,
    },
  },
};

// SRSF brand chart palette — green, purple, then complementary colors
const CHART_COLORS = [
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function countByField<T extends Record<string, any>>(
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function groupByMonth<T extends Record<string, any>>(
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

export type Granularity = "week" | "month" | "quarter";

/** Group entries by ISO week (YYYY-WNN) from a date field */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function groupByWeek<T extends Record<string, any>>(
  entries: T[],
  dateField: keyof T
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const entry of entries) {
    const dateVal = entry[dateField];
    if (!dateVal) continue;
    const d = new Date(String(dateVal));
    if (isNaN(d.getTime())) continue;
    // ISO week: step to Thursday of the same week, then get its year + week number
    const day = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
    const year = day.getUTCFullYear();
    const weekStart = new Date(Date.UTC(year, 0, 1));
    const week = Math.ceil(
      ((day.getTime() - weekStart.getTime()) / 86400000 + 1) / 7
    );
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

/** Group entries by quarter (YYYY-QN) from a date field */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function groupByQuarter<T extends Record<string, any>>(
  entries: T[],
  dateField: keyof T
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const entry of entries) {
    const dateVal = entry[dateField];
    if (!dateVal) continue;
    const d = new Date(String(dateVal));
    if (isNaN(d.getTime())) continue;
    const year = d.getFullYear();
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    const key = `${year}-Q${quarter}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

/** Delegate to the correct grouping function based on granularity */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function groupByGranularity<T extends Record<string, any>>(
  entries: T[],
  dateField: keyof T,
  granularity: Granularity
): Record<string, T[]> {
  switch (granularity) {
    case "week":
      return groupByWeek(entries, dateField);
    case "quarter":
      return groupByQuarter(entries, dateField);
    default:
      return groupByMonth(entries, dateField);
  }
}

// ─── Chart option builders ───────────────────────────────────────

// ─── Unified Bar Chart Builder ─────────────────────────────────

export interface BarChartConfig {
  orientation: "horizontal" | "vertical";
  yAxisWidth?: number;
  xAxisWidth?: number;
}

/** Internal builder for bar charts - unified implementation */
function buildBarChartOption(
  counts: Record<string, number>,
  title: string,
  config: BarChartConfig
): EChartsOption {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const categories = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  const total = values.reduce((s, v) => s + v, 0);

  const labelFormatter = (params: unknown) => {
    const p = params as { value: number };
    const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
    return `${p.value.toLocaleString()} (${pct}%)`;
  };

  const tooltipFormatter = (params: unknown) => {
    const arr = params as Array<{ name: string; value: number; marker: string }>;
    const p = arr[0];
    const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
    return `${p.marker}${p.name}<br/><strong>${p.value.toLocaleString()}</strong> (${pct}%)`;
  };

  if (config.orientation === "horizontal") {
    return {
      title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
      toolbox: TOOLBOX,
      tooltip: { trigger: "axis", formatter: tooltipFormatter },
      xAxis: { type: "value", axisLabel: { ...AXIS_LABEL_STYLE, hideOverlap: true } },
      yAxis: {
        type: "category",
        data: categories,
        inverse: true,
        axisLabel: { ...AXIS_LABEL_STYLE, overflow: "truncate", width: config.yAxisWidth ?? 130 },
      },
      series: [{
        type: "bar",
        data: values,
        itemStyle: { color: CHART_COLORS[0], borderRadius: [0, 3, 3, 0] },
        barMinHeight: 4,
        barCategoryGap: "35%",
        label: { show: true, position: "right", fontSize: 10, color: "#374151", fontFamily: "Inter, system-ui, sans-serif", formatter: labelFormatter },
      }],
      grid: { left: 8, right: 110, top: 50, bottom: 30, containLabel: true },
      color: CHART_COLORS,
    };
  }

  // Vertical orientation
  return {
    title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
    toolbox: TOOLBOX,
    tooltip: { trigger: "axis", formatter: tooltipFormatter },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { ...AXIS_LABEL_STYLE, rotate: categories.length > 10 ? 45 : 0, hideOverlap: true },
    },
    yAxis: { type: "value" },
    series: [{
      type: "bar",
      data: values,
      itemStyle: { color: CHART_COLORS[0], borderRadius: [3, 3, 0, 0] },
      barMinHeight: 4,
      label: { show: true, position: "top", fontSize: 10, color: "#374151", fontFamily: "Inter, system-ui, sans-serif", formatter: labelFormatter },
    }],
    grid: { left: 50, right: 30, top: 50, bottom: categories.length > 10 ? 80 : 50, containLabel: true },
    color: CHART_COLORS,
  };
}

/** Horizontal bar chart from counts (sorted descending) */
export function barChartOption(
  counts: Record<string, number>,
  title: string
): EChartsOption {
  return buildBarChartOption(counts, title, { orientation: "horizontal" });
}

/** Horizontal bar chart from counts (good for long category names) */
export function horizontalBarChartOption(
  counts: Record<string, number>,
  title: string
): EChartsOption {
  return buildBarChartOption(counts, title, { orientation: "horizontal" });
}

/** Vertical bar chart from counts */
export function verticalBarChartOption(
  counts: Record<string, number>,
  title: string
): EChartsOption {
  return buildBarChartOption(counts, title, { orientation: "vertical" });
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
    title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
    toolbox: TOOLBOX,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll" },
    series: [
      {
        type: "pie",
        radius: ["40%", "65%"],
        center: ["50%", "48%"],
        data,
        label: {
          show: true,
          formatter: "{b}\n{c} ({d}%)",
          fontSize: 10,
          color: "#374151",
          fontFamily: "Inter, system-ui, sans-serif",
          overflow: "truncate",
          width: 80,
        },
        labelLine: { show: true, length: 6, length2: 6 },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: "bold" },
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
    title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
    toolbox: TOOLBOX,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, type: "scroll" },
    series: [
      {
        type: "pie",
        radius: "55%",
        center: ["50%", "48%"],
        data,
        label: {
          show: true,
          formatter: "{b}\n{c} ({d}%)",
          fontSize: 10,
          color: "#374151",
          fontFamily: "Inter, system-ui, sans-serif",
          overflow: "truncate",
          width: 80,
        },
        labelLine: { show: true, length: 6, length2: 6 },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: "bold" },
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
  const total = values.reduce((s, v) => s + v, 0);
  return {
    title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
    toolbox: TOOLBOX,
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number; marker: string; seriesName: string }>;
        const p = arr[0];
        const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
        return `${p.name}<br/>${p.marker}${p.seriesName}: <strong>${p.value.toLocaleString()}</strong> (${pct}%)`;
      },
    },
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
        label: {
          show: true,
          position: "top",
          fontSize: 10,
          color: "#374151",
          fontFamily: "Inter, system-ui, sans-serif",
          formatter: (params: unknown) => {
            const p = params as { value: number };
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
            return `${p.value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    ],
    grid: { top: 50, bottom: 40, containLabel: true },
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

  // Per-category totals, used to compute percentage per stacked segment
  const categoryTotals: Record<string, number> = {};
  for (const c of categories) {
    categoryTotals[c] = seriesData.reduce((sum, s) => sum + (s.data[c] || 0), 0);
  }

  return {
    title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
    toolbox: TOOLBOX,
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number; marker: string; seriesName: string }>;
        if (!arr.length) return "";
        const catTotal = categoryTotals[arr[0].name] || 0;
        let html = `<strong>${arr[0].name}</strong><br/>`;
        for (const p of arr) {
          const pct = catTotal > 0 ? ((p.value / catTotal) * 100).toFixed(1) : "0";
          html += `${p.marker}${p.seriesName}: <strong>${p.value.toLocaleString()}</strong> (${pct}%)<br/>`;
        }
        html += `Total: <strong>${catTotal.toLocaleString()}</strong>`;
        return html;
      },
    },
    legend: { bottom: 0, type: "scroll" },
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value" },
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: "bar" as const,
      stack: "total",
      data: categories.map((c) => s.data[c] || 0),
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
      label: {
        show: true,
        position: "inside",
        fontSize: 10,
        color: "#ffffff",
        fontFamily: "Inter, system-ui, sans-serif",
        formatter: (params: unknown) => {
          const p = params as { value: number; dataIndex: number };
          const catName = categories[p.dataIndex];
          const catTotal = categoryTotals[catName] || 0;
          if (!p.value) return "";
          const pct = catTotal > 0 ? ((p.value / catTotal) * 100).toFixed(0) : "0";
          return `${p.value.toLocaleString()}\n(${pct}%)`;
        },
      },
    })),
    grid: { top: 50, bottom: 60, containLabel: true },
    color: CHART_COLORS,
  };
}

/** Multi-line chart — overlays multiple series for comparison */
export function multiLineChartOption(
  seriesDataArr: { name: string; data: Record<string, number> }[],
  title: string
): EChartsOption {
  // Collect all month keys across all series
  const monthSet = new Set<string>();
  for (const s of seriesDataArr) {
    for (const k of Object.keys(s.data)) monthSet.add(k);
  }
  const months = Array.from(monthSet).sort();

  // Per-month totals across all series for percentage calculation
  const monthTotals: Record<string, number> = {};
  for (const m of months) {
    monthTotals[m] = seriesDataArr.reduce((sum, s) => sum + (s.data[m] || 0), 0);
  }

  return {
    title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
    toolbox: TOOLBOX,
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number; marker: string; seriesName: string }>;
        if (!arr.length) return "";
        const monthTotal = monthTotals[arr[0].name] || 0;
        let html = `<strong>${arr[0].name}</strong><br/>`;
        for (const p of arr) {
          const pct = monthTotal > 0 ? ((p.value / monthTotal) * 100).toFixed(1) : "0";
          html += `${p.marker}${p.seriesName}: <strong>${p.value.toLocaleString()}</strong> (${pct}%)<br/>`;
        }
        return html;
      },
    },
    legend: { bottom: 0, type: "scroll" },
    xAxis: { type: "category", data: months },
    yAxis: { type: "value" },
    series: seriesDataArr.map((s, i) => ({
      name: s.name,
      type: "line" as const,
      data: months.map((m) => s.data[m] || 0),
      smooth: true,
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
      areaStyle: { opacity: 0.05 },
      label: {
        show: true,
        position: "top",
        fontSize: 9,
        color: "#374151",
        fontFamily: "Inter, system-ui, sans-serif",
        formatter: (params: unknown) => {
          const p = params as { value: number; dataIndex: number };
          if (!p.value) return "";
          const monthName = months[p.dataIndex];
          const monthTotal = monthTotals[monthName] || 0;
          const pct = monthTotal > 0 ? ((p.value / monthTotal) * 100).toFixed(0) : "0";
          return `${p.value.toLocaleString()} (${pct}%)`;
        },
      },
    })),
    grid: { top: 50, bottom: 60, containLabel: true },
    color: CHART_COLORS,
  };
}

/** Grouped horizontal bar chart — multiple series side-by-side (not stacked) */
export function groupedBarChartOption(
  seriesData: { name: string; data: Record<string, number> }[],
  title: string
): EChartsOption {
  const categorySet = new Set<string>();
  for (const s of seriesData) {
    for (const k of Object.keys(s.data)) categorySet.add(k);
  }
  const categories = Array.from(categorySet).sort();

  // Per-category totals across all series for percentage calculation
  const categoryTotals: Record<string, number> = {};
  for (const c of categories) {
    categoryTotals[c] = seriesData.reduce((sum, s) => sum + (s.data[c] || 0), 0);
  }

  return {
    title: { text: title, left: "center", top: TITLE_TOP, textStyle: TITLE_STYLE },
    toolbox: TOOLBOX,
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number; marker: string; seriesName: string }>;
        if (!arr.length) return "";
        const catTotal = categoryTotals[arr[0].name] || 0;
        let html = `<strong>${arr[0].name}</strong><br/>`;
        for (const p of arr) {
          const pct = catTotal > 0 ? ((p.value / catTotal) * 100).toFixed(1) : "0";
          html += `${p.marker}${p.seriesName}: <strong>${p.value.toLocaleString()}</strong> (${pct}%)<br/>`;
        }
        html += `Total: <strong>${catTotal.toLocaleString()}</strong>`;
        return html;
      },
    },
    legend: { bottom: 0, type: "scroll" },
    xAxis: { type: "value", axisLabel: { ...AXIS_LABEL_STYLE, hideOverlap: true } },
    yAxis: {
      type: "category",
      data: categories,
      inverse: true,
      axisLabel: { ...AXIS_LABEL_STYLE, overflow: "truncate", width: 90 },
    },
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: "bar" as const,
      data: categories.map((c) => s.data[c] || 0),
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
      barMaxWidth: 22,
      label: {
        show: true,
        position: "right",
        fontSize: 9,
        color: "#374151",
        fontFamily: "Inter, system-ui, sans-serif",
        formatter: (params: unknown) => {
          const p = params as { value: number; dataIndex: number };
          if (!p.value) return "";
          const catName = categories[p.dataIndex];
          const catTotal = categoryTotals[catName] || 0;
          const pct = catTotal > 0 ? ((p.value / catTotal) * 100).toFixed(0) : "0";
          return `${p.value.toLocaleString()} (${pct}%)`;
        },
      },
    })),
    grid: { left: 8, right: 8, top: 50, bottom: 40, containLabel: true },
    color: CHART_COLORS,
  };
}
