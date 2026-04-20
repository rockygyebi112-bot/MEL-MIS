"use client";

interface SparklineProps {
  values: number[]; // each 0–100
  accentClassName?: string; // stroke color via tailwind text-* class, e.g. "text-perf-accent-ontrack"
  height?: number; // px
  className?: string;
}

export function Sparkline({
  values,
  accentClassName = "text-foreground",
  height = 32,
  className = "",
}: SparklineProps) {
  if (values.length < 2) return null;

  const width = 100; // viewBox units, scales via CSS
  const maxY = 100;
  const stepX = width / (values.length - 1);
  const toY = (v: number) => height - (v / maxY) * height;

  const points = values.map((v, i) => `${i * stepX},${toY(v)}`).join(" ");
  const areaPath =
    `M0,${height} ` +
    values.map((v, i) => `L${i * stepX},${toY(v)}`).join(" ") +
    ` L${width},${height} Z`;

  const lastX = (values.length - 1) * stepX;
  const lastY = toY(values[values.length - 1]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${accentClassName} ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <path d={areaPath} fill="currentColor" opacity={0.12} />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
    </svg>
  );
}
