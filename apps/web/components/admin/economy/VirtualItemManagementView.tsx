import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Coins,
  Edit3,
  Eye,
  RotateCcw,
  Grid,
  List,
  Plus,
} from 'lucide-react';
import { VirtualItemRecord, VirtualItemStatus } from './contentEconomyTypes';
import { ContentEconomyEmptyStates } from './ContentEconomyEmptyStates';

interface Props {
  items: VirtualItemRecord[];
  onEdit: (item: VirtualItemRecord) => void;
  onPreview: (item: VirtualItemRecord) => void;
  onAddNew?: () => void;
}

export const VirtualItemManagementView: React.FC<Props> = ({
  items,
  onEdit,
  onPreview,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nameUr && item.nameUr.includes(searchTerm));

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedStatus]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Virtual Items Management</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {filteredItems.length} items
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Administer avatar profile frames, entrance animations, chat bubbles and VIP themes.
          </p>
        </div>

        {onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Virtual Item</span>
          </button>
        )}
      </div>

      {/* 2. Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#120726]/90 border border-white/5">
        <div className="sm:col-span-5 relative">
          <input
            type="text"
            placeholder="Search Virtual item by name or ID (e.g. VRT-FRM-01)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white placeholder-gray-500 focus:border-cyan-500 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Item Slots</option>
            <option value="profile_frame">Profile Frames</option>
            <option value="entrance_effect">Entrance Effects</option>
            <option value="chat_decoration">Chat Bubbles</option>
            <option value="name_decoration">Name Plates</option>
            <option value="special_badge">Special Badges</option>
            <option value="theme">Room Themes</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Inactive">Inactive</option>
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

      {/* 3. Items Grid */}
      {filteredItems.length === 0 ? (
        <ContentEconomyEmptyStates
          type={searchTerm || selectedCategory !== 'all' ? 'no_search_results' : 'no_virtual_items'}
          onAction={handleResetFilters}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/20 hover:border-cyan-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10 mb-3 flex items-center justify-center p-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500 text-black shadow-sm">
                    {item.categoryLabel}
                  </span>
                  <span
                    className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      item.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {item.name}
                </h4>

                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    {item.coinValue.toLocaleString()} Coins
                  </span>
                  <span className="font-mono text-[10px] text-gray-400">{item.durationLabel}</span>
                </div>

                <p className="text-[11px] text-gray-400 line-clamp-2 mt-2 leading-snug">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                <span className="font-mono">{item.id}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onPreview(item)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
