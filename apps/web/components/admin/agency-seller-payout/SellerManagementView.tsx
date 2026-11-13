import React, { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Edit3,
  Coins,
  DollarSign,
  Package,
  Star,
  RotateCcw,
} from 'lucide-react';
import { SellerRecord, SellerStatus, SellerType } from './agencySellerPayoutTypes';
import { AgencySellerPayoutEmptyStates } from './AgencySellerPayoutEmptyStates';

interface SellerManagementViewProps {
  sellers: SellerRecord[];
  onOpenSellerDetails: (seller: SellerRecord) => void;
  onOpenSellerStatusModal: (seller: SellerRecord) => void;
}

export const SellerManagementView: React.FC<SellerManagementViewProps> = ({
  sellers,
  onOpenSellerDetails,
  onOpenSellerStatusModal,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | SellerStatus>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | SellerType>('All');
  const [sortField, setSortField] = useState<'newest' | 'oldest' | 'sales_desc' | 'sales_asc' | 'name'>('sales_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter & Sort
  const filteredSellers = useMemo(() => {
    return sellers.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesType = typeFilter === 'All' || item.sellerType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => {
      if (sortField === 'newest') return b.registeredAt.localeCompare(a.registeredAt);
      if (sortField === 'oldest') return a.registeredAt.localeCompare(b.registeredAt);
      if (sortField === 'sales_desc') return b.totalDemoSalesAmountUsd - a.totalDemoSalesAmountUsd;
      if (sortField === 'sales_asc') return a.totalDemoSalesAmountUsd - b.totalDemoSalesAmountUsd;
      if (sortField === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [sellers, searchQuery, statusFilter, typeFilter, sortField]);

  // Pagination
  const totalPages = Math.ceil(filteredSellers.length / pageSize) || 1;
  const paginatedSellers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSellers.slice(start, start + pageSize);
  }, [filteredSellers, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setTypeFilter('All');
    setSortField('sales_desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Store className="w-6 h-6 text-pink-400" />
            Coin Seller & Reseller Management
          </h2>
          <p className="text-xs text-purple-300 mt-1">
            Authorize, monitor, and audit certified coin distributors and peer sellers ({filteredSellers.length} merchants)
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
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'grid' ? 'bg-pink-600 text-white' : 'text-purple-300 hover:text-white'
            }`}
            title="Grid View"
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
              placeholder="Search by ID, username, or name..."
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
              <option value="All">All Seller Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="All">All Merchant Tiers</option>
              <option value="Official Merchant">Official Merchant</option>
              <option value="Certified Vendor">Certified Vendor</option>
              <option value="Peer Reseller">Peer Reseller</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            >
              <option value="sales_desc">Highest Sales Amount</option>
              <option value="sales_asc">Lowest Sales Amount</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || statusFilter !== 'All' || typeFilter !== 'All') && (
          <div className="flex items-center justify-between pt-2 border-t border-purple-500/10 text-xs">
            <span className="text-purple-300">
              Active Filters applied ({filteredSellers.length} results)
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

      {/* Main Content: Table or Grid */}
      {filteredSellers.length === 0 ? (
        <AgencySellerPayoutEmptyStates
          kind={searchQuery || statusFilter !== 'All' ? 'no_search_results' : 'no_sellers'}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl border border-purple-500/20 bg-black/40">
          <table className="w-full text-left text-xs text-purple-200">
            <thead className="bg-[#17082f] text-[11px] uppercase tracking-wider text-purple-300 border-b border-purple-500/20">
              <tr>
                <th className="py-3 px-4">Merchant & ID</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Demo Sales Volume</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {paginatedSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-purple-900/15 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={seller.avatar}
                        alt={seller.name}
                        className="w-10 h-10 rounded-xl object-cover border border-purple-500/30"
                      />
                      <div>
                        <p className="font-bold text-white text-sm">{seller.name}</p>
                        <p className="text-[11px] text-pink-400">
                          @{seller.username} • <span className="font-mono text-purple-300">{seller.id}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-purple-900/40 text-purple-200 border border-purple-500/20 text-[11px]">
                      {seller.sellerType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">${seller.totalDemoSalesAmountUsd.toLocaleString()} USD</p>
                    <p className="text-[11px] text-amber-400">
                      {seller.totalCoinsSold.toLocaleString()} coins
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-white">{seller.totalOrders}</span>
                    <span className="text-purple-400 text-[10px] block">
                      ({seller.completedOrders} completed)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        seller.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : seller.status === 'Pending'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : seller.status === 'Suspended'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                      }`}
                    >
                      {seller.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenSellerDetails(seller)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-medium transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => onOpenSellerStatusModal(seller)}
                        className="p-1.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 transition cursor-pointer"
                        title="Edit Status"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedSellers.map((seller) => (
            <div
              key={seller.id}
              className="p-4 rounded-2xl bg-[#190930]/90 border border-purple-500/20 hover:border-pink-500/40 transition shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="w-12 h-12 rounded-xl object-cover border border-purple-500/30"
                />
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    seller.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : seller.status === 'Pending'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : seller.status === 'Suspended'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                  }`}
                >
                  {seller.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">{seller.name}</h3>
                <p className="text-xs text-pink-400">@{seller.username}</p>
                <p className="font-mono text-[11px] text-purple-400 mt-0.5">{seller.id} • {seller.sellerType}</p>
              </div>

              <div className="pt-2 border-t border-purple-500/15 flex items-center justify-between text-xs">
                <span className="text-purple-300">${seller.totalDemoSalesAmountUsd.toLocaleString()}</span>
                <span className="text-amber-400">{seller.totalOrders} orders</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onOpenSellerDetails(seller)}
                  className="flex-1 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-semibold text-center transition cursor-pointer"
                >
                  View Profile
                </button>
                <button
                  onClick={() => onOpenSellerStatusModal(seller)}
                  className="p-1.5 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 transition cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
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
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredSellers.length} total)
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
