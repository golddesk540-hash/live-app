import React from 'react';
import {
  Users,
  UserCheck,
  Radio,
  Coins,
  ShieldAlert,
  Shield,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ExecutiveMetrics } from './dashboardTypes';

interface ExecutiveHeroCardsProps {
  metrics: ExecutiveMetrics;
  onNavigateSection: (section: string) => void;
}

export const ExecutiveHeroCards: React.FC<ExecutiveHeroCardsProps> = ({
  metrics,
  onNavigateSection,
}) => {
  return (
    <div className="space-y-4" data-testid="executive-hero-cards">
      {/* 4 Hero Cards matching 10_09_dashboard.png exactly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users (Blue Accent) */}
        <div
          onClick={() => onNavigateSection('users')}
          className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#130728] border border-purple-500/30 hover:border-blue-500/60 shadow-xl shadow-purple-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          data-testid="hero-card-users"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Total Users</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(59,130,246,0.3)]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {metrics.totalUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-300">
              <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                +{((metrics.newRegistrations / metrics.totalUsers) * 100).toFixed(1)}%
              </span>
              <span>•</span>
              <span>{metrics.newRegistrations.toLocaleString()} today</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-300 transition-colors">
            <span>Inspect directory</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Active Hosts (Purple Accent) */}
        <div
          onClick={() => onNavigateSection('hosts')}
          className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#130728] border border-purple-500/30 hover:border-purple-500/60 shadow-xl shadow-purple-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          data-testid="hero-card-hosts"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Active Hosts</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {metrics.activeHosts.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live earning now</span>
              <span>•</span>
              <span className="text-slate-400">{metrics.totalHosts.toLocaleString()} approved</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-purple-300 transition-colors">
            <span>Manage hosts</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Live Sessions (Pink / Red Accent) */}
        <div
          onClick={() => onNavigateSection('live_monitor')}
          className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#130728] border border-purple-500/30 hover:border-pink-500/60 shadow-xl shadow-purple-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          data-testid="hero-card-live"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Live Sessions</span>
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(236,72,153,0.3)]">
              <Radio className="w-5 h-5 text-pink-400" />
            </div>
          </div>

          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {metrics.liveSessions.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-pink-300">
              <span className="font-bold text-pink-400">{metrics.currentLiveViewers.toLocaleString()}</span>
              <span>viewers online</span>
              <span>•</span>
              <span className="text-slate-400">Peak {metrics.peakViewersToday.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-pink-300 transition-colors">
            <span>Open Live Monitor</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Total Coins (Gold Accent) */}
        <div
          onClick={() => onNavigateSection('economy')}
          className="group relative p-5 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#130728] border border-purple-500/30 hover:border-amber-500/60 shadow-xl shadow-purple-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          data-testid="hero-card-coins"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Total Coins</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-amber-300 tracking-tight flex items-baseline gap-1">
              <span>{metrics.totalCoins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-300/90">
              <span>Circulation Demo</span>
              <span>•</span>
              <span className="text-emerald-400">+12.4% MoM</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-amber-300 transition-colors">
            <span>Economy metrics</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Secondary Metric Cards Row (Cross-module overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Pending Reports */}
        <div
          onClick={() => onNavigateSection('reports')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-purple-500/20 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 block">Pending Reports</span>
            <div className="text-lg font-bold text-amber-400 mt-0.5">
              {metrics.pendingReports} cases
            </div>
            <span className="text-[10px] text-slate-500">{metrics.totalReports} total tracked</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Open Safety Cases */}
        <div
          onClick={() => onNavigateSection('safety')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-purple-500/20 hover:border-rose-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 block">Safety Cases</span>
            <div className="text-lg font-bold text-rose-400 mt-0.5">
              {metrics.openSafetyCases} open
            </div>
            <span className="text-[10px] text-rose-400/80">
              {metrics.highPrioritySafety} critical alerts
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        {/* Active Agencies */}
        <div
          onClick={() => onNavigateSection('agency')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-purple-500/20 hover:border-pink-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 block">Agencies & Sellers</span>
            <div className="text-lg font-bold text-pink-400 mt-0.5">
              {metrics.activeAgencies} / {metrics.activeSellers}
            </div>
            <span className="text-[10px] text-slate-500">Agencies / Sellers active</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Payouts */}
        <div
          onClick={() => onNavigateSection('agency')}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-purple-500/20 hover:border-emerald-500/50 cursor-pointer transition-all flex items-center justify-between group"
        >
          <div>
            <span className="text-[11px] text-slate-400 block">Pending Payouts</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              ${metrics.pendingPayoutAmount.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">
              {metrics.pendingPayouts} claims awaiting review
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
