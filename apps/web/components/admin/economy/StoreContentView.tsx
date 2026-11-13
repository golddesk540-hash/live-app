import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Coins,
  Sparkles,
  Edit3,
  Eye,
  RotateCcw,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { StoreContentRecord, VirtualItemRecord } from './contentEconomyTypes';
import { ContentEconomyEmptyStates } from './ContentEconomyEmptyStates';

interface Props {
  storeItems: StoreContentRecord[];
  onEdit: (item: VirtualItemRecord) => void;
  onPreview: (item: VirtualItemRecord) => void;
}

export const StoreContentView: React.FC<Props> = ({
  storeItems,
  onEdit,
  onPreview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredStore = useMemo(() => {
    return storeItems.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.nameUr && item.nameUr.includes(searchTerm));

      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [storeItems, searchTerm, selectedStatus]);

  // Adapter helper to convert StoreContentRecord to VirtualItemRecord for editors
  const toVirtualItem = (s: StoreContentRecord): VirtualItemRecord => ({
    id: s.id,
    name: s.name,
    nameUr: s.nameUr,
    imageUrl: s.imageUrl,
    category: s.category,
    categoryLabel: s.type,
    coinValue: s.coinPrice,
    status: s.status,
    durationLabel: s.duration,
    slotKey: s.category,
    isFeatured: s.isFeatured,
    createdDate: s.createdDate,
    soldCount: s.soldCount,
    description: s.description,
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Virtual Store Catalog</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
              {filteredStore.length} products
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Administer customer-facing virtual goods, durations, and pricing in Popo Live Store.
          </p>
        </div>
      </div>

      {/* 2. Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#120726]/90 border border-white/5">
        <div className="sm:col-span-8 relative">
          <input
            type="text"
            placeholder="Search store inventory by name or ID (e.g. STR-ITM-01)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white placeholder-gray-500 focus:border-emerald-500 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Product Statuses</option>
            <option value="Active">Active Products</option>
            <option value="Inactive">Inactive Products</option>
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all');
            }}
            className="w-full p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 flex items-center justify-center transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Product Table */}
      {filteredStore.length === 0 ? (
        <ContentEconomyEmptyStates
          type={searchTerm ? 'no_search_results' : 'no_store_content'}
          onAction={() => {
            setSearchTerm('');
            setSelectedStatus('all');
          }}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#120726]/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#180A30] text-[11px] uppercase tracking-wider text-purple-300 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-bold">Product Item</th>
                  <th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Duration</th>
                  <th className="px-4 py-3 font-bold">Demo Coin Price</th>
                  <th className="px-4 py-3 font-bold">Sold Units</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStore.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-white/10 p-0.5 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                            <span>{item.name}</span>
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

                    <td className="px-4 py-3 font-mono text-gray-300">{item.duration}</td>

                    <td className="px-4 py-3 font-mono font-bold text-amber-300">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        {item.coinPrice.toLocaleString()} Coins
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-gray-300">
                      {item.soldCount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreview(toVirtualItem(item))}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                          title="Preview Product"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(toVirtualItem(item))}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                          title="Edit Product"
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
    </div>
  );
};
