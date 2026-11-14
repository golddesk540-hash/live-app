'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ChecklistRecord } from './releaseTypes';
import { ReleaseEmptyStates } from './ReleaseEmptyStates';

interface ReleaseChecklistTabProps {
  checklist: ChecklistRecord[];
  onUpdateChecklistStatus?: (id: string, newStatus: ChecklistRecord['status']) => void;
  onBatchCompleteCategory?: (category: string) => void;
}

export const ReleaseChecklistTab: React.FC<ReleaseChecklistTabProps> = ({
  checklist,
  onUpdateChecklistStatus,
  onBatchCompleteCategory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const categories = [
    'All',
    'Application Readiness',
    'Android Readiness',
    'iOS Readiness',
    'Quality Assurance',
    'Store Readiness'
  ];

  const filteredItems = checklist.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch =
      item.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignedReviewer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const totalCount = checklist.length;
  const completedCount = checklist.filter((i) => i.status === 'Completed').length;
  const inProgressCount = checklist.filter((i) => i.status === 'In Progress').length;
  const attentionCount = checklist.filter((i) => i.status === 'Needs Attention').length;
  const pendingCount = checklist.filter((i) => i.status === 'Pending').length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const getStatusBadge = (status: ChecklistRecord['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Needs Attention':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Pending':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Progress */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Release Readiness Checklist
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-normal">
                  {completedCount}/{totalCount} Completed
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                27 formal release criteria across application, Android, iOS, QA, and store readiness gates.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="min-w-[200px]">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Readiness Gate</span>
                <span className="text-pink-400 font-bold font-mono">{completionPercentage}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-purple-800/40">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {selectedCategory !== 'All' && onBatchCompleteCategory && (
              <button
                onClick={() => onBatchCompleteCategory(selectedCategory)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-700/40 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-semibold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Sign Off Category
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-800/20">
          <div className="p-3 bg-slate-900/60 border border-purple-800/30 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-lg font-bold text-emerald-400 font-mono">{completedCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Completed</div>
            </div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-purple-800/30 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <div className="text-lg font-bold text-amber-300 font-mono">{inProgressCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">In Progress</div>
            </div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-purple-800/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="text-lg font-bold text-red-400 font-mono">{attentionCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Needs Attention</div>
            </div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-purple-800/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <div className="text-lg font-bold text-slate-300 font-mono">{pendingCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Pending Review</div>
            </div>
          </div>
        </div>

        {/* Category Pills & Filters */}
        <div className="mt-6 pt-5 border-t border-purple-800/20 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px] max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search checklist tasks, assigned reviewer, criteria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-purple-800/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-purple-400" /> Status:
              {['All', 'Completed', 'In Progress', 'Needs Attention', 'Pending'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    statusFilter === st
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                      : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Items List */}
      {filteredItems.length === 0 ? (
        <ReleaseEmptyStates
          kind="no_pending_checklist"
          onAction={() => {
            setSelectedCategory('All');
            setStatusFilter('All');
            setSearchQuery('');
          }}
          actionLabel="Reset Filters"
          customMessage="No checklist items match the current filters."
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                item.status === 'Completed'
                  ? 'bg-slate-900/40 border-purple-900/30'
                  : item.status === 'Needs Attention'
                  ? 'bg-red-950/20 border-red-700/30'
                  : 'bg-slate-900/70 border-purple-800/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => {
                    if (onUpdateChecklistStatus) {
                      const next =
                        item.status === 'Completed'
                          ? 'In Progress'
                          : item.status === 'In Progress'
                          ? 'Needs Attention'
                          : 'Completed';
                      onUpdateChecklistStatus(item.id, next);
                    }
                  }}
                  className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition shrink-0 ${
                    item.status === 'Completed'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : item.status === 'Needs Attention'
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-pink-500'
                  }`}
                  title="Cycle status: Completed -> In Progress -> Needs Attention"
                >
                  {item.status === 'Completed' ? (
                    <Check className="w-4 h-4" />
                  ) : item.status === 'Needs Attention' ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-pink-400 font-bold">
                      {item.id}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {item.taskName}
                    </span>
                    {item.isCritical && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                        Critical Gate
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 font-mono">
                    <span className="flex items-center gap-1 text-slate-300 font-sans">
                      <User className="w-3 h-3 text-purple-400" />
                      Reviewer: {item.assignedReviewer}
                    </span>
                    <span>Updated: {item.updatedDate}</span>
                  </div>
                </div>
              </div>

              {/* Status Selector Dropdown */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <select
                  value={item.status}
                  onChange={(e) => {
                    if (onUpdateChecklistStatus) {
                      onUpdateChecklistStatus(item.id, e.target.value as ChecklistRecord['status']);
                    }
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border bg-slate-900 focus:outline-none transition ${getStatusBadge(
                    item.status
                  )}`}
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
