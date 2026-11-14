import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  CreditCard,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { AdminActionAuditRecord } from './dashboardTypes';

interface RecentAdminActionsViewProps {
  actions: AdminActionAuditRecord[];
  onNavigateModule?: (section: string) => void;
}

export const RecentAdminActionsView: React.FC<RecentAdminActionsViewProps> = ({
  actions,
  onNavigateModule,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      const matchesSearch =
        act.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.targetId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || act.adminRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [actions, searchQuery, roleFilter]);

  const getRoleBadge = (role: AdminActionAuditRecord['adminRole']) => {
    switch (role) {
      case 'Super Admin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
            Super Admin
          </span>
        );
      case 'Finance Manager':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Finance Manager
          </span>
        );
      case 'Moderator':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Moderator
          </span>
        );
      case 'Content Manager':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            Content Manager
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            Support Agent
          </span>
        );
    }
  };

  return (
    <div className="space-y-4" data-testid="recent-admin-actions-view">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#1b0a33]/80 border border-purple-500/20 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Recent Admin Operations Audit</h3>
            <p className="text-[11px] text-slate-400">
              Immutable ledger of staff approvals, moderation warnings, and financial authorizations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff or action..."
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-purple-500/30 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 w-40 sm:w-52"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
          >
            <option value="ALL">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Finance Manager">Finance Manager</option>
            <option value="Moderator">Moderator</option>
            <option value="Content Manager">Content Manager</option>
            <option value="Support Agent">Support Agent</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-[#17082e] border border-purple-500/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-purple-500/20">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10 text-xs">
              {filteredActions.map((act) => (
                <tr key={act.id} className="hover:bg-purple-500/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-300 font-bold text-[10px] flex items-center justify-center">
                        {act.adminName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{act.adminName}</div>
                        <div className="mt-0.5">{getRoleBadge(act.adminRole)}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-pink-300">{act.actionType}</span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Target: {act.targetId}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-700">
                      {act.module}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300 max-w-sm">
                    <p className="line-clamp-2 leading-relaxed">{act.description}</p>
                  </td>

                  <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                    {act.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
