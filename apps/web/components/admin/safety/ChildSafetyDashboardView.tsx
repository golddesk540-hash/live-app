'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileSearch,
  Filter,
  Flame,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Slash,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import {
  SafetyAlertRecord,
  SafetyCaseRecord,
  SafetyMetrics,
  SafetyNavTab,
} from './childSafetyTypes';

interface ChildSafetyDashboardViewProps {
  metrics: SafetyMetrics;
  recentCases: SafetyCaseRecord[];
  activeAlerts: SafetyAlertRecord[];
  onTabChange: (tab: SafetyNavTab) => void;
  onSelectCase: (safetyCase: SafetyCaseRecord) => void;
  onOpenReviewModal: (safetyCase: SafetyCaseRecord) => void;
  onRefresh: () => void;
}

export const ChildSafetyDashboardView: React.FC<ChildSafetyDashboardViewProps> = ({
  metrics,
  recentCases,
  activeAlerts,
  onTabChange,
  onSelectCase,
  onOpenReviewModal,
  onRefresh,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#FF0F7B]" />
            <span className="text-xs font-bold tracking-wider uppercase text-pink-400">
              Trust & Safety Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Child Safety Operations
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Module 10.5
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Proactive child safety monitoring, age verification review, minor protection telemetry, and emergency escalation workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-pink-500/40 transition-all active:scale-95"
            title="Refresh Safety Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onTabChange('cases')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all active:scale-95"
          >
            <span>Case Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Visual Reference 10_05 Hero Center Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1E0D3D] via-[#160A2D] to-[#0E061E] border border-pink-500/30 p-8 sm:p-10 text-center shadow-[0_0_50px_rgba(255,15,123,0.15)]">
        {/* Ambient neon radial glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-pink-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
          {/* Glowing Shield Icon from 10_05 */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500/20 to-purple-600/30 border border-pink-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(255,15,123,0.4)] mb-4 group hover:scale-105 transition-transform duration-300">
            <Shield className="w-10 h-10 text-pink-400 drop-shadow-[0_0_12px_#FF0F7B]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
            Child Safety Center
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 mt-2 font-medium leading-relaxed">
            Protect young users and ensure a safe community
          </p>
        </div>
      </div>

      {/* 3. Visual Reference 10_05: 4 Big Operational Hub Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tile 1: Age Verification */}
        <div
          onClick={() => onTabChange('age_queue')}
          className="cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-white/10 hover:border-pink-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(255,15,123,0.25)] flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,15,123,0.25)]">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
            Age Verification
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">
            {metrics.ageReviewsPending} pending reviews
          </p>
        </div>

        {/* Tile 2: Underage Review */}
        <div
          onClick={() => onTabChange('cases')}
          className="cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-purple-500/20 hover:border-purple-500/60 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
            Underage Review
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">
            {metrics.underReviewCases} cases in audit
          </p>
        </div>

        {/* Tile 3: Safety Reports */}
        <div
          onClick={() => onTabChange('alerts')}
          className="cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-amber-500/20 hover:border-amber-500/60 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
            Safety Reports
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">
            {metrics.activeAlerts} active alerts
          </p>
        </div>

        {/* Tile 4: Restricted Accounts */}
        <div
          onClick={() => onTabChange('cases')}
          className="cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-rose-500/20 hover:border-rose-500/60 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(244,63,94,0.25)] flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <UserX className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
            Restricted Accounts
          </h3>
          <p className="text-[11px] text-gray-400 mt-1">
            {metrics.restrictedAccountsCount} accounts held
          </p>
        </div>
      </div>

      {/* 4. KPI Summary Metric Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Safety Cases */}
        <div
          onClick={() => onTabChange('cases')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-white/10 hover:border-pink-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">Total Safety Cases</span>
            <Shield className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.totalCases}</div>
          <div className="text-[11px] text-pink-400 mt-1">All recorded files</div>
        </div>

        {/* Pending Cases */}
        <div
          onClick={() => onTabChange('cases')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-amber-500/20 hover:border-amber-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300">Pending Triage</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.pendingCases}</div>
          <div className="text-[11px] text-amber-400 mt-1">Awaiting review assignment</div>
        </div>

        {/* High Priority & Urgent */}
        <div
          onClick={() => onTabChange('high_priority')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-rose-500/20 hover:border-rose-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-300">High / Urgent</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.highPriorityCases}</div>
          <div className="text-[11px] text-rose-400 mt-1">{metrics.urgentCases} urgent incidents</div>
        </div>

        {/* Escalated Cases */}
        <div
          onClick={() => onTabChange('escalations')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-purple-500/20 hover:border-purple-500/50 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-300">Escalated</span>
            <ArrowUpRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.escalatedCases}</div>
          <div className="text-[11px] text-purple-400 mt-1">Senior lead oversight</div>
        </div>

        {/* Resolved Cases */}
        <div
          onClick={() => onTabChange('cases')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-emerald-500/20 hover:border-emerald-500/50 transition-all group col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{metrics.resolvedCases}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Clearance certified</div>
        </div>
      </div>

      {/* 5. Active Safety Alerts Grid & Quick Triage */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]" />
              Active Incident Alerts
            </h2>
            <p className="text-xs text-gray-400">
              Heuristic flags requiring immediate safety review attention
            </p>
          </div>
          <button
            onClick={() => onTabChange('alerts')}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            View All 20 Alerts →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeAlerts.slice(0, 6).map((alert) => {
            const isUrgent = alert.priority === 'Urgent';
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border transition-all duration-300 flex flex-col justify-between ${
                  isUrgent
                    ? 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'border-white/10 hover:border-pink-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-white">
                      Alert {alert.id}
                    </span>
                    <span className="text-[10px] text-gray-400">{alert.createdRelative}</span>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-pink-400 truncate">
                      {alert.categoryLabel}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {alert.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-300 leading-snug line-clamp-2 mb-3">
                    {alert.shortDescription}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">
                    Target: <strong className="text-white">{alert.relatedUsername}</strong>
                  </span>
                  <button
                    onClick={() => onTabChange('cases')}
                    className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 font-semibold transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Recent Safety Cases Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-pink-400" />
              Safety Case Backlog
            </h2>
            <p className="text-xs text-gray-400">
              Recent safety investigations, verification reviews, and resolution states
            </p>
          </div>
          <button
            onClick={() => onTabChange('cases')}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            Full Case Table →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recentCases.slice(0, 6).map((c) => {
            return (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-white/10 hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs font-bold text-white">
                      Case {c.id}
                    </span>
                    <span className="text-[10px] text-gray-400">{c.createdRelative}</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={c.relatedUserAvatar}
                      alt={c.relatedUsername}
                      className="w-11 h-11 rounded-xl object-cover border border-white/15 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">
                          {c.relatedUsername}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : c.status === 'Escalated'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-pink-400 mt-0.5 truncate">
                        {c.category}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {c.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">
                    Lead: <strong className="text-gray-300">{c.assignedReviewer}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectCase(c)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onOpenReviewModal(c)}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
