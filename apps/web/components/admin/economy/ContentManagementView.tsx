import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Layers,
  Eye,
  Edit3,
  Calendar,
  Grid,
  List,
  Sparkles,
  RotateCcw,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ContentRecord, ContentType, ContentStatus } from './contentEconomyTypes';
import { ContentEconomyEmptyStates } from './ContentEconomyEmptyStates';

interface Props {
  contentItems: ContentRecord[];
  onPreview: (c: ContentRecord) => void;
  onEdit: (c: ContentRecord) => void;
  onAddNew?: () => void;
}

export const ContentManagementView: React.FC<Props> = ({
  contentItems,
  onPreview,
  onEdit,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'priority'>('priority');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    return contentItems
      .filter((item) => {
        const matchesSearch =
          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.titleUr && item.titleUr.includes(searchTerm));

        const matchesType = selectedType === 'all' || item.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return a.priorityOrder - b.priorityOrder;
        if (sortBy === 'newest') return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        if (sortBy === 'oldest') return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
        if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
        return 0;
      });
  }, [contentItems, searchTerm, selectedType, selectedStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSortBy('priority');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-400" />
            <span>Content & Banners Management</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
              {filteredItems.length} items
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Administer discoverability carousels, events, and announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {onAddNew && (
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Content</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#120726]/90 border border-white/5">
        {/* Search */}
        <div className="sm:col-span-4 relative">
          <input
            type="text"
            placeholder="Search by Title or ID (e.g. CNT-101)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white placeholder-gray-500 focus:border-pink-500 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        {/* Filter Type */}
        <div className="sm:col-span-3">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Content Types</option>
            <option value="Banner">Banners</option>
            <option value="Event">Events</option>
            <option value="Live Category">Live Categories</option>
            <option value="Announcement">Announcements</option>
            <option value="Promo">Promotions</option>
          </select>
        </div>

        {/* Filter Status */}
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
            <option value="Pending Review">Pending Review</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Sort */}
        <div className="sm:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="priority">Priority Order</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
          </select>
        </div>

        {/* Reset */}
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

      {/* 3. Items Rendering */}
      {filteredItems.length === 0 ? (
        <ContentEconomyEmptyStates
          type={searchTerm || selectedType !== 'all' || selectedStatus !== 'all' ? 'no_search_results' : 'no_content'}
          onAction={handleResetFilters}
          searchTerm={searchTerm}
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-2xl border border-white/10 bg-[#120726]/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#180A30] text-[11px] uppercase tracking-wider text-purple-300 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-bold">Content Item</th>
                  <th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Priority</th>
                  <th className="px-4 py-3 font-bold">Updated</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-12 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                            <span>{item.title}</span>
                            {item.isFeatured && (
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-gray-400">{item.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-gray-300">
                        {item.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-300">{item.category}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : item.status === 'Pending Review'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : item.status === 'Draft'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-white">#{item.priorityOrder}</td>

                    <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">
                      {item.updatedDate}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreview(item)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                          title="Preview Content"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 transition-colors"
                          title="Edit Content"
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20 hover:border-pink-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 mb-3">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500 text-white">
                      {item.type}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        item.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-500">{item.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPreview(item)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1 rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Pagination */}
      {filteredItems.length > itemsPerPage && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#120726]/60 border border-white/5 text-xs text-gray-400">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}
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
