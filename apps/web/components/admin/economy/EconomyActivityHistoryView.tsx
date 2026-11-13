import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  RotateCcw,
  Gift,
  Coins,
  Package,
  Sparkles,
  FolderTree,
  ShoppingBag,
  Settings,
  Filter,
} from 'lucide-react';
import { EconomyActivityLog, EconomyActivityType } from './contentEconomyTypes';
import { ContentEconomyEmptyStates } from './ContentEconomyEmptyStates';

interface Props {
  activityLogs: EconomyActivityLog[];
}

export const EconomyActivityHistoryView: React.FC<Props> = ({ activityLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      const matchesSearch =
        log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.relatedItemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = selectedType === 'all' || log.activityType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [activityLogs, searchTerm, selectedType]);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedType('all');
  };

  const getIconForType = (type: EconomyActivityType) => {
    switch (type) {
      case 'gift_added':
      case 'gift_updated':
        return <Gift className="w-4 h-4 text-pink-400" />;
      case 'coin_package_edited':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'virtual_item_updated':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'category_changed':
        return <FolderTree className="w-4 h-4 text-blue-400" />;
      case 'store_item_status_changed':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'economy_setting_updated':
        return <Settings className="w-4 h-4 text-purple-400" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-pink-400" />
            <span>Economy Activity History</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-mono">
              {filteredLogs.length} events
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Audit trail of gifts created, package price adjustments, and administrative governance actions.
          </p>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#120726]/90 border border-white/5">
        <div className="sm:col-span-7 relative">
          <input
            type="text"
            placeholder="Search activity by title, admin, or item ID (e.g. GFT-YACHT-04)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white placeholder-gray-500 focus:border-pink-500 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Activity Types</option>
            <option value="gift_updated">Gift Updates</option>
            <option value="gift_added">Gifts Created</option>
            <option value="coin_package_edited">Coin Package Changes</option>
            <option value="virtual_item_updated">Virtual Item Edits</option>
            <option value="category_changed">Category Changes</option>
            <option value="store_item_status_changed">Store Item Updates</option>
            <option value="economy_setting_updated">Economy Settings</option>
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

      {/* 3. Event List */}
      {filteredLogs.length === 0 ? (
        <ContentEconomyEmptyStates
          type={searchTerm || selectedType !== 'all' ? 'no_search_results' : 'no_activity'}
          onAction={handleReset}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-[#160A2D]/80 border border-purple-500/20 hover:border-pink-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {getIconForType(log.activityType)}
                </div>
                <div>
                  <div className="font-extrabold text-white flex items-center gap-2">
                    <span>{log.title}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-purple-300 border border-white/10">
                      {log.relatedItemId}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs mt-1 leading-relaxed">{log.description}</p>
                </div>
              </div>

              <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                <span className="text-[11px] font-bold text-pink-300 block">
                  {log.adminName}
                </span>
                <span className="text-[10px] text-gray-400 font-mono block">
                  {log.date} ({log.relativeTime})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
