'use client';

import React, { useMemo, useState } from 'react';
import { UserHostEmptyStates } from './UserHostEmptyStates';
import { AccountStatus, HostProfileRecord } from './userHostTypes';

interface AllHostsViewProps {
  hosts: HostProfileRecord[];
  onViewHostDetails: (host: HostProfileRecord) => void;
  onChangeHostStatusClick: (host: HostProfileRecord) => void;
  onBulkChangeHostStatus: (hostIds: string[], nextStatus: AccountStatus) => void;
  initialStatusFilter?: string;
  initialActivityFilter?: string;
}

export const AllHostsView: React.FC<AllHostsViewProps> = ({
  hosts,
  onViewHostDetails,
  onChangeHostStatusClick,
  onBulkChangeHostStatus,
  initialStatusFilter = 'All',
  initialActivityFilter = 'All',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter);
  const [selectedActivity, setSelectedActivity] = useState<string>(initialActivityFilter);
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'reg_desc' | 'followers_desc' | 'hours_desc' | 'user_asc'>('reg_desc');
  const [selectedHostIds, setSelectedHostIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Extract distinct countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    hosts.forEach((h) => set.add(h.country));
    return Array.from(set).sort();
  }, [hosts]);

  // Filter & sort logic
  const filteredHosts = useMemo(() => {
    return hosts
      .filter((h) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const inUser = h.username.toLowerCase().includes(q);
          const inId = h.id.toLowerCase().includes(q);
          const inLinked = h.linkedUserId.toLowerCase().includes(q);
          const inNick = h.nickname.toLowerCase().includes(q);
          const inAgency = h.agencyName.toLowerCase().includes(q);
          if (!inUser && !inId && !inLinked && !inNick && !inAgency) return false;
        }

        if (selectedStatus !== 'All' && h.hostStatus !== selectedStatus) return false;
        if (selectedActivity !== 'All' && h.activityStatus !== selectedActivity) return false;
        if (selectedCountry !== 'All' && h.country !== selectedCountry) return false;
        if (selectedTier !== 'All' && h.taskLevelTier !== selectedTier) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reg_desc') return b.registrationDate.localeCompare(a.registrationDate);
        if (sortBy === 'followers_desc') return b.followersCount - a.followersCount;
        if (sortBy === 'hours_desc') return b.totalLiveHours - a.totalLiveHours;
        if (sortBy === 'user_asc') return a.username.localeCompare(b.username);
        return 0;
      });
  }, [hosts, searchQuery, selectedStatus, selectedActivity, selectedCountry, selectedTier, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredHosts.length / pageSize) || 1;
  const paginatedHosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHosts.slice(start, start + pageSize);
  }, [filteredHosts, currentPage]);

  // Bulk selection helpers
  const isAllVisibleSelected =
    paginatedHosts.length > 0 && paginatedHosts.every((h) => selectedHostIds.includes(h.id));

  const handleToggleSelectAllVisible = () => {
    if (isAllVisibleSelected) {
      setSelectedHostIds((prev) => prev.filter((id) => !paginatedHosts.some((h) => h.id === id)));
    } else {
      const toAdd = paginatedHosts.map((h) => h.id).filter((id) => !selectedHostIds.includes(id));
      setSelectedHostIds((prev) => [...prev, ...toAdd]);
    }
  };

  const handleToggleSelectHost = (id: string) => {
    setSelectedHostIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedActivity('All');
    setSelectedCountry('All');
    setSelectedTier('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5" id="all-hosts-view">
      {/* Search & Filter Toolbar */}
      <div className="p-4 md:p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by host username, host ID (H300...), linked user ID..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Host Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Standing</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Activity Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedActivity}
              onChange={(e) => {
                setSelectedActivity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Broadcasts</option>
              <option value="Live Now">Live Now</option>
              <option value="In Party Room">In Party Room</option>
              <option value="Idle">Idle</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          {/* Country Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Countries ({countries.length})</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
            >
              <option value="reg_desc">Newest Hosts</option>
              <option value="followers_desc">Top Followers</option>
              <option value="hours_desc">Most Live Hours</option>
              <option value="user_asc">Username (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Task Level Tier Filter Pills & Counts */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/15">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium mr-1">Task Tier:</span>
            {['All', 'S', 'A', 'B', 'C'].map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  selectedTier === tier
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-[#0E061E]/80 text-zinc-400 border-purple-500/20 hover:border-purple-400 hover:text-white'
                }`}
              >
                {tier === 'All' ? 'All Tiers' : `Tier ${tier}`}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-400">
            Showing <strong className="text-pink-400">{filteredHosts.length}</strong> of{' '}
            {hosts.length} creators
            {(searchQuery ||
              selectedStatus !== 'All' ||
              selectedActivity !== 'All' ||
              selectedCountry !== 'All' ||
              selectedTier !== 'All') && (
              <button
                onClick={handleResetFilters}
                className="ml-3 text-pink-400 hover:text-pink-300 underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedHostIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 to-[#160A2D] border border-pink-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs font-bold text-white">
              {selectedHostIds.length} {selectedHostIds.length === 1 ? 'host' : 'hosts'} selected
            </span>
            <button
              onClick={() => setSelectedHostIds([])}
              className="text-xs text-zinc-400 hover:text-white underline"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Bulk demo action:</span>
            <button
              onClick={() => onBulkChangeHostStatus(selectedHostIds, 'Active')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              Set Active
            </button>
            <button
              onClick={() => onBulkChangeHostStatus(selectedHostIds, 'Suspended')}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              Set Suspended
            </button>
            <button
              onClick={() => onBulkChangeHostStatus(selectedHostIds, 'Inactive')}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              Set Inactive
            </button>
          </div>
        </div>
      )}

      {/* Host Records Table / Card List */}
      {filteredHosts.length === 0 ? (
        <UserHostEmptyStates
          kind={searchQuery ? 'no_search_results' : 'no_hosts'}
          onReset={handleResetFilters}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0E061E]/80 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-purple-500/20">
                  <tr>
                    <th scope="col" className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        onChange={handleToggleSelectAllVisible}
                        className="w-4 h-4 rounded text-pink-500 bg-[#0E061E] border-purple-500/40 focus:ring-pink-500"
                      />
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Host Profile
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Host & User ID
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Country & Agency
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Tier & Hours
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Broadcast Activity
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Standing
                    </th>
                    <th scope="col" className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {paginatedHosts.map((host) => {
                    const isSelected = selectedHostIds.includes(host.id);

                    return (
                      <tr
                        key={host.id}
                        className={`hover:bg-purple-900/15 transition-colors ${
                          isSelected ? 'bg-purple-950/30' : ''
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectHost(host.id)}
                            className="w-4 h-4 rounded text-pink-500 bg-[#0E061E] border-purple-500/40 focus:ring-pink-500"
                          />
                        </td>

                        {/* Profile Info */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={host.avatar}
                                alt={host.username}
                                className="w-10 h-10 rounded-2xl object-cover border border-purple-500/40"
                              />
                              {host.activityStatus === 'Live Now' && (
                                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping border border-[#160A2D]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate max-w-[140px]">
                                {host.username}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                                {host.nickname}
                              </div>
                              <div className="text-[10px] text-pink-400 font-mono">
                                {host.followersCount.toLocaleString()} fans
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Host ID & Linked User ID */}
                        <td className="px-4 py-3.5 font-mono">
                          <div className="text-pink-300 font-bold">{host.id}</div>
                          <div className="text-[10px] text-zinc-500">Linked: {host.linkedUserId}</div>
                        </td>

                        {/* Country & Agency */}
                        <td className="px-4 py-3.5 text-zinc-300">
                          <div>{host.country}</div>
                          <div className="text-[10px] text-zinc-400 font-medium truncate max-w-[130px]">
                            {host.agencyName}
                          </div>
                        </td>

                        {/* Tier & Live Hours */}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/30">
                            {host.hostLevel}
                          </span>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            {host.totalLiveHours} hrs streamed
                          </div>
                        </td>

                        {/* Broadcast Activity */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                              host.activityStatus === 'Live Now'
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-[0_0_8px_rgba(255,15,123,0.3)]'
                                : host.activityStatus === 'In Party Room'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                host.activityStatus === 'Live Now'
                                  ? 'bg-pink-400 animate-pulse'
                                  : host.activityStatus === 'In Party Room'
                                  ? 'bg-purple-400'
                                  : 'bg-zinc-500'
                              }`}
                            />
                            {host.activityStatus}
                          </span>
                        </td>

                        {/* Standing Status */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                              host.hostStatus === 'Active'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : host.hostStatus === 'Suspended'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : host.hostStatus === 'Pending'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {host.hostStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onViewHostDetails(host)}
                              className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => onChangeHostStatusClick(host)}
                              className="px-2.5 py-1 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-pink-300 text-xs font-semibold border border-purple-500/20 transition-colors"
                            >
                              Status
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

          {/* Mobile Card List View (Tablets & Phones) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3.5">
            {paginatedHosts.map((host) => {
              const isSelected = selectedHostIds.includes(host.id);

              return (
                <div
                  key={host.id}
                  className={`p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/20 backdrop-blur-md shadow-lg space-y-3 ${
                    isSelected ? 'border-pink-500/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectHost(host.id)}
                        className="w-4 h-4 rounded text-pink-500 bg-[#0E061E] border-purple-500/40 focus:ring-pink-500"
                      />
                      <img
                        src={host.avatar}
                        alt={host.username}
                        className="w-12 h-12 rounded-2xl object-cover border border-purple-500/40 flex-shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">{host.username}</div>
                        <div className="text-xs font-mono text-pink-400 mt-0.5">
                          {host.id} • {host.hostLevel}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono">
                          Linked: {host.linkedUserId}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        host.hostStatus === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : host.hostStatus === 'Suspended'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : host.hostStatus === 'Pending'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {host.hostStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-300 pt-2 border-t border-purple-500/15">
                    <span>
                      Agency: <strong>{host.agencyName}</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        host.activityStatus === 'Live Now'
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {host.activityStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-500/15">
                    <button
                      onClick={() => onViewHostDetails(host)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onChangeHostStatusClick(host)}
                      className="px-3 py-1.5 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-pink-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                    >
                      Change Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-3 text-xs text-zinc-400">
            <div>
              Page <strong className="text-white">{currentPage}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong> ({filteredHosts.length} total)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-[#0E061E] hover:bg-purple-950/40 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 border border-purple-500/25 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(255,15,123,0.4)]'
                      : 'bg-[#0E061E] text-zinc-400 hover:text-white border border-purple-500/20'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-[#0E061E] hover:bg-purple-950/40 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 border border-purple-500/25 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
