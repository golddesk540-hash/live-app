import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit3,
  DollarSign,
  Calendar,
  Building2,
  Store,
  User,
  RotateCcw,
} from 'lucide-react';
import {
  PayoutRecord,
  PayoutStatus,
  PayoutAccountType,
} from './agencySellerPayoutTypes';
import { AgencySellerPayoutEmptyStates } from './AgencySellerPayoutEmptyStates';

interface PayoutRequestsViewProps {
  payouts: PayoutRecord[];
  onOpenPayoutDetails: (payout: PayoutRecord) => void;
  onOpenReviewModal: (payout: PayoutRecord) => void;
}

export const PayoutRequestsView: React.FC<PayoutRequestsViewProps> = ({
  payouts,
  onOpenPayoutDetails,
  onOpenReviewModal,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PayoutStatus>('All');
  const [accountTypeFilter, setAccountTypeFilter] = useState<'All' | PayoutAccountType>('All');
  const [sortField, setSortField] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter & Sort
  const filteredPayouts = useMemo(() => {
    return payouts.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.id.toLowerCase().includes(q) ||
        item.accountId.toLowerCase().includes(q) ||
        item.accountName.toLowerCase().includes(q) ||
        item.accountHolderName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesType = accountTypeFilter === 'All' || item.accountType === accountTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => {
      if (sortField === 'newest') return b.requestDate.localeCompare(a.requestDate);
      if (sortField === 'oldest') return a.requestDate.localeCompare(b.requestDate);
      if (sortField === 'amount_desc') return b.requestedDemoAmountUsd - a.requestedDemoAmountUsd;
      if (sortField === 'amount_asc') return a.requestedDemoAmountUsd - b.requestedDemoAmountUsd;
      return 0;
    });
  }, [payouts, searchQuery, statusFilter, accountTypeFilter, sortField]);

  // Pagination
  const totalPages = Math.ceil(filteredPayouts.length / pageSize) || 1;
  const paginatedPayouts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayouts.slice(start, start + pageSize);
  }, [filteredPayouts, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setAccountTypeFilter('All');
    setSortField('newest');
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
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-pink-400" />
            Payout & Disbursement Requests
          </h2>
          <p className="text-xs text-purple-300 mt-1">
            Review, verify, and adjudicate pending partner withdrawal claims ({filteredPayouts.length} requests)
          </p>
        </div>

        {/* View Switcher */}
        <div className="p-1 bg-black/40 border border-purple-500/30 rounded-xl flex items-center">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'table' ? 'bg-pink-600 text-white' : 'text-purple-300 hover:text-white'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'card' ? 'bg-pink-600 text-white' : 'text-purple-300 hover:text-white'
            }`}
            title="Card View"
          >
            <Grid className="w-4 h-4" />
          </button>
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
              placeholder="Search by Request ID, Account ID, or Name..."
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
              <option value="All">All Request Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
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

          {/* Sort Filter */}
          <div>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="amount_desc">Highest Demo Amount</option>
              <option value="amount_asc">Lowest Demo Amount</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || statusFilter !== 'All' || accountTypeFilter !== 'All') && (
          <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-xs">
            <span className="text-purple-300">
              Active Filters applied ({filteredPayouts.length} results)
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

      {/* Main Content: Table or Card View */}
      {filteredPayouts.length === 0 ? (
        <AgencySellerPayoutEmptyStates
          kind={searchQuery || statusFilter !== 'All' ? 'no_search_results' : 'no_payout_requests'}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20 bg-black/40">
          <table className="w-full text-left text-xs text-purple-200">
            <thead className="bg-[#17082f] text-[11px] uppercase tracking-wider text-purple-300 border-b border-purple-500/20">
              <tr>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Account & Entity</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Requested Demo Amount</th>
                <th className="py-3 px-4">Payment Channel</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {paginatedPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-purple-900/15 transition">
                  <td className="py-3 px-4 font-mono font-bold text-pink-400">
                    #{payout.id}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{payout.accountName}</p>
                    <p className="text-[11px] text-purple-400 font-mono">
                      {payout.accountId} • {payout.accountHolderName}
                    </p>
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
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">{payout.paymentMethodPlaceholder}</p>
                    <p className="text-[11px] text-purple-400 font-mono">
                      {payout.maskedAccountIdentifier}
                    </p>
                  </td>
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
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenPayoutDetails(payout)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-medium transition cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => onOpenReviewModal(payout)}
                        className="px-2.5 py-1.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 text-xs font-semibold transition cursor-pointer"
                        title="Adjudicate Review"
                      >
                        Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedPayouts.map((payout) => (
            <div
              key={payout.id}
              className="p-4 rounded-2xl bg-[#190930]/90 border border-purple-500/20 hover:border-pink-500/40 transition shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-pink-400">#{payout.id}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(
                    payout.status
                  )}`}
                >
                  {payout.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">{payout.accountName}</h3>
                <p className="text-xs text-purple-300">{payout.accountType} • {payout.accountId}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-purple-500/15">
                <p className="text-xs text-purple-400">Requested Amount:</p>
                <p className="text-base font-bold text-emerald-400">
                  ${payout.requestedDemoAmountUsd.toLocaleString()} USD
                </p>
                <p className="text-[10px] text-purple-300/80 font-mono mt-0.5 truncate">
                  {payout.paymentMethodPlaceholder}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenPayoutDetails(payout)}
                  className="flex-1 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-semibold text-center transition cursor-pointer"
                >
                  Inspect
                </button>
                <button
                  onClick={() => onOpenReviewModal(payout)}
                  className="flex-1 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold text-center transition cursor-pointer shadow-md shadow-pink-600/20"
                >
                  Adjudicate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-purple-500/20 text-xs">
          <span className="text-purple-300">
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredPayouts.length} total)
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
