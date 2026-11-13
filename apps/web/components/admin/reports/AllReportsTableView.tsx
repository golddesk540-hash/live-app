'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  Grid,
  Layers,
  List,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Square,
  User,
  X,
} from 'lucide-react';
import { REPORT_CATEGORIES } from './mockReportQueueData';
import { ReportQueueEmptyStates } from './ReportQueueEmptyStates';
import {
  ReportCategoryKey,
  ReportFilters,
  ReportPriority,
  ReportRecord,
  ReportStatus,
} from './reportQueueTypes';

interface AllReportsTableViewProps {
  reports: ReportRecord[];
  allReportsCount: number;
  pendingCount: number;
  reviewCount: number;
  resolvedCount: number;
  rejectedCount: number;
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
  onResetFilters: () => void;
  onSelectReport: (report: ReportRecord) => void;
  onOpenReviewModal: (report: ReportRecord) => void;
  selectedReportIds: string[];
  onToggleSelectReport: (id: string) => void;
  onSelectAllVisible: (ids: string[]) => void;
  onClearSelection: () => void;
  onOpenBulkModal: () => void;
}

export const AllReportsTableView: React.FC<AllReportsTableViewProps> = ({
  reports,
  allReportsCount,
  pendingCount,
  reviewCount,
  resolvedCount,
  rejectedCount,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectReport,
  onOpenReviewModal,
  selectedReportIds,
  onToggleSelectReport,
  onSelectAllVisible,
  onClearSelection,
  onOpenBulkModal,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Filter logic
  const filteredReports = reports.filter((report) => {
    // 1. Status tab
    if (filters.status !== 'All' && report.status !== filters.status) return false;

    // 2. Category
    if (filters.category !== 'All' && report.category !== filters.category) return false;

    // 3. Priority
    if (filters.priority !== 'All' && report.priority !== filters.priority) return false;

    // 4. Account Type
    if (filters.accountType !== 'All' && report.reported.accountType !== filters.accountType)
      return false;

    // 5. Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchId = report.id.toLowerCase().includes(q);
      const matchReporter =
        report.reporter.username.toLowerCase().includes(q) ||
        report.reporter.userId.toLowerCase().includes(q);
      const matchReported =
        report.reported.username.toLowerCase().includes(q) ||
        report.reported.accountId.toLowerCase().includes(q) ||
        (report.reported.hostId && report.reported.hostId.toLowerCase().includes(q));
      const matchDesc = report.shortDescription.toLowerCase().includes(q);
      if (!matchId && !matchReporter && !matchReported && !matchDesc) return false;
    }

    return true;
  });

  // Sorting
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (filters.sortBy === 'oldest') {
      return a.numericId - b.numericId;
    }
    if (filters.sortBy === 'priority_high') {
      const pMap: Record<ReportPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    if (filters.sortBy === 'priority_low') {
      const pMap: Record<ReportPriority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return pMap[a.priority] - pMap[b.priority];
    }
    // default newest
    return b.numericId - a.numericId;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedReports = sortedReports.slice(startIndex, startIndex + pageSize);

  const visibleIds = paginatedReports.map((r) => r.id);
  const isAllVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedReportIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllVisibleSelected) {
      onClearSelection();
    } else {
      onSelectAllVisible(visibleIds);
    }
  };

  // Status Tab options matching 10_04_report_queue.png visual reference
  const statusTabs: { id: ReportStatus | 'All'; label: string; count: number }[] = [
    { id: 'All', label: `All (${allReportsCount})`, count: allReportsCount },
    { id: 'Pending', label: `Pending (${pendingCount})`, count: pendingCount },
    { id: 'Under Review', label: `Review (${reviewCount})`, count: reviewCount },
    { id: 'Resolved', label: `Resolved (${resolvedCount})`, count: resolvedCount },
    { id: 'Rejected', label: `Rejected (${rejectedCount})`, count: rejectedCount },
  ];

  const getPriorityBadge = (prio: ReportPriority) => {
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

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
      case 'Under Review':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.25)]';
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Visual Reference 10_04 Navigation Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = filters.status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onFilterChange({ status: tab.id });
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_20px_rgba(255,15,123,0.4)] border border-pink-400/50'
                  : 'bg-[#1A103C]/80 hover:bg-[#241452] text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Search, Filters & View Switcher Bar */}
      <div className="p-4 rounded-2xl bg-[#1A103C]/70 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Report ID, reporter, target account..."
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
                onFilterChange({ category: e.target.value as ReportCategoryKey | 'All' });
                setCurrentPage(1);
              }}
              aria-label="Filter reports by policy category"
              className="px-3 py-2 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Categories</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label} ({c.reportCount})
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => {
                onFilterChange({ priority: e.target.value as ReportPriority | 'All' });
                setCurrentPage(1);
              }}
              aria-label="Filter reports by review priority"
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
              aria-label="Sort reports order"
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

            {/* Clear Filters Button */}
            {(filters.searchQuery ||
              filters.category !== 'All' ||
              filters.priority !== 'All' ||
              filters.status !== 'All') && (
              <button
                onClick={onResetFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Selection Notification Bar */}
        {selectedReportIds.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-pink-500/15 border border-pink-500/40 text-xs text-white animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span>
                <strong>{selectedReportIds.length}</strong> reports selected for batch action
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenBulkModal}
                className="px-3 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Apply Batch Action
              </button>
              <button
                onClick={onClearSelection}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Data Content (Table or Grid) */}
      {paginatedReports.length === 0 ? (
        <ReportQueueEmptyStates
          type={
            filters.searchQuery
              ? 'no_search_results'
              : filters.category !== 'All'
              ? 'no_category_reports'
              : filters.status === 'Pending'
              ? 'no_pending_reports'
              : filters.status === 'Under Review'
              ? 'no_review_reports'
              : filters.status === 'Resolved'
              ? 'no_resolved_reports'
              : filters.status === 'Rejected'
              ? 'no_rejected_reports'
              : 'no_reports'
          }
          onResetFilters={onResetFilters}
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-[#1A103C]/80 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#120A2A] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-gray-400 hover:text-white"
                      title={isAllVisibleSelected ? 'Deselect all visible' : 'Select all visible'}
                    >
                      {isAllVisibleSelected ? (
                        <CheckSquare className="w-4 h-4 text-pink-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">Report ID</th>
                  <th className="py-3.5 px-3">Reporter</th>
                  <th className="py-3.5 px-3">Reported Account</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Description</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedReports.map((report) => {
                  const isSelected = selectedReportIds.includes(report.id);
                  return (
                    <tr
                      key={report.id}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        isSelected ? 'bg-pink-500/[0.06]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pl-4 pr-2">
                        <button
                          onClick={() => onToggleSelectReport(report.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-pink-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Report ID */}
                      <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                        <span
                          onClick={() => onSelectReport(report)}
                          className="cursor-pointer hover:text-pink-400 hover:underline"
                        >
                          {report.id}
                        </span>
                        <div className="text-[10px] text-gray-500 font-normal">
                          {report.submittedRelative}
                        </div>
                      </td>

                      {/* Reporter */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={report.reporter.avatar}
                            alt={report.reporter.username}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-[110px]">
                              {report.reporter.username}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {report.reporter.countryCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Reported Target Account */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={report.reported.avatar}
                            alt={report.reported.username}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-[120px] flex items-center gap-1">
                              {report.reported.username}
                              {report.reported.isHost && (
                                <span className="px-1 text-[8px] bg-pink-500/20 text-pink-300 rounded font-bold">
                                  HOST
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {report.reported.accountId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-pink-400 whitespace-nowrap">
                          {report.categoryLabel}
                        </span>
                      </td>

                      {/* Short Description */}
                      <td className="py-3 px-3 max-w-xs">
                        <p className="truncate text-gray-300" title={report.shortDescription}>
                          {report.shortDescription}
                        </p>
                      </td>

                      {/* Priority Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                            report.priority
                          )}`}
                        >
                          {report.priority}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectReport(report)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => onOpenReviewModal(report)}
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
        /* GRID VIEW (matching 10_04 Card aesthetic) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedReports.map((report) => {
            const isSelected = selectedReportIds.includes(report.id);
            return (
              <div
                key={report.id}
                className={`p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border transition-all duration-300 group flex flex-col justify-between ${
                  isSelected
                    ? 'border-pink-500 shadow-[0_0_20px_rgba(255,15,123,0.3)] bg-pink-500/[0.04]'
                    : 'border-white/10 hover:border-pink-500/40 hover:bg-[#241452]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleSelectReport(report.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-pink-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span className="font-mono text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                        Report {report.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">{report.submittedRelative}</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={report.reported.avatar}
                      alt={report.reported.username}
                      className="w-12 h-12 rounded-xl object-cover border border-white/15 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white truncate">
                          {report.reported.username}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-pink-400 mt-0.5 truncate">
                        {report.categoryLabel}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {report.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityBadge(
                      report.priority
                    )}`}
                  >
                    {report.priority}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectReport(report)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onOpenReviewModal(report)}
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

      {/* 4. Pagination & Count footer */}
      {sortedReports.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400 pt-2">
          <div>
            Showing <strong className="text-white">{startIndex + 1}</strong> to{' '}
            <strong className="text-white">
              {Math.min(startIndex + pageSize, sortedReports.length)}
            </strong>{' '}
            of <strong className="text-white">{sortedReports.length}</strong> reports
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage === 1}
              className="p-1.5 rounded-lg border border-white/10 bg-[#1A103C] hover:bg-white/10 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
              className="p-1.5 rounded-lg border border-white/10 bg-[#1A103C] hover:bg-white/10 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
