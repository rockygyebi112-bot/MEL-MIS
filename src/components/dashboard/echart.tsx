"use client";

import { useRef, useEffect } from "react";
import * as echarts from "echarts";

interface EChartProps {
  option: echarts.EChartsOption;
  height?: number;
  className?: string;
}

export function EChart({ option, height = 350, className }: EChartProps) {
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
      style={{ width: "100%", height }}
      className={className}
    />
  );
}
