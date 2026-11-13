'use client';

import React, { useId, useMemo, useState } from 'react';
import { Activity, Calendar, Radio, TrendingUp, Users } from 'lucide-react';
import { PLATFORM_OVERVIEW_SERIES } from './mockAdminData';

type MetricKey = 'users' | 'live' | 'reports';
type TimeframeKey = '24h' | '7d' | '30d';

export const PlatformOverviewChart: React.FC = () => {
  const [metric, setMetric] = useState<MetricKey>('users');
  const [timeframe, setTimeframe] = useState<TimeframeKey>('7d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = useMemo(() => {
    return PLATFORM_OVERVIEW_SERIES[timeframe][metric];
  }, [timeframe, metric]);

  const maxVal = useMemo(() => {
    return Math.max(...series.map((d) => d.value), 1);
  }, [series]);

  const minVal = useMemo(() => {
    return Math.min(...series.map((d) => d.value), 0);
  }, [series]);

  const gradientId = useId();

  // SVG dimensions
  const width = 640;
  const height = 200;
  const paddingX = 40;
  const paddingY = 24;

  const points = useMemo(() => {
    const usableW = width - paddingX * 2;
    const usableH = height - paddingY * 2;
    const range = maxVal - minVal || 1;

    return series.map((pt, i) => {
      const x = paddingX + (i / (series.length - 1)) * usableW;
      const normalized = (pt.value - minVal) / range;
      const y = height - paddingY - normalized * usableH;
      return { x, y, ...pt };
    });
  }, [series, maxVal, minVal]);

  // Build smooth cubic bezier path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const last = points[points.length - 1];
    const first = points[0];
    const bottom = height - paddingY;
    return `${linePath} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }, [linePath, points]);

  return (
    <div
      data-testid="platform-overview-chart"
      className="rounded-3xl bg-[#160A2D]/95 border border-purple-500/25 p-5 md:p-6 shadow-xl space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            Platform Overview
          </h2>
          <p className="text-xs text-purple-200/70 mt-0.5">
            Interactive system metrics and activity trajectory (Sample data)
          </p>
        </div>

        {/* Timeframe & Metric switches */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center rounded-2xl bg-[#0F051F] border border-purple-500/30 p-1 text-xs">
            {(
              [
                ['users', 'Users'],
                ['live', 'Today Live'],
                ['reports', 'Reports'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                data-testid={`chart-metric-${m}`}
                onClick={() => setMetric(m)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  metric === m
                    ? 'bg-gradient-to-r from-[#FF0F7B] to-[#7928CA] text-white shadow-md'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center rounded-2xl bg-[#0F051F] border border-purple-500/30 p-1 text-xs">
            {(
              [
                ['24h', '24h'],
                ['7d', '7d'],
                ['30d', '30d'],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                data-testid={`chart-timeframe-${t}`}
                onClick={() => setTimeframe(t)}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  timeframe === t
                    ? 'bg-pink-500/25 border border-pink-400 text-white'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Surface */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 md:h-56 select-none overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF0F7B" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#7928CA" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#7928CA" stopOpacity="0.0" />
            </linearGradient>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#FF0F7B" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + pct * (height - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area Gradient */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Glowing Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#FF0F7B"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#neon-glow)"
          />

          {/* Data Points */}
          {points.map((pt, i) => {
            const isHovered = hoverIndex === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#FF0F7B"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between px-6 pt-1 text-[11px] font-semibold text-purple-300/70">
          {points.map((pt, i) => (
            <span
              key={i}
              className={hoverIndex === i ? 'text-pink-300 font-bold' : ''}
            >
              {pt.label}
            </span>
          ))}
        </div>

        {/* Hover detail preview banner */}
        <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-xs">
          <span className="text-purple-300">
            Selected Point:{' '}
            <strong className="text-white">
              {hoverIndex !== null ? points[hoverIndex]?.label : series[series.length - 1].label}
            </strong>
          </span>
          <span className="font-extrabold text-pink-300 tabular-nums">
            {hoverIndex !== null
              ? points[hoverIndex]?.formattedValue
              : series[series.length - 1].formattedValue}{' '}
            {metric === 'users' ? 'Users' : metric === 'live' ? 'Live Streams' : 'Reports'}
          </span>
        </div>
      </div>
    </div>
  );
};
