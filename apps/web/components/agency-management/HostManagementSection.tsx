'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ChevronRight, Search, ShieldCheck, Users, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { AgencyEmptyState } from './AgencyEmptyState';
import { getHostStatusBadgeStyle } from './HostDetailView';
import {
  AgencyHostRecord,
  HostFilterStatus,
  HostSortMode,
} from './types';

interface HostManagementSectionProps {
  hosts: AgencyHostRecord[];
  statusFilter: HostFilterStatus;
  onStatusFilterChange: (status: HostFilterStatus) => void;
  onSelectHost: (hostId: string) => void;
  onRestoreHosts: () => void;
}

const FILTER_OPTIONS: HostFilterStatus[] = [
  'All',
  'Active',
  'Pending',
  'Inactive',
  'Suspended',
];

export const HostManagementSection: React.FC<HostManagementSectionProps> = ({
  hosts,
  statusFilter,
  onStatusFilterChange,
  onSelectHost,
  onRestoreHosts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<HostSortMode>('default');

  const statusCounts = useMemo(() => {
    const counts: Record<HostFilterStatus, number> = {
      All: hosts.length,
      Active: 0,
      Pending: 0,
      Inactive: 0,
      Suspended: 0,
    };
    hosts.forEach((h) => {
      counts[h.status] += 1;
    });
    return counts;
  }, [hosts]);

  const visibleHosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = hosts.filter((h) => {
      if (statusFilter !== 'All' && h.status !== statusFilter) return false;
      if (q) {
        const hay = `${h.username} ${h.handle} ${h.hostId} ${h.countryLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortMode === 'name_asc') {
      return [...filtered].sort((a, b) => a.username.localeCompare(b.username));
    }
    if (sortMode === 'sessions_desc') {
      return [...filtered].sort(
        (a, b) => b.sampleSessionsThisWeek - a.sampleSessionsThisWeek
      );
    }
    return filtered;
  }, [hosts, statusFilter, searchQuery, sortMode]);

  const handleResetFilters = () => {
    setSearchQuery('');
    onStatusFilterChange('All');
    setSortMode('default');
  };

  const renderEmptyState = () => {
    if (hosts.length === 0) {
      return <AgencyEmptyState kind="no_hosts" onAction={onRestoreHosts} />;
    }
    if (searchQuery.trim().length > 0) {
      return (
        <AgencyEmptyState
          kind="no_search_results"
          onAction={handleResetFilters}
          actionLabel="Clear Search"
        />
      );
    }
    if (statusFilter === 'Active') {
      return (
        <AgencyEmptyState
          kind="no_active_hosts"
          onAction={() => onStatusFilterChange('All')}
        />
      );
    }
    if (statusFilter === 'Pending') {
      return (
        <AgencyEmptyState
          kind="no_pending_hosts"
          onAction={() => onStatusFilterChange('All')}
        />
      );
    }
    return (
      <AgencyEmptyState
        kind="no_search_results"
        onAction={handleResetFilters}
        actionLabel="Reset Filters"
      />
    );
  };

  return (
    <div className="space-y-4" data-testid="host-management-section">
      {/* Header + Search & Filters */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/35 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#FF6BA3]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Host Management</h2>
              <p className="text-[11px] text-purple-200/75">
                {hosts.length} sample host records · Status tags are demo UI only
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSortMode((prev) =>
                prev === 'default'
                  ? 'name_asc'
                  : prev === 'name_asc'
                  ? 'sessions_desc'
                  : 'default'
              )
            }
            data-testid="host-sort-toggle"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#120624] border border-purple-400/25 text-[11px] font-bold text-purple-100 hover:border-[#FF2E93]/50 transition self-start sm:self-auto"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF6BA3]" />
            {sortMode === 'default'
              ? 'Sort: Roster Order'
              : sortMode === 'name_asc'
              ? 'Sort: Name A → Z'
              : 'Sort: Most Active'}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-purple-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="host-search-input"
            placeholder="Search hosts by name, @handle, or Host ID (e.g. PL-88401)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-[#120624] border border-purple-400/25 text-xs sm:text-sm text-white placeholder:text-purple-300/45 focus:outline-none focus:border-[#FF2E93]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear host search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusFilterChange(status)}
                data-testid={`host-filter-${status.toLowerCase()}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                  active
                    ? 'bg-[#FF2E93] text-white border-[#FF2E93] shadow-[0_6px_18px_rgba(255,46,147,0.35)]'
                    : 'bg-[#120624] text-purple-200/80 border-purple-400/20 hover:border-purple-300/40'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    active ? 'bg-black/20 text-white' : 'bg-white/5 text-purple-300/80'
                  }`}
                >
                  {statusCounts[status]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results: Desktop Table + Mobile/Tablet Cards */}
      {visibleHosts.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {/* Desktop Table (lg and up) */}
          <div className="hidden lg:block rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 overflow-hidden shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" data-testid="host-management-table">
                <thead>
                  <tr className="border-b border-white/10 bg-[#120624]/80 text-[10px] font-bold uppercase tracking-wider text-purple-300/70">
                    <th className="py-3 px-3">Host</th>
                    <th className="py-3 px-2.5 whitespace-nowrap">Host ID</th>
                    <th className="py-3 px-2.5">Status</th>
                    <th className="py-3 px-2.5 whitespace-nowrap">Joined</th>
                    <th className="py-3 px-2.5">Activity</th>
                    <th className="py-3 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {visibleHosts.map((host) => (
                    <tr
                      key={host.hostId}
                      data-testid={`host-row-${host.hostId}`}
                      className="hover:bg-white/[0.03] transition"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar src={host.avatarUrl} alt={host.username} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-white truncate max-w-[115px]">
                                {host.username}
                              </span>
                              {host.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-purple-200/70 truncate">
                              {host.handle} · {host.taskLevelCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-[11px] text-amber-200 whitespace-nowrap">
                        {host.hostId}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${getHostStatusBadgeStyle(
                            host.status
                          )}`}
                        >
                          {host.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-[11px] text-purple-100/85 whitespace-nowrap">
                        {host.joiningDate}
                      </td>
                      <td className="py-2.5 px-2.5 text-[11px] text-purple-200/80 max-w-[140px] truncate">
                        {host.activityStatusLabel}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectHost(host.hostId)}
                          data-testid={`view-host-btn-${host.hostId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF2E93]/15 hover:bg-[#FF2E93] border border-[#FF2E93]/40 text-[11px] font-bold text-pink-200 hover:text-white transition whitespace-nowrap"
                        >
                          Details
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Tablet Card List */}
          <div className="lg:hidden space-y-2.5" data-testid="host-management-cards">
            {visibleHosts.map((host) => (
              <div
                key={host.hostId}
                data-testid={`host-card-${host.hostId}`}
                className="rounded-2xl bg-[#1A0B2E]/95 border border-purple-400/20 p-3.5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={host.avatarUrl} alt={host.username} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white truncate">
                          {host.username}
                        </span>
                        {host.verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-purple-200/70 truncate">
                        {host.handle} · <span className="font-mono text-amber-200">{host.hostId}</span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${getHostStatusBadgeStyle(
                      host.status
                    )}`}
                  >
                    {host.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-200/75 pt-2 border-t border-white/5">
                  <div>
                    <div>Joined: {host.joiningDate}</div>
                    <div className="text-purple-300/80 mt-0.5">{host.activityStatusLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectHost(host.hostId)}
                    data-testid={`view-host-card-btn-${host.hostId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FF2E93]/20 hover:bg-[#FF2E93] border border-[#FF2E93]/40 text-[11px] font-bold text-white transition"
                  >
                    View Host Details
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
