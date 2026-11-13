'use client';

import React, { useMemo, useState } from 'react';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminActivityItem } from './types';

interface AdminActivitySectionProps {
  activityLogs: AdminActivityItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  profile: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  roles: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  permissions: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  status: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  dashboard: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  security: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export const AdminActivitySection: React.FC<AdminActivitySectionProps> = ({ activityLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const categories = [
    { key: 'all', label: 'All Activities' },
    { key: 'roles', label: 'Roles' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'status', label: 'Status' },
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inAdmin = log.adminName.toLowerCase().includes(q);
        const inTitle = log.actionTitle.toLowerCase().includes(q);
        const inDetails = log.details.toLowerCase().includes(q);
        const inRole = log.adminRole.toLowerCase().includes(q);
        if (!inAdmin && !inTitle && !inDetails && !inRole) {
          return false;
        }
      }
      return true;
    });
  }, [activityLogs, selectedCategory, searchQuery]);

  const handleExportCSV = () => {
    // Generate simulated CSV string
    const headers = 'ID,Admin,Role,Action,Details,Date,Time,Category,Status\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.adminName}","${l.adminRole}","${l.actionTitle}","${l.details.replace(
            /"/g,
            '""'
          )}","${l.dateLabel}","${l.timeLabel}","${l.category}","${l.status}"`
      )
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);

    // Create virtual link to trigger download
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `admin_activity_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${filteredLogs.length} audit log entries.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <section className="space-y-6" id="activity-log-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              Admin Activity & Audit Trail
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Tamper-evident record of administrative actions, role updates, and privilege assignments.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0E061E] hover:bg-purple-950/40 text-pink-300 border border-purple-500/30 text-xs font-semibold shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="w-full md:flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity by admin name, action, or details..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
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

          <div className="text-xs text-zinc-400 whitespace-nowrap">
            Showing <strong className="text-pink-400">{filteredLogs.length}</strong> of{' '}
            {activityLogs.length} events
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-500/15">
          <span className="text-xs text-zinc-400 font-medium mr-1">Category:</span>
          {categories.map((c) => {
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_12px_rgba(255,15,123,0.4)]'
                    : 'bg-[#0E061E]/80 text-zinc-400 border-purple-500/20 hover:border-purple-400 hover:text-zinc-200'
                }`}
              >
                {c.label}
              </button>
            );
          })}

          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="ml-auto text-xs text-pink-400 hover:text-pink-300 underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Log Feed */}
      {filteredLogs.length === 0 ? (
        <AdminEmptyState
          kind="no_activity_logged"
          onReset={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const catBadge =
              CATEGORY_COLORS[log.category] || 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';

            return (
              <div
                key={log.id}
                className="p-4 md:p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-pink-500/40 transition-colors"
              >
                {/* Admin info & Action */}
                <div className="flex items-start gap-3.5">
                  <img
                    src={log.adminAvatar}
                    alt={log.adminName}
                    className="w-10 h-10 rounded-2xl object-cover border border-purple-500/40 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{log.adminName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {log.adminRole}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg border ${catBadge}`}
                      >
                        {log.category}
                      </span>
                    </div>

                    <div className="font-semibold text-zinc-100 text-xs md:text-sm mt-1">
                      {log.actionTitle}
                    </div>

                    <div className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      {log.details}
                    </div>
                  </div>
                </div>

                {/* Timestamp & Status Badge */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-purple-500/15 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-zinc-300">{log.timeLabel}</div>
                    <div className="text-[11px] text-zinc-500">{log.dateLabel}</div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]" />
                    {log.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
