"use client";

import { useRef, useEffect } from "react";
import * as echarts from "echarts";
import { cn } from "@/lib/utils";

interface EChartProps {
  option: echarts.EChartsOption;
  /** Explicit pixel height. When omitted, uses responsive Tailwind class h-56 lg:h-72 */
  height?: number;
  className?: string;
}

export function EChart({ option, height, className }: EChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    instanceRef.current = echarts.init(chartRef.current);

    const handleResize = () => instanceRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setOption(option, { notMerge: true });
    }
  }, [option]);

  return (
    <div
      ref={chartRef}
      style={{ width: "100%", ...(height !== undefined ? { height } : {}) }}
      className={cn(height === undefined ? "h-64 lg:h-72" : undefined, className)}
    />
  );
}
