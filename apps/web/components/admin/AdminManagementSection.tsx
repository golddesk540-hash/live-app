'use client';

import React, { useMemo, useState } from 'react';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminRecord, AdminRoleName, AdminStatus } from './types';

interface AdminManagementSectionProps {
  admins: AdminRecord[];
  roles: AdminRoleName[];
  onAddAdminClick: () => void;
  onEditAdminClick: (admin: AdminRecord) => void;
  onViewAdminClick: (admin: AdminRecord) => void;
  onToggleStatus: (adminId: string, nextStatus: AdminStatus) => void;
  onDeleteAdmin: (adminId: string) => void;
}

const ROLE_BADGE_STYLES: Record<AdminRoleName, string> = {
  'Super Admin': 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  Admin: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  Moderator: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  'Support Agent': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'Finance Manager': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Content Manager': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const STATUS_BADGE_STYLES: Record<AdminStatus, { pill: string; dot: string }> = {
  Active: {
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
  },
  Inactive: {
    pill: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    dot: 'bg-zinc-400',
  },
  Suspended: {
    pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
  },
  Pending: {
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
  },
};

export const AdminManagementSection: React.FC<AdminManagementSectionProps> = ({
  admins,
  roles,
  onAddAdminClick,
  onEditAdminClick,
  onViewAdminClick,
  onToggleStatus,
  onDeleteAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const statusOptions: Array<'All' | AdminStatus> = ['All', 'Active', 'Inactive', 'Suspended', 'Pending'];

  // Counts for pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: admins.length };
    admins.forEach((adm) => {
      counts[adm.status] = (counts[adm.status] || 0) + 1;
    });
    return counts;
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((adm) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = adm.name.toLowerCase().includes(q);
        const matchesEmail = adm.email.toLowerCase().includes(q);
        const matchesUsername = adm.username.toLowerCase().includes(q);
        const matchesId = adm.id.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesUsername && !matchesId) {
          return false;
        }
      }

      // Role filter
      if (selectedRole !== 'All' && adm.role !== selectedRole) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && adm.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [admins, searchQuery, selectedRole, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRole('All');
    setSelectedStatus('All');
  };

  return (
    <section className="space-y-6" id="admin-management-section">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              Admin User Management
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Oversee staff credentials, departmental assignments, and role access privileges.
          </p>
        </div>

        <button
          onClick={onAddAdminClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-sm shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Admin</span>
        </button>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="p-4 md:p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, @username, email, or ID (e.g. ADM-001)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
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

          {/* Role Filter Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-zinc-200 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
            >
              <option value="All">All Roles ({admins.length})</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Metrics Badge in Bar */}
          <div className="md:col-span-3 flex items-center justify-between md:justify-end px-3 py-2 rounded-2xl bg-[#0E061E]/60 border border-purple-500/15 text-xs text-zinc-300">
            <span>Showing:</span>
            <span className="font-bold text-pink-400 ml-1">
              {filteredAdmins.length} of {admins.length} Admins
            </span>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-zinc-400 font-medium mr-1">Status:</span>
          {statusOptions.map((st) => {
            const isSelected = selectedStatus === st;
            const count = statusCounts[st] || 0;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_12px_rgba(255,15,123,0.4)]'
                    : 'bg-[#0E061E]/80 text-zinc-400 border-purple-500/20 hover:border-purple-400 hover:text-zinc-200'
                }`}
              >
                {st} <span className="opacity-70 ml-1">({count})</span>
              </button>
            );
          })}

          {(searchQuery || selectedRole !== 'All' || selectedStatus !== 'All') && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs text-pink-400 hover:text-pink-300 underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table & Card List */}
      {filteredAdmins.length === 0 ? (
        <AdminEmptyState
          kind={searchQuery ? 'no_search_results' : 'no_admins_filtered'}
          onReset={handleResetFilters}
        />
      ) : (
        <>
          {/* Desktop Responsive Table */}
          <div className="hidden lg:block overflow-hidden rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-[#0E061E]/80 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-purple-500/20">
                  <tr>
                    <th scope="col" className="px-5 py-4">
                      Admin Profile
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Role
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Department
                    </th>
                    <th scope="col" className="px-4 py-4">
                      Last Active
                    </th>
                    <th scope="col" className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {filteredAdmins.map((adm) => {
                    const roleBadge = ROLE_BADGE_STYLES[adm.role] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
                    const statusBadge = STATUS_BADGE_STYLES[adm.status];
                    const isSuper = adm.role === 'Super Admin';

                    return (
                      <tr
                        key={adm.id}
                        className="hover:bg-purple-900/15 transition-colors group"
                      >
                        {/* Profile Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={adm.avatar}
                                alt={adm.name}
                                className="w-10 h-10 rounded-2xl object-cover border border-purple-500/40"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#160A2D] ${statusBadge.dot}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white truncate max-w-[150px]">
                                  {adm.name}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                  {adm.id}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 truncate max-w-[180px]">
                                {adm.email}
                              </div>
                              <div className="text-[11px] text-pink-400/80 font-medium">
                                {adm.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold border ${roleBadge}`}
                          >
                            {adm.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${statusBadge.pill}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                            {adm.status}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-4 text-xs text-zinc-300">
                          <div>{adm.department}</div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {adm.phoneMasked}
                          </div>
                        </td>

                        {/* Last Active */}
                        <td className="px-4 py-4 text-xs text-zinc-400">
                          <div className="text-zinc-200 font-medium">{adm.lastActive}</div>
                          <div className="text-[11px] text-zinc-500">Joined {adm.createdAt}</div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <button
                              onClick={() => onViewAdminClick(adm)}
                              className="p-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/25 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                              title="View Admin Details"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => onEditAdminClick(adm)}
                              className="p-1.5 rounded-xl bg-pink-500/10 hover:bg-pink-500/25 text-pink-300 border border-pink-500/20 hover:border-pink-500/40 transition-colors"
                              title="Edit Admin"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Toggle Quick Status */}
                            {adm.status === 'Active' ? (
                              <button
                                onClick={() => onToggleStatus(adm.id, 'Inactive')}
                                className="px-2 py-1 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700 transition-colors"
                                title="Deactivate admin"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => onToggleStatus(adm.id, 'Active')}
                                className="px-2 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-[11px] text-emerald-300 border border-emerald-500/30 transition-colors"
                                title="Activate admin"
                              >
                                Activate
                              </button>
                            )}

                            {/* Delete button (or protected indicator for Super Admin) */}
                            {isSuper ? (
                              <span
                                className="p-1.5 text-zinc-600 cursor-not-allowed"
                                title="Protected Super Admin cannot be removed"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </span>
                            ) : (
                              <>
                                {confirmDeleteId === adm.id ? (
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        onDeleteAdmin(adm.id);
                                        setConfirmDeleteId(null);
                                      }}
                                      className="px-2 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-[11px] text-white font-bold"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(adm.id)}
                                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                                    title="Delete Admin Record"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (Small screens & tablets) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {filteredAdmins.map((adm) => {
              const roleBadge = ROLE_BADGE_STYLES[adm.role] || 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40';
              const statusBadge = STATUS_BADGE_STYLES[adm.status];
              const isSuper = adm.role === 'Super Admin';

              return (
                <div
                  key={adm.id}
                  className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/20 backdrop-blur-md shadow-lg space-y-3.5"
                >
                  {/* Card Header: Avatar, Name, Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={adm.avatar}
                          alt={adm.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-purple-500/40"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#160A2D] ${statusBadge.dot}`}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white text-base leading-tight">
                          {adm.name}
                        </div>
                        <div className="text-xs text-pink-400 font-medium">
                          {adm.username}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                          {adm.id} • {adm.email}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${statusBadge.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      {adm.status}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/15 text-xs text-zinc-300">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${roleBadge}`}
                    >
                      {adm.role}
                    </span>
                    <span className="text-zinc-400">
                      Dept: <strong className="text-zinc-200">{adm.department}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Last active: {adm.lastActive}</span>
                    <span>Joined: {adm.createdAt}</span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-500/15">
                    <button
                      onClick={() => onViewAdminClick(adm)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditAdminClick(adm)}
                      className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 text-xs font-semibold border border-pink-500/25 transition-colors"
                    >
                      Edit
                    </button>

                    {adm.status === 'Active' ? (
                      <button
                        onClick={() => onToggleStatus(adm.id, 'Inactive')}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-semibold transition-colors"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(adm.id, 'Active')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold border border-emerald-500/30 transition-colors"
                      >
                        Activate
                      </button>
                    )}

                    {!isSuper && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete admin record for ${adm.name}?`)) {
                            onDeleteAdmin(adm.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
