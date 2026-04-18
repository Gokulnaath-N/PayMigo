import React, { useState } from 'react';
import { motion } from 'motion/react';

interface ForecastChartProps {
  riskScores: number[];
  forecastDates: string[];
}

const RISK_COLOR = (s: number) =>
  s > 0.7 ? '#ef4444' : s > 0.4 ? '#eab308' : '#22c55e';

const RISK_LABEL = (s: number) =>
  s > 0.7 ? 'HIGH' : s > 0.4 ? 'MEDIUM' : 'LOW';

export default function ForecastChart({ riskScores, forecastDates }: ForecastChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!riskScores?.length) return null;

  const W = 560, H = 200;
  const pad = { top: 24, right: 20, bottom: 36, left: 44 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const max = Math.max(...riskScores);
  const min = Math.min(...riskScores);
  const range = max - min || 0.01;

  const px = (i: number) => pad.left + (i / (riskScores.length - 1)) * cW;
  const py = (s: number) => pad.top + (1 - (s - min) / range) * cH;

  // Build SVG path string (M x y L x y ...)
  const linePath = riskScores
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(s).toFixed(1)}`)
    .join(' ');

  // Closed area path
  const areaPath =
    linePath +
    ` L ${px(riskScores.length - 1).toFixed(1)} ${(H - pad.bottom).toFixed(1)}` +
    ` L ${pad.left} ${(H - pad.bottom).toFixed(1)} Z`;

  const avgScore = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
  const lineColor = RISK_COLOR(avgScore);

  const fmtDay = (s: string) => {
    try { return new Date(s).toLocaleDateString('en-IN', { weekday: 'short' }); }
    catch { return s; }
  };

  return (
    <div className="w-full space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => {
          const y = pad.top + (1 - v) * cH;
          return (
            <g key={v}>
              <line
                x1={pad.left} y1={y}
                x2={W - pad.right} y2={y}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1}
              />
              <text
                x={pad.left - 6} y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="rgba(255,255,255,0.35)"
              >
                {v.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom}
              stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom}
              stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {/* Filled area */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points + tooltips */}
        {riskScores.map((score, i) => {
          const x = px(i), y = py(score);
          const isHov = hovered === i;
          return (
            <g key={i}>
              {/* X-axis label */}
              <text
                x={x} y={H - pad.bottom + 14}
                textAnchor="middle"
                fontSize={9}
                fill={isHov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)'}
              >
                {fmtDay(forecastDates[i])}
              </text>

              {/* Hover vertical line */}
              {isHov && (
                <line
                  x1={x} y1={pad.top}
                  x2={x} y2={H - pad.bottom}
                  stroke={RISK_COLOR(score)}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                  opacity={0.5}
                />
              )}

              {/* Circle hitbox */}
              <circle
                cx={x} cy={y}
                r={isHov ? 6 : 4}
                fill={RISK_COLOR(score)}
                stroke="rgba(0,0,0,0.6)"
                strokeWidth={2}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />

              {/* Tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={x - 36} y={y - 34}
                    width={72} height={26}
                    rx={5}
                    fill="rgba(0,0,0,0.85)"
                    stroke={RISK_COLOR(score)}
                    strokeWidth={1}
                  />
                  <text x={x} y={y - 24} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
                    {RISK_LABEL(score)}
                  </text>
                  <text x={x} y={y - 14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.6)">
                    {(score * 100).toFixed(0)}% risk
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend + avg */}
      <div className="flex items-center justify-between text-[10px] text-text-secondary px-1">
        <div className="flex gap-4">
          {[
            { label: 'Low',  color: '#22c55e' },
            { label: 'Med',  color: '#eab308' },
            { label: 'High', color: '#ef4444' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 font-mono font-bold" style={{ color: lineColor }}>
          Avg {(avgScore * 100).toFixed(0)}% · {RISK_LABEL(avgScore)}
        </div>
      </div>
    </div>
  );
}
