import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Building2,
  Store,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  PayoutRecord,
  PayoutStatus,
  PayoutAccountType,
} from './agencySellerPayoutTypes';
import { AgencySellerPayoutEmptyStates } from './AgencySellerPayoutEmptyStates';

interface PayoutHistoryViewProps {
  payouts: PayoutRecord[];
  onOpenPayoutDetails: (payout: PayoutRecord) => void;
}

export const PayoutHistoryView: React.FC<PayoutHistoryViewProps> = ({
  payouts,
  onOpenPayoutDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PayoutStatus>('All');
  const [accountTypeFilter, setAccountTypeFilter] = useState<'All' | PayoutAccountType>('All');
  const [amountRange, setAmountRange] = useState<'all' | 'under1k' | '1kto3k' | 'above3k'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter & Sort
  const filteredHistory = useMemo(() => {
    return payouts.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.id.toLowerCase().includes(q) ||
        item.accountName.toLowerCase().includes(q) ||
        item.accountId.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesType = accountTypeFilter === 'All' || item.accountType === accountTypeFilter;

      let matchesAmount = true;
      if (amountRange === 'under1k') matchesAmount = item.requestedDemoAmountUsd < 1000;
      else if (amountRange === '1kto3k') matchesAmount = item.requestedDemoAmountUsd >= 1000 && item.requestedDemoAmountUsd <= 3000;
      else if (amountRange === 'above3k') matchesAmount = item.requestedDemoAmountUsd > 3000;

      return matchesSearch && matchesStatus && matchesType && matchesAmount;
    }).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }, [payouts, searchQuery, statusFilter, accountTypeFilter, amountRange]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / pageSize) || 1;
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setAccountTypeFilter('All');
    setAmountRange('all');
    setCurrentPage(1);
  };

  const getStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Completed':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Under Review':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-pink-400" />
            Payout & Settlement Audit History
          </h2>
          <p className="text-xs text-purple-300 mt-1">
            Historical ledger of all agency commissions, merchant redemptions, and host settlements ({filteredHistory.length} records)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search historical payout records..."
              className="w-full pl-9 pr-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Historical Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
              <option value="Under Review">Under Review</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Account Type Filter */}
          <div>
            <select
              value={accountTypeFilter}
              onChange={(e) => {
                setAccountTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Account Types</option>
              <option value="Agency">Agency</option>
              <option value="Coin Seller">Coin Seller</option>
              <option value="Host">Host</option>
            </select>
          </div>

          {/* Amount Range Filter */}
          <div>
            <select
              value={amountRange}
              onChange={(e) => {
                setAmountRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="all">All Demo Amounts</option>
              <option value="under1k">Under $1,000 USD</option>
              <option value="1kto3k">$1,000 - $3,000 USD</option>
              <option value="above3k">Above $3,000 USD</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || statusFilter !== 'All' || accountTypeFilter !== 'All' || amountRange !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-xs">
            <span className="text-purple-300">
              Active Filters applied ({filteredHistory.length} results)
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

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <AgencySellerPayoutEmptyStates
          kind={searchQuery || statusFilter !== 'All' ? 'no_search_results' : 'no_payout_requests'}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20 bg-black/40">
          <table className="w-full text-left text-xs text-purple-200">
            <thead className="bg-[#17082f] text-[11px] uppercase tracking-wider text-purple-300 border-b border-purple-500/20">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Beneficiary Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Requested Amount</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {paginatedHistory.map((payout) => (
                <tr key={payout.id} className="hover:bg-purple-900/15 transition">
                  <td className="py-3 px-4 font-mono font-bold text-pink-400">#{payout.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{payout.accountName}</p>
                    <p className="text-[11px] text-purple-400 font-mono">{payout.accountId}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-900/40 text-purple-200 border border-purple-500/20 text-[11px]">
                      {payout.accountType === 'Agency' ? (
                        <Building2 className="w-3 h-3 text-pink-400" />
                      ) : payout.accountType === 'Coin Seller' ? (
                        <Store className="w-3 h-3 text-pink-400" />
                      ) : (
                        <User className="w-3 h-3 text-pink-400" />
                      )}
                      {payout.accountType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-emerald-400 text-sm">
                      ${payout.requestedDemoAmountUsd.toLocaleString()} USD
                    </p>
                    <p className="text-[10px] text-purple-400">
                      Rs {payout.requestedDemoAmountPkr.toLocaleString()} PKR
                    </p>
                  </td>
                  <td className="py-3 px-4 text-purple-300">{payout.requestDate}</td>
                  <td className="py-3 px-4 text-purple-400">{payout.lastUpdated}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                        payout.status
                      )}`}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenPayoutDetails(payout)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-medium transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-purple-500/20 text-xs">
          <span className="text-purple-300">
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredHistory.length} total)
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
