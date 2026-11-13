import React, { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Coins,
  Sparkles,
  Edit3,
  RotateCcw,
  Plus,
  CheckCircle2,
  DollarSign,
  Flame,
} from 'lucide-react';
import { CoinPackageRecord, CoinPackageStatus } from './contentEconomyTypes';
import { ContentEconomyEmptyStates } from './ContentEconomyEmptyStates';

interface Props {
  packages: CoinPackageRecord[];
  onEdit: (pkg: CoinPackageRecord) => void;
  onAddNew?: () => void;
}

export const CoinPackageManagementView: React.FC<Props> = ({
  packages,
  onEdit,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesSearch =
        pkg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.nameUr && pkg.nameUr.includes(searchTerm));

      const matchesCat = selectedCategory === 'all' || pkg.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || pkg.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [packages, searchTerm, selectedCategory, selectedStatus]);

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
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Coin Recharge Packages</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              {filteredPackages.length} packages
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure platform recharge tiers, coin bonuses, and simulated currency exchange rates.
          </p>
        </div>

        {onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white shadow-md transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Package Tier</span>
          </button>
        )}
      </div>

      {/* 2. Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#120726]/90 border border-white/5">
        <div className="sm:col-span-5 relative">
          <input
            type="text"
            placeholder="Search Package by name or ID (e.g. PKG-100)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white placeholder-gray-500 focus:border-amber-500 outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Package Tiers</option>
            <option value="Starter">Starter</option>
            <option value="Popular">Popular</option>
            <option value="High Roller">High Roller</option>
            <option value="VIP Exclusive">VIP Exclusive</option>
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

      {/* 3. Package Cards Grid */}
      {filteredPackages.length === 0 ? (
        <ContentEconomyEmptyStates
          type={searchTerm || selectedCategory !== 'all' ? 'no_search_results' : 'no_packages'}
          onAction={handleResetFilters}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${
                pkg.isFeatured
                  ? 'bg-gradient-to-b from-[#21123D] to-[#160A2D] border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] hover:border-amber-400'
                  : 'bg-[#160A2D]/85 border-purple-500/20 hover:border-pink-500/40'
              }`}
            >
              {/* Badge Tag */}
              {pkg.badgeLabel && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-pink-500 text-black text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-md tracking-wider">
                  {pkg.badgeLabel}
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-pink-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors">
                      {pkg.name}
                    </h4>
                    <span className="font-mono text-[10px] text-gray-400">{pkg.id}</span>
                  </div>
                </div>

                {/* Coin Breakdown */}
                <div className="p-3.5 rounded-2xl bg-[#0B0516]/80 border border-white/5 space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Base Coins:</span>
                    <span className="font-mono font-bold text-white">
                      {pkg.coinQuantity.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3" /> Bonus Coins:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{pkg.bonusCoins.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Total Coins:
                    </span>
                    <span className="font-mono text-base font-black text-amber-300">
                      {pkg.totalCoins.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Demo Pricing */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Demo Price</span>
                    <span className="font-mono font-extrabold text-white text-sm">
                      ${pkg.demoPriceUsd.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">Local Simulation</span>
                    <span className="font-mono font-bold text-gray-300 text-xs">
                      Rs {pkg.demoPricePkr.toLocaleString()} PKR
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    pkg.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40'
                  }`}
                >
                  {pkg.status}
                </span>

                <button
                  onClick={() => onEdit(pkg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Package</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
