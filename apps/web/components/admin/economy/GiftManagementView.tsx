import React, { useState, useMemo } from 'react';
import {
  Search,
  Gift,
  Coins,
  Sparkles,
  Eye,
  Edit3,
  RotateCcw,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
} from 'lucide-react';
import { GiftRecord, GiftCategory, GiftStatus } from './contentEconomyTypes';
import { ContentEconomyEmptyStates } from './ContentEconomyEmptyStates';

interface Props {
  gifts: GiftRecord[];
  onPreview: (g: GiftRecord) => void;
  onEdit: (g: GiftRecord) => void;
  onAddNew?: () => void;
}

export const GiftManagementView: React.FC<Props> = ({
  gifts,
  onPreview,
  onEdit,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_desc' | 'price_asc' | 'usage' | 'name_asc'>('usage');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categories: GiftCategory[] = [
    'Popular',
    'Premium',
    'Seasonal',
    'Special',
    'Luxury',
    'Romantic',
    'Other',
  ];

  const filteredGifts = useMemo(() => {
    return gifts
      .filter((g) => {
        const matchesSearch =
          g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.nameUr && g.nameUr.includes(searchTerm));

        const matchesCat = selectedCategory === 'all' || g.category === selectedCategory;
        const matchesStatus = selectedStatus === 'all' || g.status === selectedStatus;

        return matchesSearch && matchesCat && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'price_desc') return b.coinValue - a.coinValue;
        if (sortBy === 'price_asc') return a.coinValue - b.coinValue;
        if (sortBy === 'usage') return b.usageCount - a.usageCount;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [gifts, searchTerm, selectedCategory, selectedStatus, sortBy]);

  const totalPages = Math.ceil(filteredGifts.length / itemsPerPage) || 1;
  const paginatedGifts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGifts.slice(start, start + itemsPerPage);
  }, [filteredGifts, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSortBy('usage');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-400" />
            <span>Virtual Gifts Management</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
              {filteredGifts.length} gifts
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Administer live room particle animations, categories and coin valuations (all labeled demo).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {onAddNew && (
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Demo Gift</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search & Filtering Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#120726]/90 border border-white/5">
        <div className="sm:col-span-4 relative">
          <input
            type="text"
            placeholder="Search Gift name or ID (e.g. GFT-ROSE-01)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white placeholder-gray-500 focus:border-pink-500 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Gift Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="usage">Most Popular First</option>
            <option value="price_desc">Coin Price: High to Low</option>
            <option value="price_asc">Coin Price: Low to High</option>
            <option value="name_asc">Name A-Z</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={handleResetFilters}
            className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Gifts Display */}
      {filteredGifts.length === 0 ? (
        <ContentEconomyEmptyStates
          type={searchTerm || selectedCategory !== 'all' ? 'no_search_results' : 'no_gifts'}
          onAction={handleResetFilters}
          searchTerm={searchTerm}
        />
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedGifts.map((gift) => (
            <div
              key={gift.id}
              className="group p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/20 hover:border-pink-500/50 hover:bg-[#1E0D3D] transition-all duration-300 shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10 mb-3 flex items-center justify-center p-3">
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    className="w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-lg"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-pink-500 text-white shadow-sm">
                      {gift.category}
                    </span>
                    {gift.isPopular && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-black flex items-center gap-0.5 shadow-sm">
                        <Flame className="w-2.5 h-2.5" /> HOT
                      </span>
                    )}
                  </div>
                  <span
                    className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      gift.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
                    }`}
                  >
                    {gift.status}
                  </span>
                </div>

                {/* Details */}
                <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                  {gift.name}
                </h4>
                {gift.nameUr && (
                  <h5 className="text-[11px] text-pink-300/70 font-semibold" dir="rtl">
                    {gift.nameUr}
                  </h5>
                )}

                <div className="mt-2 flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{gift.coinValue.toLocaleString()} Demo Coins</span>
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1.5 leading-snug">
                  {gift.description}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                <span className="font-mono">{gift.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPreview(gift)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                    title="Live Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(gift)}
                    className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 transition-colors"
                    title="Edit Gift Details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-white/10 bg-[#120726]/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#180A30] text-[11px] uppercase tracking-wider text-purple-300 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-bold">Virtual Gift</th>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold">Demo Coin Value</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Usage Count</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedGifts.map((gift) => (
                  <tr key={gift.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={gift.imageUrl}
                          alt={gift.name}
                          className="w-10 h-10 rounded-xl object-contain bg-black/40 border border-white/10 p-1 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-pink-300 transition-colors">
                            {gift.name}
                          </div>
                          <span className="font-mono text-[10px] text-gray-400">{gift.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-gray-300">
                        {gift.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-amber-300">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-amber-400" />
                        {gift.coinValue.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          gift.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'
                        }`}
                      >
                        {gift.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-gray-300">
                      {gift.usageCount.toLocaleString()} sent
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreview(gift)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(gift)}
                          className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300"
                          title="Edit"
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
        </div>
      )}

      {/* 4. Pagination */}
      {filteredGifts.length > itemsPerPage && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#120726]/60 border border-white/5 text-xs text-gray-400">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredGifts.length)} of {filteredGifts.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-white px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
