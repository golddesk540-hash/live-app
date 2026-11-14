import React from 'react';
import { X, Globe2, CheckCircle2, AlertCircle, Clock, Check, ArrowRight } from 'lucide-react';
import { LanguageRecord } from './newsLanguagesPushTypes';

interface LanguageDetailsModalProps {
  isOpen: boolean;
  language: LanguageRecord | null;
  onClose: () => void;
  onEditTranslations?: (langCode: string) => void;
}

export const LanguageDetailsModal: React.FC<LanguageDetailsModalProps> = ({
  isOpen,
  language,
  onClose,
  onEditTranslations,
}) => {
  if (!isOpen || !language) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      data-testid="language-details-modal"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none">{language.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{language.name}</h2>
                <span className="text-sm text-slate-400">({language.nativeName})</span>
                {language.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Code: <span className="font-mono text-pink-400">{language.code}</span> • ID:{' '}
                {language.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Update row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <span className="text-xs text-slate-400 block mb-1">Status</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                  language.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    language.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
                {language.status}
              </span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <span className="text-xs text-slate-400 block mb-1">Last Updated</span>
              <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {language.lastUpdated}
              </span>
            </div>
          </div>

          {/* Translation Progress */}
          <div className="bg-slate-800/40 border border-slate-700/70 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Translation Completion</span>
              <span className="text-base font-bold text-pink-400">
                {language.completionPercentage}%
              </span>
            </div>

            {/* Multi-segment progress bar */}
            <div className="w-full h-3 rounded-full bg-slate-700/70 overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${(language.completedKeys / (language.totalKeys || 1)) * 100}%`,
                }}
                title={`Completed: ${language.completedKeys}`}
              />
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{
                  width: `${(language.needsReviewKeys / (language.totalKeys || 1)) * 100}%`,
                }}
                title={`Needs Review: ${language.needsReviewKeys}`}
              />
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{
                  width: `${(language.missingKeys / (language.totalKeys || 1)) * 100}%`,
                }}
                title={`Missing: ${language.missingKeys}`}
              />
            </div>

            {/* Key breakdown metrics */}
            <div className="grid grid-cols-4 gap-2 mt-4 text-center">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="text-xs text-slate-400">Total Keys</div>
                <div className="text-sm font-bold text-white mt-0.5">{language.totalKeys}</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs text-emerald-400 flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" /> Done
                </div>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">
                  {language.completedKeys}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-xs text-amber-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Review
                </div>
                <div className="text-sm font-bold text-amber-300 mt-0.5">
                  {language.needsReviewKeys}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-xs text-rose-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Missing
                </div>
                <div className="text-sm font-bold text-rose-300 mt-0.5">
                  {language.missingKeys}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          {onEditTranslations && (
            <button
              onClick={() => {
                onClose();
                onEditTranslations(language.code);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 transition-colors shadow-lg shadow-pink-500/20"
            >
              <span>Manage Strings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
