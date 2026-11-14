'use client';

import React, { useState } from 'react';
import {
  Users,
  Radio,
  ShieldAlert,
  AlertTriangle,
  Coins,
  Building2,
  Store,
  DollarSign,
  Newspaper,
  Globe,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Award,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  BarChart2,
  PieChart
} from 'lucide-react';
import { ExecutiveMetrics } from './dashboardTypes';

interface DetailedAnalyticsSectionsProps {
  metrics: ExecutiveMetrics;
  onNavigateSection: (sectionKey: string) => void;
}

export const DetailedAnalyticsSections: React.FC<DetailedAnalyticsSectionsProps> = ({
  metrics,
  onNavigateSection
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'moderation' | 'economy' | 'broadcast'>('all');

  return (
    <div className="space-y-6">
      {/* Section Header with Category Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#11052C]/70 backdrop-blur-md p-4 rounded-2xl border border-purple-900/40 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">Domain Analytics & Operational Hubs</h2>
          </div>
          <p className="text-xs text-purple-300/70 mt-0.5">
            Comprehensive platform intelligence across user engagement, safety, monetization, and operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-purple-900/40">
          {[
            { id: 'all', label: 'All Domains' },
            { id: 'users', label: 'Users & Hosts' },
            { id: 'moderation', label: 'Safety & Reports' },
            { id: 'economy', label: 'Economy & Payouts' },
            { id: 'broadcast', label: 'Content & Push' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'text-purple-300/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Domain Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL 1: USER & HOST ANALYTICS (Modules 10.1 & 10.2) */}
        {(activeTab === 'all' || activeTab === 'users') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">User & Host Ecosystem</h3>
                    <p className="text-xs text-purple-300/60">Module 10.2 &bull; User Directory & Tier Health</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('users')}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/30 flex items-center gap-1 transition-all"
                >
                  Manage Users <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Active Users</div>
                  <div className="text-lg font-black text-white mt-1">{metrics.activeUsers.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
                    <TrendingUp className="w-3 h-3" /> +12.4%
                  </div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">New Today</div>
                  <div className="text-lg font-black text-blue-400 mt-1">+{metrics.newRegistrations.toLocaleString()}</div>
                  <div className="text-[10px] text-purple-300/60 mt-0.5">Verified on-board</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Active Hosts</div>
                  <div className="text-lg font-black text-pink-400 mt-1">{metrics.activeHosts.toLocaleString()}</div>
                  <div className="text-[10px] text-pink-300/70 mt-0.5">{metrics.pendingHosts} Pending KYC</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Suspended</div>
                  <div className="text-lg font-black text-rose-400 mt-1">{metrics.suspendedUsers.toLocaleString()}</div>
                  <div className="text-[10px] text-rose-300/60 mt-0.5">Policy enforcement</div>
                </div>
              </div>

              {/* Host Tier Distribution Progress */}
              <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-200">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Host Tier Distribution
                  </span>
                  <span className="text-[11px] text-purple-300/60">Total: {metrics.totalHosts.toLocaleString()}</span>
                </div>
                <div className="h-2.5 w-full bg-purple-950 rounded-full overflow-hidden flex">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full" style={{ width: '15%' }} title="Tier S (15%)" />
                  <div className="bg-gradient-to-r from-purple-400 to-purple-500 h-full" style={{ width: '35%' }} title="Tier A (35%)" />
                  <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-full" style={{ width: '30%' }} title="Tier B (30%)" />
                  <div className="bg-gradient-to-r from-gray-500 to-gray-600 h-full" style={{ width: '20%' }} title="Tier C (20%)" />
                </div>
                <div className="grid grid-cols-4 text-center text-[10px] text-purple-300/70 pt-1">
                  <div><span className="text-amber-400 font-bold">Tier S</span>: 15%</div>
                  <div><span className="text-purple-400 font-bold">Tier A</span>: 35%</div>
                  <div><span className="text-blue-400 font-bold">Tier B</span>: 30%</div>
                  <div><span className="text-gray-400 font-bold">Tier C</span>: 20%</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>Top Country: <b>United States (42%)</b></span>
              <span>Account Retention: <b>88.6%</b></span>
            </div>
          </div>
        )}

        {/* PANEL 2: LIVE STREAMING METRICS (Module 10.3) */}
        {(activeTab === 'all' || activeTab === 'users' || activeTab === 'broadcast') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Live Streaming Performance</h3>
                    <p className="text-xs text-purple-300/60">Module 10.3 &bull; Broadcast Health & Peak Concurrency</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('live_monitor')}
                  className="px-2.5 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-medium border border-pink-500/30 flex items-center gap-1 transition-all"
                >
                  Live Monitor <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Current Live</div>
                  <div className="text-lg font-black text-pink-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping inline-block" />
                    {metrics.liveSessions.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-pink-300/70 mt-0.5">Active channels</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Peak Viewers</div>
                  <div className="text-lg font-black text-amber-400 mt-1">{metrics.peakViewersToday.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">Highest today</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Live Viewers</div>
                  <div className="text-lg font-black text-white mt-1">{metrics.currentLiveViewers.toLocaleString()}</div>
                  <div className="text-[10px] text-purple-300/60 mt-0.5">Concurrently tuned in</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Completed</div>
                  <div className="text-lg font-black text-purple-300 mt-1">{(metrics.liveSessions + 2420).toLocaleString()}</div>
                  <div className="text-[10px] text-purple-300/60 mt-0.5">Past 24 hours</div>
                </div>
              </div>

              {/* Category Share Distribution */}
              <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-200">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-pink-400" /> Category Breakdown
                  </span>
                  <span className="text-[11px] text-purple-300/60">Top: Music & Gaming</span>
                </div>
                <div className="h-2.5 w-full bg-purple-950 rounded-full overflow-hidden flex">
                  <div className="bg-pink-500 h-full" style={{ width: '40%' }} title="Music & Dance (40%)" />
                  <div className="bg-purple-500 h-full" style={{ width: '30%' }} title="Gaming & PK (30%)" />
                  <div className="bg-cyan-500 h-full" style={{ width: '18%' }} title="Just Chatting (18%)" />
                  <div className="bg-amber-500 h-full" style={{ width: '12%' }} title="Creative & Talent (12%)" />
                </div>
                <div className="grid grid-cols-4 text-center text-[10px] text-purple-300/70 pt-1">
                  <div><span className="text-pink-400 font-bold">Music</span>: 40%</div>
                  <div><span className="text-purple-400 font-bold">Gaming</span>: 30%</div>
                  <div><span className="text-cyan-400 font-bold">Chatting</span>: 18%</div>
                  <div><span className="text-amber-400 font-bold">Talent</span>: 12%</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>Bitrate Quality: <b>1080p60 Ultra</b></span>
              <span>CDN Health: <b className="text-emerald-400">99.98%</b></span>
            </div>
          </div>
        )}

        {/* PANEL 3: REPORT & TRUST QUEUE (Module 10.4) */}
        {(activeTab === 'all' || activeTab === 'moderation') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Community Trust & Reports</h3>
                    <p className="text-xs text-purple-300/60">Module 10.4 &bull; Flagged Content Moderation</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('reports')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30 flex items-center gap-1 transition-all"
                >
                  View Reports <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Total Reports</div>
                  <div className="text-lg font-black text-white mt-1">{metrics.totalReports}</div>
                  <div className="text-[10px] text-purple-300/60 mt-0.5">Recorded</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Pending</div>
                  <div className="text-lg font-black text-amber-400 mt-1">{metrics.pendingReports}</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">Awaiting triage</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">In Review</div>
                  <div className="text-lg font-black text-cyan-400 mt-1">14</div>
                  <div className="text-[10px] text-cyan-300/70 mt-0.5">Staff assigned</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Resolved</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">10</div>
                  <div className="text-[10px] text-emerald-300/70 mt-0.5">Actions logged</div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-200">
                  <span>Resolution SLA</span>
                  <span className="text-emerald-400 font-bold">14.2 min avg</span>
                </div>
                <div className="flex items-center justify-between text-xs text-purple-300/80">
                  <span>Triage backlog is within normal operational thresholds.</span>
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                    {metrics.pendingReports} Active Queue
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>Primary Reason: <b>Spam & Impersonation</b></span>
              <span>Rejection Rate: <b>2 Dismissed</b></span>
            </div>
          </div>
        )}

        {/* PANEL 4: CHILD SAFETY OPERATIONS (Module 10.5) */}
        {(activeTab === 'all' || activeTab === 'moderation') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Child Safety Operations</h3>
                    <p className="text-xs text-purple-300/60">Module 10.5 &bull; Priority Protection & COPPA Guard</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('safety')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/30 flex items-center gap-1 transition-all"
                >
                  Safety Center <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Safety Cases</div>
                  <div className="text-lg font-black text-white mt-1">{metrics.openSafetyCases}</div>
                  <div className="text-[10px] text-purple-300/60 mt-0.5">Active cases</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">High Priority</div>
                  <div className="text-lg font-black text-rose-400 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                    {metrics.highPrioritySafety}
                  </div>
                  <div className="text-[10px] text-rose-300/70 mt-0.5">Immediate attention</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Escalated</div>
                  <div className="text-lg font-black text-amber-400 mt-1">3</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">Specialist review</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Age Alerts</div>
                  <div className="text-lg font-black text-cyan-400 mt-1">7</div>
                  <div className="text-[10px] text-cyan-300/70 mt-0.5">KYC flag match</div>
                </div>
              </div>

              {/* Status Alert */}
              <div className="bg-rose-950/30 rounded-xl p-3 border border-rose-900/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Strict zero-tolerance policy enforced. All flags are routed to Level 3 analysts.</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                  PRIORITY
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>SLA Response: <b>&lt; 5 minutes</b></span>
              <span>Resolved Safe: <b>12 cases</b></span>
            </div>
          </div>
        )}

        {/* PANEL 5: ECONOMY & MONETIZATION (Module 10.6) */}
        {(activeTab === 'all' || activeTab === 'economy') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Economy & Coin Circulation</h3>
                    <p className="text-xs text-purple-300/60">Module 10.6 &bull; Virtual Currency & Gift Velocity</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('economy')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30 flex items-center gap-1 transition-all"
                >
                  Economy Admin <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">In Circulation</div>
                  <div className="text-lg font-black text-amber-300 mt-1">{metrics.totalCoins.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">Demo Virtual Coins</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Purchased Today</div>
                  <div className="text-lg font-black text-white mt-1">+{metrics.coinPurchaseVolume.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">+18.2% vs yesterday</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Gifts Spent</div>
                  <div className="text-lg font-black text-pink-400 mt-1">{metrics.giftTransferVolume.toLocaleString()}</div>
                  <div className="text-[10px] text-pink-300/70 mt-0.5">Host tipped</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Catalog Items</div>
                  <div className="text-lg font-black text-cyan-400 mt-1">{metrics.totalContentItems} Active</div>
                  <div className="text-[10px] text-cyan-300/70 mt-0.5">In store catalog</div>
                </div>
              </div>

              {/* Package Velocity */}
              <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-900/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-purple-300 font-medium">Top Tier Package:</span>
                  <span className="text-amber-400 font-bold ml-1.5">5,000 Coins (\$49.99)</span>
                </div>
                <span className="text-emerald-400 font-bold">48% of total revenue</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>Catalog Gifts: <b>{metrics.totalContentItems} Available</b></span>
              <span>Burn Rate: <b>Healthy (78%)</b></span>
            </div>
          </div>
        )}

        {/* PANEL 6: AGENCY, SELLER & PAYOUTS (Module 10.7) */}
        {(activeTab === 'all' || activeTab === 'economy') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Agencies, Sellers & Payouts</h3>
                    <p className="text-xs text-purple-300/60">Module 10.7 &bull; Commercial Partners & Settlement</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('agency')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/30 flex items-center gap-1 transition-all"
                >
                  Manage Payouts <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Agencies</div>
                  <div className="text-lg font-black text-white mt-1">{metrics.activeAgencies}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Active partners</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Sellers</div>
                  <div className="text-lg font-black text-cyan-400 mt-1">{metrics.activeSellers}</div>
                  <div className="text-[10px] text-cyan-300/70 mt-0.5">Active stores</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Payout Claims</div>
                  <div className="text-lg font-black text-amber-400 mt-1">{metrics.pendingPayouts}</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">In current cycle</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Pending Payouts</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">\${metrics.pendingPayoutAmount.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-300/70 mt-0.5">Demo pending</div>
                </div>
              </div>

              {/* Settlement Progress */}
              <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-900/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-purple-300 font-medium">Next Payout Batch:</span>
                  <span className="text-emerald-400 font-bold ml-1.5">Friday, 18:00 UTC</span>
                </div>
                <span className="text-purple-300/70 font-medium">Automated wire transfer ready</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>Host Associated: <b>3,420 Hosts</b></span>
              <span>Dispute Rate: <b>&lt; 0.05%</b></span>
            </div>
          </div>
        )}

        {/* PANEL 7: NEWS & LOCALIZATION (Module 10.8) */}
        {(activeTab === 'all' || activeTab === 'broadcast') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">News & Global Languages</h3>
                    <p className="text-xs text-purple-300/60">Module 10.8 &bull; Content Publishing & Localization</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('news')}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30 flex items-center gap-1 transition-all"
                >
                  Manage Content <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Published</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">{metrics.publishedNews}</div>
                  <div className="text-[10px] text-emerald-300/70 mt-0.5">Live announcements</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Drafts</div>
                  <div className="text-lg font-black text-amber-400 mt-1">4</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">Pending approval</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Languages</div>
                  <div className="text-lg font-black text-cyan-400 mt-1">{metrics.totalSupportedLanguages}</div>
                  <div className="text-[10px] text-cyan-300/70 mt-0.5">Supported locales</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Translations</div>
                  <div className="text-lg font-black text-pink-400 mt-1">{metrics.translationPercentage}%</div>
                  <div className="text-[10px] text-pink-300/70 mt-0.5">i18n coverage</div>
                </div>
              </div>

              {/* Language Completion Progress */}
              <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-900/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-200">
                  <span>Language Coverage</span>
                  <span className="text-cyan-400 font-bold">{metrics.translationPercentage}% Complete</span>
                </div>
                <div className="h-2 w-full bg-purple-950 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full"
                    style={{ width: `${metrics.translationPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>Primary Locale: <b>en-US (Default)</b></span>
              <span>Next Sync: <b>Arabic & Urdu RTL</b></span>
            </div>
          </div>
        )}

        {/* PANEL 8: PUSH NOTIFICATIONS & CAMPAIGNS (Module 10.8) */}
        {(activeTab === 'all' || activeTab === 'broadcast') && (
          <div className="bg-[#120726]/90 border border-purple-900/50 rounded-2xl p-5 shadow-xl hover:border-purple-600/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Push Broadcast Campaigns</h3>
                    <p className="text-xs text-purple-300/60">Module 10.8 &bull; Push Delivery & Reach Analytics</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateSection('news')}
                  className="px-2.5 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-medium border border-pink-500/30 flex items-center gap-1 transition-all"
                >
                  Campaigns <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Campaigns</div>
                  <div className="text-lg font-black text-white mt-1">{metrics.totalPushCampaigns}</div>
                  <div className="text-[10px] text-purple-300/60 mt-0.5">Total created</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Scheduled</div>
                  <div className="text-lg font-black text-amber-400 mt-1">{metrics.scheduledPushCampaigns}</div>
                  <div className="text-[10px] text-amber-300/70 mt-0.5">In dispatch queue</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Sent Demo</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">12</div>
                  <div className="text-[10px] text-emerald-300/70 mt-0.5">Dispatched</div>
                </div>
                <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/30">
                  <div className="text-[11px] text-purple-300/70 font-medium">Total Reach</div>
                  <div className="text-lg font-black text-pink-400 mt-1">1.4M</div>
                  <div className="text-[10px] text-pink-300/70 mt-0.5">Targeted devices</div>
                </div>
              </div>

              {/* Engagement Status */}
              <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-900/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-purple-300 font-medium">Avg CTR:</span>
                  <span className="text-pink-400 font-bold ml-1.5">14.8% Click-Through</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Engagement
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs text-purple-300/60">
              <span>Next Drop: <b>Weekend Gala (2h left)</b></span>
              <span>Delivery Rate: <b>99.4%</b></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
