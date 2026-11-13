'use client';

import React, { useMemo, useState } from 'react';
import { LiveSessionCategory, LiveSessionHistoryRecord } from './liveMonitorTypes';
import { LiveMonitorEmptyState } from './LiveMonitorEmptyStates';

interface LiveSessionHistoryViewProps {
  historyRecords: LiveSessionHistoryRecord[];
  onBackToDashboard: () => void;
}

export const LiveSessionHistoryView: React.FC<LiveSessionHistoryViewProps> = ({
  historyRecords,
  onBackToDashboard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LiveSessionCategory>('All');
  const [selectedFinalStatus, setSelectedFinalStatus] = useState<string>('All');

  const categories: LiveSessionCategory[] = [
    'All',
    'Entertainment',
    'Music',
    'Chat',
    'Gaming',
    'Party Room',
    'Talent',
  ];

  const filteredHistory = useMemo(() => {
    return historyRecords.filter((rec) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inHost = rec.hostUsername.toLowerCase().includes(q);
        const inId = rec.id.toLowerCase().includes(q);
        const inTitle = rec.sessionTitle.toLowerCase().includes(q);
        if (!inHost && !inId && !inTitle) return false;
      }

      if (selectedCategory !== 'All' && rec.category !== selectedCategory) return false;
      if (selectedFinalStatus !== 'All' && rec.finalStatus !== selectedFinalStatus) return false;

      return true;
    });
  }, [historyRecords, searchQuery, selectedCategory, selectedFinalStatus]);

  const getFinalStatusBadge = (st: string) => {
    switch (st) {
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Completed
          </span>
        );
      case 'Ended by Host':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Ended by Host
          </span>
        );
      case 'Interrupted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Interrupted
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400">
            {st}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="live-session-history-view">
      {/* Header */}
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
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_#A855F7]" />
              <span>Live Session History ({historyRecords.length})</span>
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Archived broadcast records, historical airtimes, and aggregate audience peak telemetry.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                    : 'text-zinc-400 hover:text-white bg-[#0E061E]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archived session..."
            className="px-3.5 py-1.5 rounded-xl bg-[#0E061E] border border-purple-500/30 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
          />

          <select
            value={selectedFinalStatus}
            onChange={(e) => setSelectedFinalStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0E061E] border border-purple-500/30 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="All">All End States</option>
            <option value="Completed">Completed</option>
            <option value="Ended by Host">Ended by Host</option>
            <option value="Interrupted">Interrupted</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <LiveMonitorEmptyState
          kind="no_completed_sessions"
          customMessage="No historical sessions match your search or category filter."
          onResetFilters={() => {
            setSearchQuery('');
            setSelectedCategory('All');
            setSelectedFinalStatus('All');
          }}
        />
      ) : (
        <div className="rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-500/20 bg-[#0E061E]/80 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Session & Host</th>
                  <th className="py-3.5 px-4">Broadcast Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Start Time</th>
                  <th className="py-3.5 px-4">End Time</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Peak Audience</th>
                  <th className="py-3.5 px-4">Coins Earned</th>
                  <th className="py-3.5 px-4 text-right">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/15">
                {filteredHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rec.hostAvatar}
                          alt={rec.hostUsername}
                          className="w-8 h-8 rounded-xl object-cover border border-purple-500/30"
                        />
                        <div>
                          <div className="font-bold text-white">{rec.hostUsername}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {rec.id} · Room #{rec.roomNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-zinc-200">
                      {rec.sessionTitle}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">{rec.category}</td>
                    <td className="py-3 px-4 text-zinc-400 font-mono">{rec.startTime}</td>
                    <td className="py-3 px-4 text-zinc-400 font-mono">{rec.endTime}</td>
                    <td className="py-3 px-4 text-purple-200 font-bold font-mono">{rec.duration}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {rec.peakViewers.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-bold">
                      {rec.totalGiftsReceivedCoins.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {getFinalStatusBadge(rec.finalStatus)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
