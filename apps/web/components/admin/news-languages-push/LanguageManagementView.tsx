import React from 'react';
import {
  Globe2,
  Plus,
  Info,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LanguageRecord } from './newsLanguagesPushTypes';

interface LanguageManagementViewProps {
  languages: LanguageRecord[];
  onOpenDetails: (language: LanguageRecord) => void;
  onNavigateTranslations: (langCode?: string) => void;
  onToggleLanguageStatus: (langId: string) => void;
}

export const LanguageManagementView: React.FC<LanguageManagementViewProps> = ({
  languages,
  onOpenDetails,
  onNavigateTranslations,
  onToggleLanguageStatus,
}) => {
  const activeCount = languages.filter((l) => l.status === 'Active').length;
  const inactiveCount = languages.length - activeCount;
  const avgCompletion = Math.round(
    languages.reduce((acc, l) => acc + l.completionPercentage, 0) / (languages.length || 1)
  );

  return (
    <div className="space-y-6" data-testid="language-management-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Global Languages & Localization</h2>
          <p className="text-xs text-slate-400">
            Multi-language platform support, RTL layout adaptations, and translation completeness
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTranslations()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all"
          >
            <span>Translation Dictionary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Language Overview KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Total Languages</span>
          <div className="text-2xl font-bold text-white mt-1">{languages.length}</div>
          <span className="text-[10px] text-cyan-400 mt-1 block">Global coverage</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Active Languages</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Serving live users</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Inactive / Staging</span>
          <div className="text-2xl font-bold text-slate-400 mt-1">{inactiveCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Pending launch</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Average Completion</span>
          <div className="text-2xl font-bold text-pink-400 mt-1">{avgCompletion}%</div>
          <span className="text-[10px] text-pink-400/80 mt-1 block">Strings localized</span>
        </div>
      </div>

      {/* Language Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="language-cards-grid">
        {languages.map((lang) => (
          <div
            key={lang.id}
            className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-lg group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl select-none group-hover:scale-110 transition-transform">
                  {lang.flag}
                </span>
                <div className="flex items-center gap-1.5">
                  {lang.isDefault && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      Default
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      lang.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {lang.status}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {lang.name}
                </h3>
                <div className="text-xs text-slate-400">
                  {lang.nativeName} • <span className="font-mono text-cyan-400">{lang.code}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Completion</span>
                  <span className="font-bold text-cyan-400">{lang.completionPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700/80 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      lang.completionPercentage >= 90
                        ? 'bg-emerald-500'
                        : lang.completionPercentage >= 75
                        ? 'bg-cyan-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${lang.completionPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>{lang.completedKeys} completed</span>
                  <span>{lang.missingKeys} missing</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between">
              <button
                onClick={() => onOpenDetails(lang)}
                className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Details</span>
              </button>

              <div className="flex items-center gap-2">
                {!lang.isDefault && (
                  <button
                    onClick={() => onToggleLanguageStatus(lang.id)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {lang.status === 'Active' ? 'Disable' : 'Enable'}
                  </button>
                )}
                <button
                  onClick={() => onNavigateTranslations(lang.code)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                >
                  Strings
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
