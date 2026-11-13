import React, { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Store,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { AdminReviewActivityItem } from './agencySellerPayoutTypes';
import { AgencySellerPayoutEmptyStates } from './AgencySellerPayoutEmptyStates';

interface AdminReviewHistoryViewProps {
  activities: AdminReviewActivityItem[];
}

export const AdminReviewHistoryView: React.FC<AdminReviewHistoryViewProps> = ({
  activities,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        act.description.toLowerCase().includes(q) ||
        act.adminName.toLowerCase().includes(q) ||
        act.relatedRecordId.toLowerCase().includes(q) ||
        act.id.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || act.activityType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [activities, searchQuery, typeFilter]);

  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredActivities.slice(start, start + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

  const activityTypes = [
    'All',
    'Agency Status Update',
    'Agency Profile Reviewed',
    'Seller Status Update',
    'Seller Profile Reviewed',
    'Payout Request Opened',
    'Payout Marked Under Review',
    'Payout Approved',
    'Payout Rejected',
    'Payout Completed',
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setCurrentPage(1);
  };

  const getActionIcon = (type: string) => {
    if (type.includes('Payout Approved') || type.includes('Payout Completed')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (type.includes('Payout Rejected')) {
      return <XCircle className="w-4 h-4 text-rose-400" />;
    }
    if (type.includes('Under Review')) {
      return <Clock className="w-4 h-4 text-blue-400" />;
    }
    if (type.includes('Agency')) {
      return <Building2 className="w-4 h-4 text-pink-400" />;
    }
    if (type.includes('Seller')) {
      return <Store className="w-4 h-4 text-purple-400" />;
    }
    return <Shield className="w-4 h-4 text-pink-400" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-pink-400" />
            Administrative Review Audit Timeline
          </h2>
          <p className="text-xs text-purple-300 mt-1">
            Immutable log of supervisor decisions, verification sign-offs, and status changes ({filteredActivities.length} logs)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by action, administrator, or record ID..."
              className="w-full pl-9 pr-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              {activityTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Audit Action Types' : t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || typeFilter !== 'All') && (
          <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-xs">
            <span className="text-purple-300">
              Active Filters applied ({filteredActivities.length} results)
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-pink-400 hover:text-pink-300 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Stream */}
      {filteredActivities.length === 0 ? (
        <AgencySellerPayoutEmptyStates
          kind="no_search_results"
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="space-y-3">
          {paginatedActivities.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 hover:border-pink-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 mt-0.5">
                  {getActionIcon(act.activityType)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">{act.activityType}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-pink-950/40 border border-pink-500/30 text-pink-300">
                      {act.relatedRecordId}
                    </span>
                    <span className="text-[11px] text-purple-400 font-mono">#{act.id}</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed">{act.description}</p>
                  <p className="text-[11px] text-purple-400 mt-1">
                    Executed by <strong className="text-pink-300">{act.adminName}</strong>
                  </p>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-xs font-mono text-purple-300 flex items-center gap-1 sm:justify-end">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  {act.timestamp}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                  Logged in Admin Audit Trail
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-purple-500/20 text-xs">
          <span className="text-purple-300">
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredActivities.length} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 disabled:opacity-40 text-purple-200 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 disabled:opacity-40 text-purple-200 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
