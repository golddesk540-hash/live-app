'use client';

import React, { useMemo } from 'react';
import { Activity, BarChart3, Clock, Info, Radio, Users } from 'lucide-react';
import { AgencyEmptyState } from './AgencyEmptyState';
import { AGENCY_PERFORMANCE_BY_PERIOD } from './mockAgencyData';
import { PerformancePeriod } from './types';

interface AgencyPerformanceSectionProps {
  period: PerformancePeriod;
  onPeriodChange: (period: PerformancePeriod) => void;
  hasData: boolean;
  onRestoreData: () => void;
}

const PERIOD_TABS: Array<{ id: PerformancePeriod; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const AgencyPerformanceSection: React.FC<AgencyPerformanceSectionProps> = ({
  period,
  onPeriodChange,
  hasData,
  onRestoreData,
}) => {
  const dataset = AGENCY_PERFORMANCE_BY_PERIOD[period];

  const maxSessions = useMemo(
    () => Math.max(...dataset.chartPoints.map((pt) => pt.sessions), 1),
    [dataset]
  );
  const maxLiveHours = useMemo(
    () => Math.max(...dataset.chartPoints.map((pt) => pt.liveHours), 1),
    [dataset]
  );

  if (!hasData) {
    return (
      <div className="space-y-4" data-testid="agency-performance-section">
        <AgencyEmptyState kind="no_performance_data" onAction={onRestoreData} />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="agency-performance-section">
      {/* Period Selector & Summary Header */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Agency Performance</h2>
              <p className="text-[11px] text-purple-200/75">
                {dataset.periodLabel} · Host participation & activity preview
              </p>
            </div>
          </div>

          <div
            className="inline-flex rounded-full bg-[#120624] border border-purple-400/20 p-1 self-start sm:self-auto"
            role="tablist"
            aria-label="Performance period selector"
          >
            {PERIOD_TABS.map((tab) => {
              const active = period === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onPeriodChange(tab.id)}
                  data-testid={`perf-tab-${tab.id}`}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    active
                      ? 'bg-[#FF2E93] text-white shadow-[0_6px_18px_rgba(255,46,147,0.35)]'
                      : 'text-purple-200/75 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-purple-100/85 mt-3.5 leading-relaxed">
          {dataset.summaryText}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Radio className="w-3.5 h-3.5 text-[#FF6BA3]" />
              Total Activity
            </div>
            <div
              data-testid="perf-total-sessions"
              className="text-lg sm:text-xl font-black text-white mt-1"
            >
              {dataset.totalSessions} sessions
            </div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              Sample Live Hours
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-300 mt-1">
              {dataset.totalLiveHours.toFixed(1)} hrs
            </div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              Active Hosts
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-300 mt-1">
              {dataset.activeHostCount} hosts
            </div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Activity className="w-3.5 h-3.5 text-sky-300" />
              Participation
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              {dataset.participationRate}%
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF2E93] to-emerald-400"
                style={{ width: `${dataset.participationRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pure SVG Activity Chart + Live Hours Comparison */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-black text-white">
              Sample Sessions & Stream Hours Chart
            </h3>
            <p className="text-[11px] text-purple-200/70">
              Visual host activity overview for {dataset.periodLabel.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5 text-pink-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FF2E93]" />
              Sessions
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-200">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              Live Hours
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${dataset.chartPoints.length * 96} 180`}
            className="w-full min-w-[320px] h-44"
            role="img"
            aria-label={`${dataset.periodLabel} sample activity chart`}
          >
            <defs>
              <linearGradient id="barPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF2E93" />
                <stop offset="100%" stopColor="#9333EA" />
              </linearGradient>
              <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>

            {/* Horizontal subtle grid lines */}
            {[30, 70, 110, 145].map((y) => (
              <line
                key={y}
                x1="12"
                x2={dataset.chartPoints.length * 96 - 12}
                y1={y}
                y2={y}
                stroke="rgba(192,132,252,0.12)"
                strokeDasharray="4 4"
              />
            ))}

            {dataset.chartPoints.map((pt, idx) => {
              const groupX = idx * 96 + 22;
              const sessionH = Math.max(10, Math.round((pt.sessions / maxSessions) * 105));
              const hoursH = Math.max(10, Math.round((pt.liveHours / maxLiveHours) * 105));
              return (
                <g key={pt.label}>
                  <rect
                    x={groupX}
                    y={145 - sessionH}
                    width="20"
                    height={sessionH}
                    rx="6"
                    fill="url(#barPink)"
                  />
                  <text
                    x={groupX + 10}
                    y={139 - sessionH}
                    textAnchor="middle"
                    fill="#F9A8D4"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {pt.sessions}
                  </text>

                  <rect
                    x={groupX + 26}
                    y={145 - hoursH}
                    width="20"
                    height={hoursH}
                    rx="6"
                    fill="url(#barGold)"
                  />
                  <text
                    x={groupX + 36}
                    y={139 - hoursH}
                    textAnchor="middle"
                    fill="#FDE68A"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {pt.liveHours}
                  </text>

                  <text
                    x={groupX + 23}
                    y="166"
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
      </div>

      {/* Activity History List */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
        <h3 className="text-sm font-black text-white mb-3">Sample Activity History</h3>
        <div className="space-y-2.5">
          {dataset.activityHistory.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">{item.hostName}</span>
                  <span className="text-[11px] text-purple-300/70">{item.handle}</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/25 text-[10px] font-bold text-purple-200">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-purple-100/85 mt-1">{item.actionLabel}</p>
              </div>
              <span className="text-[11px] text-purple-300/70 whitespace-nowrap">
                {item.timestampLabel}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-[#120624]/70 border border-purple-400/15 px-3.5 py-2.5 flex items-start gap-2 text-[11px] text-purple-200/75">
          <Info className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
          <span>
            Performance metrics track sample sessions, live hours, and participation only — kept
            strictly separate from Agent Earnings (Module 9.8) and real financial calculations.
          </span>
        </div>
      </div>
    </div>
  );
};
