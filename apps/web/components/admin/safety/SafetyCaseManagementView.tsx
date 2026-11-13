'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Flame,
  Grid,
  List,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { ChildSafetyEmptyStates } from './ChildSafetyEmptyStates';
import {
  SafetyCaseCategory,
  SafetyCaseRecord,
  SafetyCaseStatus,
  SafetyFilters,
  SafetyPriority,
} from './childSafetyTypes';

interface SafetyCaseManagementViewProps {
  cases: SafetyCaseRecord[];
  filters: SafetyFilters;
  onFilterChange: (newFilters: Partial<SafetyFilters>) => void;
  onResetFilters: () => void;
  onSelectCase: (safetyCase: SafetyCaseRecord) => void;
  onOpenReviewModal: (safetyCase: SafetyCaseRecord) => void;
  onRefresh: () => void;
}

export const SafetyCaseManagementView: React.FC<SafetyCaseManagementViewProps> = ({
  cases,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectCase,
  onOpenReviewModal,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  const categories: (SafetyCaseCategory | 'All')[] = [
    'All',
    'Age Verification Review',
    'Underage Stream Flag',
    'Inappropriate Interaction',
    'Restricted Contact Violation',
    'Suspicious Minor Profile',
    'Grooming Prevention Alert',
    'General Child Safety',
  ];

  // Filtering
  const filteredCases = cases.filter((c) => {
    if (filters.status !== 'All' && c.status !== filters.status) return false;
    if (filters.category !== 'All' && c.category !== filters.category) return false;
    if (filters.priority !== 'All' && c.priority !== filters.priority) return false;
    if (filters.isEscalatedOnly && !c.isEscalated) return false;
    if (filters.assignedReviewer !== 'All' && c.assignedReviewer !== filters.assignedReviewer)
      return false;

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchId = c.id.toLowerCase().includes(q);
      const matchReport = c.relatedReportId ? c.relatedReportId.toLowerCase().includes(q) : false;
      const matchUser =
        c.relatedUsername.toLowerCase().includes(q) || c.relatedUserId.toLowerCase().includes(q);
      const matchHost = c.relatedHostId ? c.relatedHostId.toLowerCase().includes(q) : false;
      const matchReviewer = c.assignedReviewer.toLowerCase().includes(q);
      const matchDesc = c.shortDescription.toLowerCase().includes(q);
      if (!matchId && !matchReport && !matchUser && !matchHost && !matchReviewer && !matchDesc)
        return false;
    }

    return true;
  });

  // Sorting
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (filters.sortBy === 'oldest') {
      return a.numericId - b.numericId;
    }
    if (filters.sortBy === 'priority_high') {
      const pMap: Record<SafetyPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    if (filters.sortBy === 'priority_low') {
      const pMap: Record<SafetyPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return pMap[a.priority] - pMap[b.priority];
    }
    // default newest
    return b.numericId - a.numericId;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCases.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedCases = sortedCases.slice(startIndex, startIndex + pageSize);

  const getPriorityBadge = (prio: SafetyPriority) => {
    switch (prio) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  const getStatusBadge = (status: SafetyCaseStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'Under Review':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
      case 'Escalated':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)]';
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'Closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Filter Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['All', 'Pending', 'Under Review', 'Escalated', 'Resolved', 'Closed'] as (
          | SafetyCaseStatus
          | 'All'
        )[]).map((st) => {
          const count = st === 'All' ? cases.length : cases.filter((c) => c.status === st).length;
          const isActive = filters.status === st;
          return (
            <button
              key={st}
              onClick={() => {
                onFilterChange({ status: st });
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] border border-pink-400/50'
                  : 'bg-[#1A103C]/80 hover:bg-[#241452] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {/* 2. Search & Multi-Facet Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#1A103C]/70 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Case ID, report, target user, reviewer..."
              value={filters.searchQuery}
              onChange={(e) => {
                onFilterChange({ searchQuery: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dropdowns & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => {
                onFilterChange({ category: e.target.value as any });
                setCurrentPage(1);
              }}
              aria-label="Filter safety cases by category"
              className="px-3 py-2 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => {
                onFilterChange({ priority: e.target.value as any });
                setCurrentPage(1);
              }}
              aria-label="Filter safety cases by priority"
              className="px-3 py-2 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Sort Order */}
            <select
              value={filters.sortBy}
              onChange={(e) => {
                onFilterChange({ sortBy: e.target.value as any });
                setCurrentPage(1);
              }}
              aria-label="Sort safety cases"
              className="px-3 py-2 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="priority_high">Sort: Highest Priority</option>
              <option value="priority_low">Sort: Lowest Priority</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-[#0B0716] border border-white/10">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-pink-500/20 text-pink-400' : 'text-gray-400 hover:text-white'
                }`}
                title="Card Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Clear Filters */}
            {(filters.searchQuery ||
              filters.category !== 'All' ||
              filters.priority !== 'All' ||
              filters.status !== 'All' ||
              filters.isEscalatedOnly) && (
              <button
                onClick={onResetFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Cases Data Display (Table vs Grid) */}
      {paginatedCases.length === 0 ? (
        <ChildSafetyEmptyStates
          type={
            filters.searchQuery
              ? 'no_search_results'
              : filters.status === 'Pending'
              ? 'no_pending'
              : filters.priority === 'Urgent'
              ? 'no_urgent'
              : filters.isEscalatedOnly
              ? 'no_escalated'
              : 'no_pending'
          }
          onResetFilters={onResetFilters}
          onRefresh={onRefresh}
        />
      ) : viewMode === 'table' ? (
        <div className="rounded-2xl bg-[#1A103C]/80 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#120A2A] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Case ID</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Target Account</th>
                  <th className="py-3.5 px-3">Related Report</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Assigned Reviewer</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedCases.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <span
                          onClick={() => onSelectCase(c)}
                          className="cursor-pointer hover:text-pink-400 hover:underline flex items-center gap-1.5"
                        >
                          {c.id}
                          {c.isEscalated && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </span>
                        <div className="text-[10px] text-gray-500 font-normal">
                          {c.createdRelative}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-pink-400 whitespace-nowrap">
                          {c.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={c.relatedUserAvatar}
                            alt={c.relatedUsername}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-[120px] flex items-center gap-1">
                              {c.relatedUsername}
                              {c.isHost && (
                                <span className="px-1 text-[8px] bg-pink-500/20 text-pink-300 rounded font-bold">
                                  HOST
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {c.relatedUserId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-gray-400">
                        {c.relatedReportId || '—'}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                            c.priority
                          )}`}
                        >
                          {c.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-gray-300">{c.assignedReviewer}</td>

                      <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCases.map((c) => {
            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-white/10 hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                      {c.id}
                      {c.isEscalated && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/40">
                          ESCALATED
                        </span>
                      )}
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
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusBadge(
                            c.status
                          )}`}
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

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadge(
                      c.priority
                    )}`}
                  >
                    {c.priority}
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
      )}

      {/* Pagination */}
      {sortedCases.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400 pt-2">
          <div>
            Showing <strong className="text-white">{startIndex + 1}</strong> to{' '}
            <strong className="text-white">
              {Math.min(startIndex + pageSize, sortedCases.length)}
            </strong>{' '}
            of <strong className="text-white">{sortedCases.length}</strong> cases
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-[#1A103C] hover:bg-white/10 text-gray-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  page === validCurrentPage
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'bg-[#1A103C] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage === totalPages}
              className="p-1.5 rounded-lg border border-white/10 bg-[#1A103C] hover:bg-white/10 text-gray-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
