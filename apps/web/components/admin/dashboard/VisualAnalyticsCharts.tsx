import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Shield,
  Coins,
  Globe2,
  Bell,
  ArrowUpRight,
} from 'lucide-react';
import {
  USER_GROWTH_7D,
  USER_GROWTH_30D,
  USER_GROWTH_90D,
  HOST_GROWTH_CHART,
  LIVE_ACTIVITY_CHART,
  VIEWER_ACTIVITY_CHART,
  REPORT_STATUS_CHART,
  SAFETY_STATUS_CHART,
  ECONOMY_ACTIVITY_CHART,
  AGENCY_DISTRIBUTION_CHART,
  PAYOUT_STATUS_CHART,
  CONTENT_DISTRIBUTION_CHART,
  LANGUAGE_PROGRESS_CHART,
  NOTIFICATION_CAMPAIGN_CHART,
} from './mockDashboardData';
import { ChartDataPoint, DateRangeOption } from './dashboardTypes';

interface VisualAnalyticsChartsProps {
  dateRange?: DateRangeOption;
}

export const VisualAnalyticsCharts: React.FC<VisualAnalyticsChartsProps> = ({
  dateRange = '7d',
}) => {
  const [selectedChartGroup, setSelectedChartGroup] = useState<
    'growth' | 'streaming' | 'moderation' | 'economy' | 'localization'
  >('growth');

  // Select user growth dataset based on date range
  const userGrowthData =
    dateRange === '90d'
      ? USER_GROWTH_90D
      : dateRange === '30d'
      ? USER_GROWTH_30D
      : USER_GROWTH_7D;

  const maxUserVal = Math.max(...userGrowthData.map((d) => d.value), 1);
  const maxEconomyVal = Math.max(...ECONOMY_ACTIVITY_CHART.map((d) => d.value), 1);
  const maxLiveVal = Math.max(...LIVE_ACTIVITY_CHART.map((d) => d.value), 1);

  return (
    <div className="space-y-6" data-testid="visual-analytics-charts">
      {/* Chart Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-purple-500/20">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-400" />
            Platform Analytics & Trajectories
          </h2>
          <p className="text-xs text-slate-400">
            Real-time metric distributions, user influx, concurrent streams, and financial activity
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-purple-500/30 rounded-xl overflow-x-auto text-xs">
          {[
            { id: 'growth', label: 'Growth', icon: TrendingUp },
            { id: 'streaming', label: 'Live & Viewers', icon: Activity },
            { id: 'moderation', label: 'Safety & Reports', icon: Shield },
            { id: 'economy', label: 'Coins & Payouts', icon: Coins },
            { id: 'localization', label: 'Global & Push', icon: Globe2 },
          ].map((cg) => {
            const Icon = cg.icon;
            const isActive = selectedChartGroup === cg.id;
            return (
              <button
                key={cg.id}
                onClick={() => setSelectedChartGroup(cg.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Growth Charts: User Growth (Matching 10_09_dashboard.png) & Host Growth */}
      {selectedChartGroup === 'growth' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Main User Growth Bar Chart matching 10_09_dashboard.png visual reference */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>User Growth Trajectory</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    Active Scale
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Registered active members trajectory across {dateRange.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-white">1,245,320</div>
                <span className="text-[10px] text-emerald-400 font-semibold">+14.2k today</span>
              </div>
            </div>

            {/* Glowing Gradient Bar Chart matching 10_09_dashboard.png */}
            <div className="pt-6 pb-2">
              <div className="h-56 flex items-end justify-between gap-3 px-2 border-b border-purple-500/30">
                {userGrowthData.map((d, i) => {
                  const heightPercent = Math.max(Math.round((d.value / maxUserVal) * 100), 12);
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 border border-pink-500/40 text-[10px] text-white font-bold py-1 px-2 rounded-lg shadow-xl z-20 whitespace-nowrap">
                        {d.formattedValue || `${d.value}k`}
                      </div>

                      {/* Bar with gradient purple to pink & subtle glow */}
                      <div
                        className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-purple-700 via-pink-600 to-rose-500 group-hover:from-purple-600 group-hover:to-pink-400 transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.35)] relative overflow-hidden"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day Labels matching reference */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2 pt-2">
                {userGrowthData.map((d, i) => (
                  <span key={i} className="flex-1 text-center">
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Host Registration Trends Chart */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Host Registrations</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Tier S/A/B/C
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Approved talent host growth</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-purple-300">8,420</div>
                <span className="text-[10px] text-purple-400">Live approved</span>
              </div>
            </div>

            {/* Host Distribution list */}
            <div className="space-y-3 pt-2">
              {[
                { label: 'Tier S (Celebrity Hosts)', count: 420, percent: 92, color: 'bg-amber-400' },
                { label: 'Tier A (Agency Partners)', count: 1850, percent: 78, color: 'bg-purple-400' },
                { label: 'Tier B (Standard Hosts)', count: 4250, percent: 62, color: 'bg-pink-500' },
                { label: 'Tier C (Probationary)', count: 1900, percent: 35, color: 'bg-blue-400' },
              ].map((tier, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{tier.label}</span>
                    <span className="font-bold text-white">{tier.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${tier.color} transition-all duration-500`}
                      style={{ width: `${tier.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs text-slate-400">
              <span>Pending verification: <strong className="text-amber-400">380 hosts</strong></span>
              <span className="text-emerald-400 font-semibold">98.2% Approved</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Streaming Charts: Live Streams & Viewer Concurrency */}
      {selectedChartGroup === 'streaming' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Live Sessions Hourly Trend */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Concurrent Live Sessions</h3>
                <p className="text-xs text-slate-400">24-hour distribution of active rooms</p>
              </div>
              <span className="text-base font-bold text-pink-400">1,264 Now</span>
            </div>

            <div className="pt-4">
              <div className="h-44 flex items-end justify-between gap-2 border-b border-purple-500/30 pb-1">
                {LIVE_ACTIVITY_CHART.map((d, i) => {
                  const h = Math.max(Math.round((d.value / maxLiveVal) * 100), 10);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div className="text-[10px] text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                        {d.value}
                      </div>
                      <div
                        className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-indigo-600 to-pink-500 group-hover:from-indigo-500 group-hover:to-pink-400 transition-all shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] text-slate-400 mt-2">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Viewers Hourly Trend */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Live Viewers Online</h3>
                <p className="text-xs text-slate-400">Viewer audience distribution curve</p>
              </div>
              <span className="text-base font-bold text-blue-400">256,480 Online</span>
            </div>

            <div className="pt-4">
              <div className="h-44 flex items-end justify-between gap-2 border-b border-purple-500/30 pb-1">
                {VIEWER_ACTIVITY_CHART.map((d, i) => {
                  const h = Math.max(Math.round((d.value / 256480) * 100), 10);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div className="text-[10px] text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                        {Math.round(d.value / 1000)}k
                      </div>
                      <div
                        className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-blue-700 to-cyan-400 group-hover:from-blue-600 group-hover:to-cyan-300 transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] text-slate-400 mt-2">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Moderation & Safety Charts */}
      {selectedChartGroup === 'moderation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Reports Status Chart */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Moderation Reports Status</h3>
                <p className="text-xs text-slate-400">Total 56 reports recorded across live rooms</p>
              </div>
              <span className="text-sm font-bold text-amber-400">32 Pending</span>
            </div>

            <div className="space-y-3 pt-2">
              {REPORT_STATUS_CHART.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-bold text-white">{item.formattedValue}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        item.label === 'Pending'
                          ? 'bg-amber-500'
                          : item.label === 'Under Review'
                          ? 'bg-blue-500'
                          : item.label === 'Resolved'
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${(item.value / 56) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Child Safety Status Chart */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Child Safety Case Radar</h3>
                <p className="text-xs text-slate-400">Zero-tolerance compliance & age protection</p>
              </div>
              <span className="text-sm font-bold text-rose-400">4 Critical</span>
            </div>

            <div className="space-y-3 pt-2">
              {SAFETY_STATUS_CHART.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-bold text-white">{item.formattedValue}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        item.label.includes('Critical')
                          ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                          : item.label.includes('Pending')
                          ? 'bg-amber-500'
                          : item.label.includes('Flagged')
                          ? 'bg-purple-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(item.value / 44) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Economy & Payouts Charts */}
      {selectedChartGroup === 'economy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Economy Weekly Transaction Volume */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Coin Purchase vs Gift Spend</h3>
                <p className="text-xs text-slate-400">Weekly coin circulation velocity (in Millions)</p>
              </div>
              <span className="text-sm font-bold text-amber-300">98.5M Total</span>
            </div>

            <div className="pt-4">
              <div className="h-44 flex items-end justify-between gap-3 border-b border-purple-500/30 pb-1">
                {ECONOMY_ACTIVITY_CHART.map((d, i) => {
                  const hPrimary = Math.max(Math.round((d.value / maxEconomyVal) * 100), 10);
                  const hSecondary = Math.max(
                    Math.round(((d.secondaryValue || 0) / maxEconomyVal) * 100),
                    10
                  );
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                      <div className="w-full flex items-end justify-center gap-1">
                        <div
                          className="w-3 rounded-t-sm bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                          style={{ height: `${hPrimary}%` }}
                          title={`Purchased: ${d.value}k`}
                        />
                        <div
                          className="w-3 rounded-t-sm bg-pink-500"
                          style={{ height: `${hSecondary}%` }}
                          title={`Gifted: ${d.secondaryValue}k`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2">{d.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 pt-3 text-xs">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-3 h-3 rounded-sm bg-amber-400" /> Coin Purchases
                </span>
                <span className="flex items-center gap-1.5 text-pink-400">
                  <span className="w-3 h-3 rounded-sm bg-pink-500" /> Gifts Sent
                </span>
              </div>
            </div>
          </div>

          {/* Payout Status Chart */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Payout Requests Status</h3>
                <p className="text-xs text-slate-400">Disbursement queue ($48,250 pending review)</p>
              </div>
              <span className="text-sm font-bold text-emerald-400">$89.2k Settled</span>
            </div>

            <div className="space-y-3 pt-2">
              {PAYOUT_STATUS_CHART.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-bold text-white">{item.formattedValue}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        item.label === 'Completed Demo'
                          ? 'bg-emerald-500'
                          : item.label === 'Approved'
                          ? 'bg-blue-500'
                          : item.label === 'Under Review'
                          ? 'bg-purple-500'
                          : item.label === 'Pending'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${(item.value / 42) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Localization & Push Notifications Charts */}
      {selectedChartGroup === 'localization' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Language Localization Completion */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Global Languages Progress</h3>
                <p className="text-xs text-slate-400">8 Supported platform language packs (92% Average)</p>
              </div>
              <span className="text-sm font-bold text-cyan-400">8 Languages</span>
            </div>

            <div className="space-y-2.5 pt-2">
              {LANGUAGE_PROGRESS_CHART.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-bold text-white">{item.formattedValue}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        item.value >= 95
                          ? 'bg-emerald-400'
                          : item.value >= 90
                          ? 'bg-cyan-400'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Push Campaign Performance */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Push Campaign Performance</h3>
                <p className="text-xs text-slate-400">Open-rate percentage across top marketing blasts</p>
              </div>
              <span className="text-sm font-bold text-pink-400">1.4M Reach</span>
            </div>

            <div className="space-y-3 pt-2">
              {NOTIFICATION_CAMPAIGN_CHART.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-bold text-pink-300">{item.formattedValue}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${(item.value / 45) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
