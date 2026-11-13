'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Filter,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { ChildSafetyEmptyStates } from './ChildSafetyEmptyStates';
import {
  SafetyCaseRecord,
  SafetyCaseStatus,
  SafetyPriority,
} from './childSafetyTypes';

interface AgeRelatedQueueViewProps {
  cases: SafetyCaseRecord[];
  onSelectCase: (safetyCase: SafetyCaseRecord) => void;
  onOpenReviewModal: (safetyCase: SafetyCaseRecord) => void;
  onRefresh: () => void;
}

export const AgeRelatedQueueView: React.FC<AgeRelatedQueueViewProps> = ({
  cases,
  onSelectCase,
  onOpenReviewModal,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  // Filter only age-related cases
  const ageCases = cases.filter(
    (c) =>
      c.category === 'Age Verification Review' ||
      c.category === 'Underage Stream Flag' ||
      c.category === 'Suspicious Minor Profile'
  );

  const filtered = ageCases.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Age-Related Review Queue
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
              {ageCases.length} Incidents
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            KYC compliance audits, proof-of-majority verifications, and age discrepancy flags
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
          >
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3 text-xs text-blue-200">
        <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white">Privacy & Compliance Safeguard</span>
          <p className="text-blue-300/90 leading-relaxed text-[11px]">
            In compliance with strict data protection guidelines, exact numerical age is never inferred or
            displayed from unverified public accounts. All sample verification records are simulated and
            redacted for demonstration.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#1A103C]/80 border border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {['All', 'Pending', 'Under Review', 'Escalated', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter age reviews by priority level"
          className="px-3 py-1.5 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Data Table */}
      {filtered.length === 0 ? (
        <ChildSafetyEmptyStates
          type="no_age_reviews"
          onResetFilters={() => {
            setStatusFilter('All');
            setPriorityFilter('All');
          }}
          onRefresh={onRefresh}
        />
      ) : (
        <div className="rounded-2xl bg-[#1A103C]/80 border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#120A2A] text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Case ID</th>
                  <th className="py-3.5 px-3">Target Profile</th>
                  <th className="py-3.5 px-3">Account Type</th>
                  <th className="py-3.5 px-3">Review Category</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Assigned Reviewer</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        <span
                          onClick={() => onSelectCase(item)}
                          className="cursor-pointer hover:text-blue-400 hover:underline"
                        >
                          {item.id}
                        </span>
                        <div className="text-[10px] text-gray-500 font-normal">
                          {item.createdRelative}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.relatedUserAvatar}
                            alt={item.relatedUsername}
                            className="w-7 h-7 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <span className="font-bold text-white">{item.relatedUsername}</span>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {item.relatedUserId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.isHost
                              ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-300 border border-pink-500/30'
                              : 'bg-white/10 text-gray-300'
                          }`}
                        >
                          {item.isHost ? 'Broadcaster' : 'Viewer'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-blue-400 font-medium">{item.category}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.priority === 'Urgent'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : item.priority === 'High'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : item.status === 'Escalated'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-gray-300">{item.assignedReviewer}</td>

                      <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectCase(item)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
                          >
                            View Case
                          </button>
                          <button
                            onClick={() => onOpenReviewModal(item)}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-semibold transition-colors"
                          >
                            Audit
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
      )}
    </div>
  );
};
