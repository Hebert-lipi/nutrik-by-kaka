"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  values: number[];
  labels: string[];
  className?: string;
  height?: number;
};

export function MiniLineChart({ values, labels, className, height = 140 }: Props) {
  const w = 320;
  const h = height;
  const pad = { t: 12, r: 8, b: 28, l: 8 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const min = Math.min(...values) * 0.92;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad.l + (i / Math.max(1, values.length - 1)) * innerW;
    const y = pad.t + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? 0} ${pad.t + innerH} L ${points[0]?.x ?? 0} ${pad.t + innerH} Z`;

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full text-primary"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Gráfico de evolução de pacientes ativos nos últimos 7 dias"
      >
        <defs>
          <linearGradient id="nutrik-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(197, 224, 99)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(197, 224, 99)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="nutrik-chart-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(165, 190, 70)" />
            <stop offset="100%" stopColor="rgb(197, 224, 99)" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66].map((t) => (
          <line
            key={t}
            x1={pad.l}
            x2={w - pad.r}
            y1={pad.t + innerH * t}
            y2={pad.t + innerH * t}
            stroke="rgb(var(--color-neutral-200))"
            strokeWidth="1"
            strokeOpacity={0.6}
          />
        ))}
        <path d={areaD} fill="url(#nutrik-chart-fill)" />
        <path
          d={pathD}
          fill="none"
          stroke="url(#nutrik-chart-line)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="rgb(var(--color-bg-0))" stroke="rgb(var(--color-primary))" strokeWidth={2} />
        ))}
        {labels.map((lab, i) => {
          const x = pad.l + (i / Math.max(1, labels.length - 1)) * innerW;
          return (
            <text
              key={lab}
              x={x}
              y={h - 6}
              textAnchor="middle"
              className="fill-neutral-500 text-[9px] font-bold"
              style={{ fontSize: 9 }}
            >
              {lab}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
