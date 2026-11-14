'use client';

import React from 'react';
import {
  Rocket,
  Smartphone,
  Apple,
  CheckCircle2,
  Bug,
  ShieldCheck,
  ClipboardList,
  FileText,
  Activity,
  Search,
  RotateCcw
} from 'lucide-react';
import { ReleaseEmptyKind } from './releaseTypes';

interface ReleaseEmptyStatesProps {
  kind: ReleaseEmptyKind;
  onAction?: () => void;
  actionLabel?: string;
  customMessage?: string;
}

export const ReleaseEmptyStates: React.FC<ReleaseEmptyStatesProps> = ({
  kind,
  onAction,
  actionLabel = 'Reset Filters',
  customMessage
}) => {
  const getEmptyConfig = () => {
    switch (kind) {
      case 'no_release_records':
        return {
          icon: Rocket,
          color: 'text-pink-400',
          bgColor: 'bg-pink-500/10',
          borderColor: 'border-pink-500/20',
          title: 'No Release Records Found',
          description: customMessage || 'There are no active or archived application releases matching your selection.'
        };
      case 'no_android_builds':
        return {
          icon: Smartphone,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          title: 'No Android Builds Found',
          description: customMessage || 'No Android App Bundle (AAB) or APK artifacts match the applied filter criteria.'
        };
      case 'no_ios_builds':
        return {
          icon: Apple,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/20',
          title: 'No iOS Builds Found',
          description: customMessage || 'No iOS TestFlight IPA or App Store archive builds found for this version.'
        };
      case 'no_test_records':
        return {
          icon: CheckCircle2,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          title: 'No QA Test Records Found',
          description: customMessage || 'No test cases match the selected category, platform, or execution status.'
        };
      case 'no_bugs':
        return {
          icon: Bug,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          title: 'No Bug Reports Found',
          description: customMessage || 'No issue tickets match the applied search query or status filters.'
        };
      case 'no_critical_bugs':
        return {
          icon: ShieldCheck,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          title: 'Zero Critical Bugs Active!',
          description: customMessage || 'All critical priority issues have been verified and resolved. Release gate is clear.'
        };
      case 'no_pending_checklist':
        return {
          icon: ClipboardList,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          title: 'All Checklist Items Completed!',
          description: customMessage || 'There are no remaining pending tasks in this release checklist category.'
        };
      case 'no_release_notes':
        return {
          icon: FileText,
          color: 'text-pink-400',
          bgColor: 'bg-pink-500/10',
          borderColor: 'border-pink-500/20',
          title: 'No Release Notes Found',
          description: customMessage || 'No release notes drafts or publications match the current version filters.'
        };
      case 'no_rehearsal_activity':
        return {
          icon: Activity,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20',
          title: 'No Rehearsal Activity Logged',
          description: customMessage || 'Launch rehearsal has not recorded any stage verification logs yet.'
        };
      case 'no_search_results':
      default:
        return {
          icon: Search,
          color: 'text-pink-400',
          bgColor: 'bg-pink-500/10',
          borderColor: 'border-pink-500/20',
          title: 'No Matching Release Records',
          description: customMessage || 'We couldn\'t find any builds, versions, test cases, or bugs matching your search.'
        };
    }
  };

  const config = getEmptyConfig();
  const IconComponent = config.icon;

  return (
    <div className={`p-8 sm:p-12 rounded-3xl bg-[#14072b]/80 border ${config.borderColor} flex flex-col items-center justify-center text-center space-y-4 shadow-xl max-w-xl mx-auto my-6 animate-fade-in`}>
      <div className={`w-14 h-14 rounded-2xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center ${config.color} shadow-lg shadow-purple-950/40`}>
        <IconComponent className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-white tracking-wide">{config.title}</h3>
        <p className="text-xs text-purple-300/70 max-w-sm leading-relaxed">{config.description}</p>
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-xs font-semibold text-purple-200 hover:text-white flex items-center gap-2 transition-all shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
