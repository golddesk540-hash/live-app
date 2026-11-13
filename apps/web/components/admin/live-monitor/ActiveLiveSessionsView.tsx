'use client';

import React, { useMemo, useState } from 'react';
import {
  LiveSessionCategory,
  LiveSessionRecord,
  LiveSessionStatus,
  LiveSessionType,
} from './liveMonitorTypes';
import { LiveMonitorEmptyState } from './LiveMonitorEmptyStates';

interface ActiveLiveSessionsViewProps {
  sessions: LiveSessionRecord[];
  initialCategory?: LiveSessionCategory;
  onPreviewSession: (session: LiveSessionRecord) => void;
  onViewSessionDetails: (session: LiveSessionRecord) => void;
  onBackToDashboard: () => void;
}

export const ActiveLiveSessionsView: React.FC<ActiveLiveSessionsViewProps> = ({
  sessions,
  initialCategory = 'All',
  onPreviewSession,
  onViewSessionDetails,
  onBackToDashboard,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LiveSessionCategory>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedViewerRange, setSelectedViewerRange] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'viewers_desc' | 'viewers_asc' | 'duration_desc' | 'newest'>('viewers_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 9;

  const categories: LiveSessionCategory[] = [
    'All',
    'Entertainment',
    'Music',
    'Chat',
    'Gaming',
    'Party Room',
    'Talent',
    'Other',
  ];

  // Filtering & Sorting
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const inUser = s.hostUsername.toLowerCase().includes(q);
          const inHostId = s.hostId.toLowerCase().includes(q);
          const inSessionId = s.id.toLowerCase().includes(q);
          const inRoom = s.roomNumber.includes(q);
          const inTitle = s.sessionTitle.toLowerCase().includes(q);
          if (!inUser && !inHostId && !inSessionId && !inRoom && !inTitle) return false;
        }

        // Category
        if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;

        // Status
        if (selectedStatus !== 'All' && s.status !== selectedStatus) return false;

        // Session Type
        if (selectedType !== 'All' && s.sessionType !== selectedType) return false;

        // Viewer Range
        if (selectedViewerRange === '10k_plus' && s.currentViewers < 10000) return false;
        if (selectedViewerRange === '5k_10k' && (s.currentViewers < 5000 || s.currentViewers >= 10000)) return false;
        if (selectedViewerRange === '1k_5k' && (s.currentViewers < 1000 || s.currentViewers >= 5000)) return false;
        if (selectedViewerRange === 'sub_1k' && s.currentViewers >= 1000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'viewers_desc') return b.currentViewers - a.currentViewers;
        if (sortBy === 'viewers_asc') return a.currentViewers - b.currentViewers;
        if (sortBy === 'duration_desc') return b.durationSeconds - a.durationSeconds;
        if (sortBy === 'newest') return b.startTime.localeCompare(a.startTime);
        return 0;
      });
  }, [sessions, searchQuery, selectedCategory, selectedStatus, selectedType, selectedViewerRange, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / pageSize) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSelectedType('All');
    setSelectedViewerRange('All');
    setSortBy('viewers_desc');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: LiveSessionStatus) => {
    switch (status) {
      case 'Live':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600/25 text-red-400 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span>LIVE</span>
          </span>
        );
      case 'Ending':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Ending</span>
          </span>
        );
      case 'Interrupted':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Signal Hold</span>
          </span>
        );
      case 'Ended':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
            Ended
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="active-live-sessions-view">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToDashboard}
              className="mr-1 p-2 rounded-xl bg-[#0E061E] hover:bg-purple-950/40 text-purple-300 border border-purple-500/25 transition active:scale-95"
              title="Back to Dashboard"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
              <span>Active Live Sessions ({sessions.length})</span>
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Browse all broadcast rooms, observe viewer retention, and inspect stream health.
          </p>
        </div>

        {/* View mode toggle (Grid vs Table) */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0E061E] border border-purple-500/30">
          <button
            onClick={() => setViewMode('grid')}
            data-testid="viewmode-grid-btn"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Card Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            data-testid="viewmode-table-btn"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Bar */}
      <div className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-xl backdrop-blur-md space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <svg
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search host, ID, room, title..."
              className="w-full pl-10 pr-3 py-2 rounded-2xl bg-[#0E061E] border border-purple-500/30 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-[#0E061E] border border-purple-500/30 text-xs text-zinc-200 focus:outline-none focus:border-pink-500"
          >
            <option value="All">All Statuses</option>
            <option value="Live">Live Only</option>
            <option value="Ending">Ending Soon</option>
            <option value="Interrupted">Interrupted / Signal Hold</option>
          </select>

          {/* Session Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-[#0E061E] border border-purple-500/30 text-xs text-zinc-200 focus:outline-none focus:border-pink-500"
          >
            <option value="All">All Session Types</option>
            <option value="Public">Public Stream</option>
            <option value="PK Battle">PK Battle</option>
            <option value="Party Room">Party Room</option>
            <option value="Private">Private / Agency</option>
          </select>

          {/* Audience Filter */}
          <select
            value={selectedViewerRange}
            onChange={(e) => {
              setSelectedViewerRange(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-2xl bg-[#0E061E] border border-purple-500/30 text-xs text-zinc-200 focus:outline-none focus:border-pink-500"
          >
            <option value="All">All Audiences</option>
            <option value="10k_plus">10,000+ Viewers</option>
            <option value="5k_10k">5,000 - 10,000 Viewers</option>
            <option value="1k_5k">1,000 - 5,000 Viewers</option>
            <option value="sub_1k">&lt; 1,000 Viewers</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-2xl bg-[#0E061E] border border-purple-500/30 text-xs text-zinc-200 focus:outline-none focus:border-pink-500"
          >
            <option value="viewers_desc">Highest Viewers</option>
            <option value="viewers_asc">Lowest Viewers</option>
            <option value="duration_desc">Longest Duration</option>
            <option value="newest">Newest Started</option>
          </select>
        </div>

        {/* Category Pills & Clear Button */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-purple-500/20">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition ${
                    active
                      ? 'bg-pink-500/25 text-pink-300 border border-pink-500/50'
                      : 'text-zinc-400 hover:text-white bg-[#0E061E]/80 border border-purple-500/20'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold shrink-0 transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Sessions Content: Grid or Table */}
      {filteredSessions.length === 0 ? (
        <LiveMonitorEmptyState
          kind="no_search_results"
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedSessions.map((session) => (
            <div
              key={session.id}
              data-testid={`session-grid-card-${session.hostUsername}`}
              className="rounded-3xl bg-[#160A2D]/90 border border-purple-500/25 hover:border-pink-500/50 shadow-xl overflow-hidden backdrop-blur-md transition-all group flex flex-col"
            >
              {/* Card Preview Banner */}
              <div className="relative aspect-video w-full bg-[#0E061E] overflow-hidden">
                <img
                  src={session.previewImageUrl}
                  alt={session.sessionTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#160A2D] via-transparent to-black/50 pointer-events-none" />

                {/* Top Overlay: Category & Status */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/15">
                    {session.category}
                  </span>
                  <div>{getStatusBadge(session.status)}</div>
                </div>

                {/* Bottom Overlay: Viewer count & duration */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white font-bold">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15">
                    <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{session.currentViewers.toLocaleString()}</span>
                  </div>

                  <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl text-purple-200 text-[11px] font-mono border border-white/15">
                    {session.duration}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <img
                        src={session.hostAvatar}
                        alt={session.hostUsername}
                        className="w-10 h-10 rounded-2xl object-cover border border-purple-500/40"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[8px] px-1 rounded bg-purple-900 text-purple-200 font-extrabold">
                        {session.hostTier}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-pink-300 transition truncate">
                        {session.hostUsername}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        ID: {session.hostId} · Room #{session.roomNumber}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-snug">
                    {session.sessionTitle}
                  </h3>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-500/20">
                  <button
                    onClick={() => onPreviewSession(session)}
                    className="flex-1 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => onViewSessionDetails(session)}
                    className="flex-1 py-2 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-purple-200 border border-purple-500/25 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 bg-[#0E061E]/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Room & Host</th>
                  <th className="py-3.5 px-4">Session Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Viewers</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/15 text-xs">
                {paginatedSessions.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-950/20 transition-colors">
                    {/* Room & Host */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={item.hostAvatar}
                            alt={item.hostUsername}
                            className="w-9 h-9 rounded-xl object-cover border border-purple-500/30"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{item.hostUsername}</div>
                          <div className="text-[10px] text-zinc-400">
                            #{item.roomNumber} · {item.hostId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Session Title */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-zinc-200 font-medium truncate">{item.sessionTitle}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{item.agencyName || 'Independent'}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {item.category}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 text-zinc-300 font-medium">
                      {item.sessionType}
                    </td>

                    {/* Viewers */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-pink-300">
                        {item.currentViewers.toLocaleString()}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 font-mono text-zinc-300 text-[11px]">
                      {item.duration}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onPreviewSession(item)}
                          className="px-3 py-1 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-semibold transition"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => onViewSessionDetails(item)}
                          className="px-3 py-1 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-purple-200 border border-purple-500/25 text-xs font-semibold transition"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#160A2D]/85 border border-purple-500/20 text-xs">
          <span className="text-zinc-400">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredSessions.length)} of {filteredSessions.length} sessions
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl bg-[#0E061E] border border-purple-500/30 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl bg-[#0E061E] border border-purple-500/30 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
