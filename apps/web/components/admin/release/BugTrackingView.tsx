'use client';

import React, { useState } from 'react';
import {
  Bug,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  User,
  ShieldCheck,
  Edit2,
  X,
  Layers
} from 'lucide-react';
import { BugRecord, BugPriority, BugStatus, ReleasePlatform } from './releaseTypes';
import { ReleaseEmptyStates } from './ReleaseEmptyStates';

interface BugTrackingViewProps {
  bugs: BugRecord[];
  onUpdateBug?: (updated: BugRecord) => void;
}

export const BugTrackingView: React.FC<BugTrackingViewProps> = ({ bugs, onUpdateBug }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [triageBug, setTriageBug] = useState<BugRecord | null>(null);

  const criticalBugs = bugs.filter((b) => b.priority === 'Critical' && (b.status === 'Open' || b.status === 'In Progress'));
  const highBugs = bugs.filter((b) => b.priority === 'High' && (b.status === 'Open' || b.status === 'In Progress'));
  const verifiedClosedCount = bugs.filter((b) => b.status === 'Verified' || b.status === 'Closed').length;

  const filteredBugs = bugs.filter((b) => {
    const matchesPriority = selectedPriority === 'all' || b.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.relatedModule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.assignedDeveloper.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  });

  const getPriorityBadge = (p: BugPriority) => {
    switch (p) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30 font-bold animate-pulse';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-semibold';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Low':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getStatusBadge = (s: BugStatus) => {
    switch (s) {
      case 'Verified':
      case 'Closed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Fixed':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Open':
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const handleSaveTriage = (e: React.FormEvent) => {
    e.preventDefault();
    if (triageBug && onUpdateBug) {
      onUpdateBug(triageBug);
    }
    setTriageBug(null);
  };

  return (
    <div className="space-y-6">
      {/* Zero Critical Gate Banner */}
      {criticalBugs.length === 0 ? (
        <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-slate-900/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Release Gate: Zero Critical Blockers Active!
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Store Pass Gate Clear
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                All P0 critical stability defects have been verified and closed. Platform is cleared for store rehearsal.
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-2xl font-bold font-mono text-emerald-400">0</span>
            <span className="text-xs text-slate-400 block">Critical Blocker</span>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-gradient-to-r from-red-950/40 via-purple-950/30 to-slate-900/60 border border-red-500/40 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Gate Blocked: {criticalBugs.length} Critical Issue(s) Pending Resolution
              </h3>
              <p className="text-xs text-red-300 mt-0.5">
                Release approval cannot proceed until critical blockers are fixed and verified.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Reported</span>
            <Bug className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{bugs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all modules</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{verifiedClosedCount}</div>
          <div className="text-[11px] text-emerald-500/70 mt-0.5">{Math.round((verifiedClosedCount / bugs.length) * 100)}% resolved</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>High Priority</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400 font-mono mt-1">{highBugs.length}</div>
          <div className="text-[11px] text-orange-400/70 mt-0.5">Non-blocking minor issues</div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Blockers</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${criticalBugs.length === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {criticalBugs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Zero tolerance gate</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
              <Bug className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Defect Tracking & Triage Console
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-normal">
                  22 Tickets Logged
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Triage issue status, assign developers, verify regression fixes, and track build milestone alignment.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-purple-800/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by bug ID (BUG-801), module, developer, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-purple-800/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-purple-400" /> Priority:
              {['all', 'Critical', 'High', 'Medium', 'Low'].map((pri) => (
                <button
                  key={pri}
                  onClick={() => setSelectedPriority(pri)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    selectedPriority === pri
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                      : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                  }`}
                >
                  {pri === 'all' ? 'All' : pri}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-purple-800/30 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              Status:
              {['all', 'Open', 'In Progress', 'Fixed', 'Verified', 'Closed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    selectedStatus === st
                      ? 'bg-pink-600/30 text-pink-200 border border-pink-500/40'
                      : 'bg-slate-800/40 text-slate-400 hover:text-white border border-slate-700/30'
                  }`}
                >
                  {st === 'all' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bug Table */}
      {filteredBugs.length === 0 ? (
        <ReleaseEmptyStates
          kind="no_bugs"
          onAction={() => {
            setSelectedPriority('all');
            setSelectedStatus('all');
            setSearchQuery('');
          }}
          actionLabel="Clear Filters"
        />
      ) : (
        <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/40 text-slate-400 uppercase tracking-wider border-b border-purple-800/30">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Bug ID & Title</th>
                  <th className="py-3.5 px-4 font-semibold">Module & Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Priority</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Assignee</th>
                  <th className="py-3.5 px-4 font-semibold">Fixed In Build</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-800/20 text-slate-300">
                {filteredBugs.map((bug) => (
                  <tr key={bug.id} className="hover:bg-purple-900/20 transition group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-pink-400 font-bold">
                          {bug.id}
                        </span>
                        <span className="font-bold text-white text-xs group-hover:text-pink-300 transition">
                          {bug.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-sm">
                        {bug.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-purple-950/70 border border-purple-800/30 text-purple-300">
                        {bug.relatedModule}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{bug.platform}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityBadge(bug.priority)}`}>
                        {bug.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(bug.status)}`}>
                        {bug.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-purple-400" />
                        <span>{bug.assignedDeveloper}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{bug.reportedDate}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {bug.fixedInBuild || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setTriageBug({ ...bug })}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-pink-900/40 text-slate-300 hover:text-pink-300 border border-slate-700/40 text-xs font-medium transition"
                      >
                        Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bug Triage Modal */}
      {triageBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-pink-700/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setTriageBug(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400">
                <Bug className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Triage Bug: {triageBug.id}
                </h3>
                <p className="text-xs text-slate-400">
                  {triageBug.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Issue Description</label>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-purple-800/30 text-slate-200">
                  {triageBug.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Priority Level</label>
                  <select
                    value={triageBug.priority}
                    onChange={(e) => setTriageBug({ ...triageBug, priority: e.target.value as BugPriority })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Critical">Critical (P0 - Blocker)</option>
                    <option value="High">High (P1)</option>
                    <option value="Medium">Medium (P2)</option>
                    <option value="Low">Low (P3)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Resolution Status</label>
                  <select
                    value={triageBug.status}
                    onChange={(e) => setTriageBug({ ...triageBug, status: e.target.value as BugStatus })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Verified">Verified</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Assigned Developer</label>
                  <input
                    type="text"
                    value={triageBug.assignedDeveloper}
                    onChange={(e) => setTriageBug({ ...triageBug, assignedDeveloper: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Fixed in Build Ref</label>
                  <input
                    type="text"
                    value={triageBug.fixedInBuild || ''}
                    placeholder="e.g. BLD-10901"
                    onChange={(e) => setTriageBug({ ...triageBug, fixedInBuild: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Resolution & QA Notes</label>
                <textarea
                  rows={3}
                  value={triageBug.resolutionNotes || ''}
                  onChange={(e) => setTriageBug({ ...triageBug, resolutionNotes: e.target.value })}
                  placeholder="Detail root cause analysis and verification criteria..."
                  className="w-full px-3 py-2 bg-slate-950/80 border border-purple-800/40 rounded-xl text-white focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-800/30">
                <button
                  type="button"
                  onClick={() => setTriageBug(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-md shadow-pink-500/25"
                >
                  Save Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
