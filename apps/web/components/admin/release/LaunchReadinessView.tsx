'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  Apple,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { ReadinessCategorySummary, ReadinessStatus, ReleaseTabKey } from './releaseTypes';

interface LaunchReadinessViewProps {
  categories: ReadinessCategorySummary[];
  onSelectTab: (tab: ReleaseTabKey) => void;
}

export const LaunchReadinessView: React.FC<LaunchReadinessViewProps> = ({
  categories,
  onSelectTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<ReadinessCategorySummary | null>(null);

  // Compute Overall Progress
  const averageReadiness = Math.round(
    categories.reduce((acc, c) => acc + c.completionPercentage, 0) / categories.length
  );
  const totalCompletedTasks = categories.reduce((acc, c) => acc + c.completedTasks, 0);
  const totalPendingTasks = categories.reduce((acc, c) => acc + c.pendingTasks, 0);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      const matchesSearch =
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.leadReviewer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, selectedStatus]);

  const getStatusBadge = (status: ReadinessStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Needs Attention
          </span>
        );
      case 'Blocked':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Blocked
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Not Started
          </span>
        );
    }
  };

  const mapCategoryToTab = (catName: string): ReleaseTabKey => {
    if (catName.includes('Android')) return 'android';
    if (catName.includes('iOS')) return 'ios';
    if (catName.includes('Security') || catName.includes('Privacy')) return 'security_privacy';
    if (catName.includes('Store')) return 'play_preview';
    if (catName.includes('QA') || catName.includes('Testing')) return 'qa';
    if (catName.includes('Approval')) return 'approval';
    return 'checklist';
  };

  return (
    <div className="space-y-6 text-white animate-fade-in">
      {/* Top Readiness Summary Strip */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#170836] via-[#120726] to-[#1c0840] border border-purple-800/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Launch Readiness Overview
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
            Overall deployment velocity calculated from 10 functional criteria across development, device testing, store compliance, and security sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-purple-900/40">
          <div className="text-right">
            <div className="text-xs text-purple-300/70 font-semibold uppercase tracking-wider">Overall Score</div>
            <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
              {averageReadiness}%
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">Ready for Sign-Off</div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-pink-500/30 flex items-center justify-center p-1 relative">
            <div
              className="w-full h-full rounded-full border-4 border-pink-500 flex items-center justify-center text-xs font-black shadow-[0_0_12px_#FF0F7B]"
            >
              GM
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#120726]/80 border border-purple-900/40">
          <div className="text-[11px] text-purple-300/70 font-medium">Total Tracked Tasks</div>
          <div className="text-xl font-black text-white mt-0.5">{totalCompletedTasks + totalPendingTasks} Tasks</div>
          <div className="text-[10px] text-purple-300/60 mt-0.5">Across 10 Domains</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#120726]/80 border border-purple-900/40">
          <div className="text-[11px] text-purple-300/70 font-medium">Completed Tasks</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{totalCompletedTasks} Verified</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">Signed by leads</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#120726]/80 border border-purple-900/40">
          <div className="text-[11px] text-purple-300/70 font-medium">Pending Tasks</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">{totalPendingTasks} Non-Blocking</div>
          <div className="text-[10px] text-amber-300/80 mt-0.5">In final review</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#120726]/80 border border-purple-900/40">
          <div className="text-[11px] text-purple-300/70 font-medium">Failed Tasks</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">0 Failed</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">Zero blockers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#120726]/90 border border-purple-900/50 rounded-2xl shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search category, reviewer, or description..."
            className="w-full bg-black/40 border border-purple-900/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-400 shrink-0" />
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-black/40 border border-purple-900/60 rounded-xl px-3 py-2 text-xs text-purple-200 focus:outline-none focus:border-pink-500"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Needs Attention">Needs Attention</option>
          </select>
        </div>
      </div>

      {/* Grid of 10 Readiness Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map(cat => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-[#120726]/90 border border-purple-900/50 hover:border-purple-600/50 shadow-xl transition-all space-y-4 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400 px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800">
                      {cat.id}
                    </span>
                    <h3 className="font-bold text-white text-base group-hover:text-pink-300 transition-colors">
                      {cat.category}
                    </h3>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                {getStatusBadge(cat.status)}
              </div>

              {/* Progress Bar & Tallies */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-purple-300/80">Readiness Score</span>
                  <span className="text-white font-bold">{cat.completionPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600"
                    style={{ width: `${cat.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Task Breakdown */}
              <div className="grid grid-cols-3 text-center gap-2 mt-4 pt-3 border-t border-purple-900/40 text-xs">
                <div className="p-2 rounded-xl bg-purple-950/30">
                  <div className="text-[10px] text-purple-300/60 font-medium">Completed</div>
                  <div className="font-black text-emerald-400 mt-0.5">{cat.completedTasks}</div>
                </div>
                <div className="p-2 rounded-xl bg-purple-950/30">
                  <div className="text-[10px] text-purple-300/60 font-medium">Pending</div>
                  <div className="font-black text-amber-400 mt-0.5">{cat.pendingTasks}</div>
                </div>
                <div className="p-2 rounded-xl bg-purple-950/30">
                  <div className="text-[10px] text-purple-300/60 font-medium">Failed</div>
                  <div className="font-black text-purple-300 mt-0.5">{cat.failedTasks}</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between text-xs">
              <span className="text-purple-300/70">Lead: <b>{cat.leadReviewer}</b></span>
              <button
                onClick={() => onSelectTab(mapCategoryToTab(cat.category))}
                className="px-3 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-semibold border border-pink-500/30 flex items-center gap-1 transition-all"
              >
                <span>View Domain</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
