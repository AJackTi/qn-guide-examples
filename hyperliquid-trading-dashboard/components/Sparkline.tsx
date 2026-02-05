"use client";

import { useMemo } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
}

export default function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#3EE148",
  fillColor,
  strokeWidth = 1.5
}: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return "";

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const padding = 2;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const points = data.map((value, i) => {
      const x = padding + (i / (data.length - 1)) * innerWidth;
      const y = padding + innerHeight - ((value - min) / range) * innerHeight;
      return { x, y };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

    return linePath;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!data || data.length < 2 || !fillColor) return "";

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const padding = 2;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const points = data.map((value, i) => {
      const x = padding + (i / (data.length - 1)) * innerWidth;
      const y = padding + innerHeight - ((value - min) / range) * innerHeight;
      return { x, y };
    });

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

    const firstX = points[0]?.x ?? padding;
    const lastX = points[points.length - 1]?.x ?? width - padding;
    const bottomY = height - padding;

    return `${linePath} L ${lastX.toFixed(2)} ${bottomY} L ${firstX.toFixed(2)} ${bottomY} Z`;
  }, [data, width, height, fillColor]);

  if (!data || data.length < 2) {
    return (
      <div 
        className="flex items-center justify-center text-qn-grey-400 text-xs"
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      {fillColor && (
        <path
          d={areaPath}
          fill={fillColor}
          opacity={0.15}
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}