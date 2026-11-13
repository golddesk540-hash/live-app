import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Search,
  Plus,
  Edit3,
  RotateCcw,
  Radio,
  Image,
  Trophy,
  Megaphone,
  Bell,
  Crown,
  Building2,
  Sparkles,
} from 'lucide-react';
import { ContentCategoryRecord, CategoryStatus } from './contentEconomyTypes';
import { ContentEconomyEmptyStates } from './ContentEconomyEmptyStates';

interface Props {
  categories: ContentCategoryRecord[];
  onAddCategory: () => void;
  onEditCategory: (cat: ContentCategoryRecord) => void;
  onToggleStatus: (catId: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Radio,
  Image,
  Trophy,
  Megaphone,
  Bell,
  Crown,
  Building2,
  Sparkles,
};

export const ContentCategoriesView: React.FC<Props> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        const matchesSearch =
          cat.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cat.nameUr && cat.nameUr.includes(searchTerm));

        const matchesStatus = selectedStatus === 'all' || cat.status === selectedStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [categories, searchTerm, selectedStatus]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-blue-400" />
            <span>Content Categories & Taxonomy</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              {filteredCategories.length} categories
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage live broadcast topics, homepage sections, and event groupings.
          </p>
        </div>

        <button
          onClick={onAddCategory}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* 2. Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#120726]/90 border border-white/5">
        <div className="sm:col-span-7 relative">
          <input
            type="text"
            placeholder="Search category name or ID (e.g. CAT-LIVE)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Category Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={handleReset}
            className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Category Cards Grid */}
      {filteredCategories.length === 0 ? (
        <ContentEconomyEmptyStates
          type={searchTerm || selectedStatus !== 'all' ? 'no_search_results' : 'no_categories'}
          onAction={handleReset}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || FolderTree;
            return (
              <div
                key={cat.id}
                className="p-5 rounded-3xl bg-[#160A2D]/85 border border-purple-500/20 hover:border-blue-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      onClick={() => onToggleStatus(cat.id)}
                      className={`cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        cat.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40 hover:bg-zinc-500/30'
                      }`}
                      title="Click to toggle status"
                    >
                      {cat.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-white group-hover:text-blue-300 transition-colors">
                    {cat.name}
                  </h4>
                  {cat.nameUr && (
                    <h5 className="text-xs text-blue-300/70 font-semibold mt-0.5" dir="rtl">
                      {cat.nameUr}
                    </h5>
                  )}

                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="font-mono text-gray-400 text-[11px]">
                    {cat.itemsCount} content items
                  </span>

                  <button
                    onClick={() => onEditCategory(cat)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-colors text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
