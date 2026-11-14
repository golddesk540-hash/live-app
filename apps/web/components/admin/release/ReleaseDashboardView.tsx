'use client';

import React from 'react';
import {
  Rocket,
  Smartphone,
  Apple,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bug,
  ShieldCheck,
  ClipboardList,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Zap,
  Play,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Download
} from 'lucide-react';
import {
  AppVersionRecord,
  BuildRecord,
  ChecklistRecord,
  BugRecord,
  ReleaseActivityRecord,
  ReadinessCategorySummary,
  ReleaseTabKey
} from './releaseTypes';

interface ReleaseDashboardViewProps {
  currentVersion: AppVersionRecord;
  builds: BuildRecord[];
  checklist: ChecklistRecord[];
  bugs: BugRecord[];
  activities: ReleaseActivityRecord[];
  readinessCategories: ReadinessCategorySummary[];
  onSelectTab: (tab: ReleaseTabKey) => void;
  onOpenRehearsal: () => void;
  onExportReport: () => void;
}

export const ReleaseDashboardView: React.FC<ReleaseDashboardViewProps> = ({
  currentVersion,
  builds,
  checklist,
  bugs,
  activities,
  readinessCategories,
  onSelectTab,
  onOpenRehearsal,
  onExportReport
}) => {
  // Compute tallies from underlying records
  const completedChecklist = checklist.filter(c => c.status === 'Completed').length;
  const pendingChecklist = checklist.filter(c => c.status !== 'Completed').length;
  const criticalBugs = bugs.filter(b => b.priority === 'Critical' && b.status !== 'Closed').length;
  const openBugs = bugs.filter(b => b.status === 'Open' || b.status === 'In Progress').length;
  const totalBugs = bugs.length;

  const totalReadinessScore = Math.round(
    readinessCategories.reduce((acc, cat) => acc + cat.completionPercentage, 0) / readinessCategories.length
  );

  const latestBuild = builds[0];

  return (
    <div className="space-y-6 text-white animate-fade-in">
      {/* HERO BANNER & STATUS CARDS (MATCHING 10_10_store_release_and_launch_rehearsal.png) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Executive Platform Release Health */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Top Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#170836] via-[#120726] to-[#1c0840] border border-purple-800/50 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                    v10.10 Gold Master
                  </span>
                  <span className="text-xs text-purple-300/60 font-mono">Build #{currentVersion.buildNumber}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Store Release & Launch
                </h1>
                <p className="text-xs sm:text-sm text-purple-300/70 mt-1 max-w-xl">
                  Pre-flight operational validation, Android & iOS store listings, quality assurance verification, and automated launch rehearsal engine.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={onExportReport}
                  className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-xs font-semibold text-purple-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
                  title="Export full release manifest to JSON"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Release Report</span>
                </button>
              </div>
            </div>

            {/* 4 Hero Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-900/40">
              <div
                onClick={() => onSelectTab('versions')}
                className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/40 hover:border-pink-500/40 cursor-pointer transition-all"
              >
                <div className="text-[11px] text-purple-300/70 font-medium">Current Version</div>
                <div className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
                  <Rocket className="w-4 h-4 text-pink-400" />
                  {currentVersion.versionName}
                </div>
                <div className="text-[10px] text-pink-300/80 mt-0.5">Build #{currentVersion.buildNumber} &bull; Staged</div>
              </div>

              <div
                onClick={() => onSelectTab('android')}
                className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/40 hover:border-emerald-500/40 cursor-pointer transition-all"
              >
                <div className="text-[11px] text-purple-300/70 font-medium">Android Play Status</div>
                <div className="text-lg font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  Closed Testing
                </div>
                <div className="text-[10px] text-emerald-300/80 mt-0.5">Target API 35 &bull; Signed AAB</div>
              </div>

              <div
                onClick={() => onSelectTab('ios')}
                className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/40 hover:border-cyan-500/40 cursor-pointer transition-all"
              >
                <div className="text-[11px] text-purple-300/70 font-medium">iOS App Store Status</div>
                <div className="text-lg font-black text-cyan-400 mt-1 flex items-center gap-1.5">
                  <Apple className="w-4 h-4" />
                  TestFlight Beta
                </div>
                <div className="text-[10px] text-cyan-300/80 mt-0.5">iOS 18 Ready &bull; Build #28</div>
              </div>

              <div
                onClick={() => onSelectTab('readiness')}
                className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-900/40 hover:border-purple-400 cursor-pointer transition-all"
              >
                <div className="text-[11px] text-purple-300/70 font-medium">Overall Readiness</div>
                <div className="text-lg font-black text-amber-300 mt-1 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  {totalReadinessScore}%
                </div>
                <div className="text-[10px] text-purple-300/80 mt-0.5">Pre-Flight Verified</div>
              </div>
            </div>
          </div>

          {/* Secondary Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => onSelectTab('checklist')}
              className="p-4 rounded-2xl bg-[#120726]/90 border border-purple-900/50 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] text-purple-300/70 font-medium">Checklist Progress</div>
                <div className="text-xl font-black text-white mt-0.5">{completedChecklist} / {checklist.length}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{pendingChecklist} Pending Non-Critical</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => onSelectTab('bugs')}
              className="p-4 rounded-2xl bg-[#120726]/90 border border-purple-900/50 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] text-purple-300/70 font-medium">Issue Backlog</div>
                <div className="text-xl font-black text-white mt-0.5">{openBugs} Open</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{criticalBugs} Critical Blockers</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bug className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => onSelectTab('builds')}
              className="p-4 rounded-2xl bg-[#120726]/90 border border-purple-900/50 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] text-purple-300/70 font-medium">Latest Artifact</div>
                <div className="text-xl font-black text-white mt-0.5">{latestBuild?.id}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">{latestBuild?.buildType} ({latestBuild?.fileSizeMb}MB)</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => onSelectTab('qa')}
              className="p-4 rounded-2xl bg-[#120726]/90 border border-purple-900/50 hover:border-purple-500/50 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] text-purple-300/70 font-medium">QA Suite Pass Rate</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">100% Core</div>
                <div className="text-[10px] text-purple-300/80 font-medium">32/32 Test Cases Passed</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4-5 cols): Visual Reference Card matching 10_10_store_release_and_launch_rehearsal.png */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between p-6 rounded-3xl bg-[#120726] border-2 border-pink-500/40 shadow-2xl shadow-pink-950/30 relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#FF0F7B]" />
                <h3 className="font-extrabold text-white text-base tracking-wide">
                  Store Release & Launch
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                VERIFIED
              </span>
            </div>

            {/* 6 Primary Checkpoints Matching Image 10_10 */}
            <div className="space-y-3 pt-1">
              {[
                { title: 'Build Preparation', desc: 'AAB & IPA signed with release certificates', tab: 'builds' },
                { title: 'App Configuration', desc: 'Agora 4.24, API 35, iOS 18.1 compatibility verified', tab: 'versions' },
                { title: 'Store Assets (Icon, Screenshots)', desc: '512x512 icons, tablet & phone screenshots ready', tab: 'play_preview' },
                { title: 'Store Listing Info', desc: 'Descriptions, privacy links & content ratings staged', tab: 'appstore_preview' },
                { title: 'Testing & QA', desc: '32 test cases & 8 physical device form factors cleared', tab: 'qa' },
                { title: 'Launch Rehearsal', desc: '9-stage deployment simulation completed with 0 errors', tab: 'rehearsal' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectTab(item.tab as ReleaseTabKey)}
                  className="p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 hover:border-pink-500/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-purple-300/60 truncate max-w-[200px]">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 group-hover:text-pink-400 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Big Glowing Neon Button Matching Reference 10_10 */}
          <div className="pt-6 mt-4 border-t border-purple-900/40 space-y-2">
            <button
              onClick={() => onSelectTab('approval')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-pink-500/30 border border-pink-400/40 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Rocket className="w-5 h-5 animate-bounce" />
              <span>Ready for Store Release</span>
            </button>
            <p className="text-[10px] text-center text-purple-300/60">
              Simulated gate &bull; Final approval authorizes deployment package
            </p>
          </div>
        </div>
      </div>

      {/* QUICK LAUNCHPAD ACTIONS GRID */}
      <div className="p-5 rounded-3xl bg-[#120726]/80 border border-purple-900/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-sm text-white">Module 10.10 Quick Navigation Launchpad</h3>
          </div>
          <span className="text-xs text-purple-300/60">16 Dedicated Release & Quality Views</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
          {[
            { label: 'Readiness', tab: 'readiness', icon: TrendingUp },
            { label: 'Android AAB', tab: 'android', icon: Smartphone },
            { label: 'iOS IPA', tab: 'ios', icon: Apple },
            { label: 'Checklist', tab: 'checklist', icon: ClipboardList },
            { label: 'QA Testing', tab: 'qa', icon: ShieldCheck },
            { label: 'Bug Tracker', tab: 'bugs', icon: Bug },
            { label: 'Play Preview', tab: 'play_preview', icon: Layers },
            { label: 'Rehearsal', tab: 'rehearsal', icon: Play },
          ].map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.tab}
                onClick={() => onSelectTab(action.tab as ReleaseTabKey)}
                className="p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/40 hover:border-pink-500/50 flex flex-col items-center justify-center gap-1.5 transition-all group"
              >
                <Icon className="w-4 h-4 text-purple-400 group-hover:text-pink-400 transition-colors" />
                <span className="text-[11px] font-semibold text-purple-200 group-hover:text-white transition-colors text-center">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DUAL STREAM: RECENT RELEASE ACTIVITIES & READINESS HIGHLIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Launch Readiness Overview Mini-Grid */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#120726]/90 border border-purple-900/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Launch Readiness Highlights</h3>
                <p className="text-[11px] text-purple-300/60">10 Comprehensive Governance Domains</p>
              </div>
            </div>
            <button
              onClick={() => onSelectTab('readiness')}
              className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
            >
              Full Readiness <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {readinessCategories.slice(0, 5).map(cat => (
              <div
                key={cat.id}
                onClick={() => onSelectTab('readiness')}
                className="p-3.5 rounded-2xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/30 hover:border-purple-600/40 cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-white">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{cat.completionPercentage}%</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {cat.completedTasks} Tasks
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                    style={{ width: `${cat.completionPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: Recent Release Activity Feed */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#120726]/90 border border-purple-900/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Release Activity History</h3>
                <p className="text-[11px] text-purple-300/60">Verified chronological audit trail</p>
              </div>
            </div>
            <button
              onClick={() => onSelectTab('rehearsal')}
              className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
            >
              Rehearsal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 5).map(act => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-purple-950/20 border border-purple-900/30 space-y-1 hover:border-purple-600/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate max-w-[170px]">{act.title}</span>
                  <span className="text-[10px] text-purple-300/60 font-mono">{act.dateTime}</span>
                </div>
                <p className="text-[11px] text-purple-300/70 line-clamp-2 leading-relaxed">
                  {act.description}
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-purple-400/80">
                  <span>By {act.adminName}</span>
                  <span className="font-mono text-pink-400/80">{act.relatedRecordId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
