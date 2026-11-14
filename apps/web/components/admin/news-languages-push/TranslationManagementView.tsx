import React, { useState, useMemo } from 'react';
import {
  Languages,
  Search,
  Filter,
  Plus,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  TranslationRecord,
  LanguageRecord,
  TranslationStatus,
} from './newsLanguagesPushTypes';
import { NewsLanguagesPushEmptyStates } from './NewsLanguagesPushEmptyStates';

interface TranslationManagementViewProps {
  translations: TranslationRecord[];
  languages: LanguageRecord[];
  selectedLanguageCode: string;
  onSelectLanguage: (code: string) => void;
  onEditTranslation: (tr: TranslationRecord) => void;
  onAddTranslation: () => void;
}

export const TranslationManagementView: React.FC<TranslationManagementViewProps> = ({
  translations,
  languages,
  selectedLanguageCode,
  onSelectLanguage,
  onEditTranslation,
  onAddTranslation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const activeLang = languages.find((l) => l.code === selectedLanguageCode) || languages[0];

  // Filter translations by language, search query, status
  const filteredTranslations = useMemo(() => {
    return translations.filter((tr) => {
      const matchesLang = tr.languageCode === selectedLanguageCode;
      const matchesSearch =
        tr.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tr.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tr.translatedText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || tr.status === statusFilter;
      return matchesLang && matchesSearch && matchesStatus;
    });
  }, [translations, selectedLanguageCode, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTranslations.length / itemsPerPage) || 1;
  const paginatedTranslations = filteredTranslations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: TranslationStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Needs Review</span>
          </span>
        );
      case 'Missing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Missing</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="translation-management-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Localization Dictionary</h2>
          <p className="text-xs text-slate-400">
            Manage UI translation keys, approve strings, and maintain multilingual consistency
          </p>
        </div>
        <button
          onClick={onAddTranslation}
          data-testid="add-translation-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Key</span>
        </button>
      </div>

      {/* Language Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2" data-testid="translation-lang-tabs">
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => {
              onSelectLanguage(l.code);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              selectedLanguageCode === l.code
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 font-mono">
              {l.completionPercentage}%
            </span>
          </button>
        ))}
      </div>

      {/* Language Progress Card for currently selected language */}
      {activeLang && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border border-slate-700/80 shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">{activeLang.flag}</span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeLang.name}</span>
                  <span className="text-xs text-slate-400">({activeLang.nativeName})</span>
                  {activeLang.isDefault && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      Default
                    </span>
                  )}
                </h3>
                <span className="text-xs text-slate-400">
                  Target code: <span className="font-mono text-cyan-400">{activeLang.code}</span> • Last updated: {activeLang.lastUpdated}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Completion</span>
                <span className="text-xl font-extrabold text-cyan-400">
                  {activeLang.completionPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-700/70 overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{
                width: `${(activeLang.completedKeys / (activeLang.totalKeys || 1)) * 100}%`,
              }}
              title={`Completed: ${activeLang.completedKeys}`}
            />
            <div
              className="bg-amber-500 transition-all duration-300"
              style={{
                width: `${(activeLang.needsReviewKeys / (activeLang.totalKeys || 1)) * 100}%`,
              }}
              title={`Needs Review: ${activeLang.needsReviewKeys}`}
            />
            <div
              className="bg-rose-500 transition-all duration-300"
              style={{
                width: `${(activeLang.missingKeys / (activeLang.totalKeys || 1)) * 100}%`,
              }}
              title={`Missing: ${activeLang.missingKeys}`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Completed: <strong className="text-white">{activeLang.completedKeys}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Needs Review: <strong className="text-white">{activeLang.needsReviewKeys}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Missing: <strong className="text-white">{activeLang.missingKeys}</strong>
            </span>
            <span className="text-slate-500">
              Total Keys: <strong className="text-white">{activeLang.totalKeys}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search translation key, English source or translated text..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Needs Review">Needs Review</option>
          <option value="Missing">Missing</option>
        </select>

        {statusFilter !== 'ALL' || searchQuery ? (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Translations Table */}
      {filteredTranslations.length === 0 ? (
        <NewsLanguagesPushEmptyStates
          kind={statusFilter === 'Missing' ? 'no_missing_translations' : 'no_translations'}
          onAction={onAddTranslation}
        />
      ) : (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="translations-table">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                  <th className="py-3.5 px-4">Key</th>
                  <th className="py-3.5 px-4">English Source</th>
                  <th className="py-3.5 px-4">
                    Translated Text ({activeLang?.name || selectedLanguageCode})
                  </th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Updated</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {paginatedTranslations.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="py-3 px-4 font-mono text-xs text-cyan-300">
                      {tr.key}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-300 max-w-xs">
                      {tr.sourceText}
                    </td>
                    <td
                      className="py-3 px-4 text-xs text-white max-w-sm"
                      dir={selectedLanguageCode === 'ur' || selectedLanguageCode === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {tr.translatedText || (
                        <span className="text-slate-500 italic">Not yet translated</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(tr.status)}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {tr.lastUpdated}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onEditTranslation(tr)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors inline-flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/70 rounded-2xl text-xs">
          <span className="text-slate-400">
            Page <span className="font-bold text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
