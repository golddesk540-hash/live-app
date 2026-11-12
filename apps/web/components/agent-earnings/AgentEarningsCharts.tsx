'use client';

import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { AGENT_CHARTS_BY_VIEW, formatSamplePts } from './mockAgentEarningsData';
import { ChartViewMode } from './types';

interface AgentEarningsChartsProps {
  chartMode: ChartViewMode;
  onChartModeChange: (mode: ChartViewMode) => void;
}

const CHART_TABS: Array<{ id: ChartViewMode; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'comparison', label: 'Comparison' },
];

export const AgentEarningsCharts: React.FC<AgentEarningsChartsProps> = ({
  chartMode,
  onChartModeChange,
}) => {
  const points = AGENT_CHARTS_BY_VIEW[chartMode];

  const maxPts = useMemo(
    () =>
      Math.max(
        ...points.map((p) => p.completedPts + p.pendingPts),
        1
      ),
    [points]
  );

  const periodTotal = useMemo(
    () => points.reduce((acc, p) => acc + p.completedPts + p.pendingPts, 0),
    [points]
  );

  return (
    <section
      data-testid="agent-earnings-chart-section"
      className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 shadow-[0_14px_38px_rgba(9,3,22,0.5)] space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">
              Earnings Overview Chart
            </h2>
            <p className="text-[11px] text-purple-200/75">
              Sample points · {formatSamplePts(periodTotal)} pts across selected view (Demo data)
            </p>
          </div>
        </div>

        <div
          className="inline-flex flex-wrap rounded-full bg-[#120624] border border-purple-400/20 p-1 self-start sm:self-auto"
          role="tablist"
          aria-label="Earnings chart mode"
        >
          {CHART_TABS.map((t) => {
            const active = chartMode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChartModeChange(t.id)}
                data-testid={`chart-mode-${t.id}`}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                  active
                    ? 'bg-[#FF2E93] text-white shadow-[0_6px_18px_rgba(255,46,147,0.35)]'
                    : 'text-purple-200/75 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-emerald-200 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            Completed (Sample)
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-200 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            Pending (Sample)
          </span>
        </div>
        <span className="text-purple-300/70">Demo preview values only</span>
      </div>

      {/* Responsive SVG Stacked/Grouped Bar Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(points.length * 88, 360)} 185`}
          className="w-full min-w-[320px] h-44"
          role="img"
          aria-label="Agent earnings sample chart"
          data-testid={`agent-chart-svg-${chartMode}`}
        >
          <defs>
            <linearGradient id="earnCompletedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="earnPendingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {[32, 72, 112, 148].map((y) => (
            <line
              key={y}
              x1="12"
              x2={Math.max(points.length * 88, 360) - 12}
              y1={y}
              y2={y}
              stroke="rgba(192,132,252,0.12)"
              strokeDasharray="4 4"
            />
          ))}

          {points.map((pt, idx) => {
            const stepW = Math.max(points.length * 88, 360) / points.length;
            const centerX = idx * stepW + stepW / 2;
            const completedH = Math.max(
              10,
              Math.round((pt.completedPts / maxPts) * 104)
            );
            const pendingH = Math.max(
              6,
              Math.round((pt.pendingPts / maxPts) * 104)
            );

            return (
              <g key={pt.label}>
                <rect
                  x={centerX - 20}
                  y={148 - completedH}
                  width="18"
                  height={completedH}
                  rx="5"
                  fill="url(#earnCompletedGrad)"
                />
                <text
                  x={centerX - 11}
                  y={142 - completedH}
                  textAnchor="middle"
                  fill="#6EE7B7"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {pt.completedPts}
                </text>

                <rect
                  x={centerX + 3}
                  y={148 - pendingH}
                  width="18"
                  height={pendingH}
                  rx="5"
                  fill="url(#earnPendingGrad)"
                />
                <text
                  x={centerX + 12}
                  y={142 - pendingH}
                  textAnchor="middle"
                  fill="#FDE68A"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {pt.pendingPts}
                </text>

                <text
                  x={centerX}
                  y="168"
                  textAnchor="middle"
                  fill="#DDD6FE"
                  fontSize="11"
                  fontWeight="600"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
};
