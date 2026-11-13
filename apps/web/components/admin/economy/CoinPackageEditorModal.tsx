import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Coins,
  DollarSign,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CoinPackageRecord, CoinPackageStatus } from './contentEconomyTypes';

interface Props {
  pkg: CoinPackageRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CoinPackageRecord) => void;
}

export const CoinPackageEditorModal: React.FC<Props> = ({
  pkg,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<CoinPackageRecord | null>(null);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (pkg) {
      setFormData({ ...pkg });
      setIsSavedNotice(false);
    }
  }, [pkg]);

  if (!isOpen || !pkg || !formData) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const total = formData.coinQuantity + formData.bonusCoins;
    const updated: CoinPackageRecord = {
      ...formData,
      totalCoins: total,
    };
    onSave(updated);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#120726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Coin Package Editor</h3>
              <span className="font-mono text-[11px] text-gray-400">{formData.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
          {/* Top Banner Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Demo Recharge Tier: Prices and coins are simulated for frontend testing. No real payment gateways or real balance transfers are connected.
            </span>
          </div>

          {/* Name & Ur Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Package Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Urdu Title (Optional)
              </label>
              <input
                type="text"
                value={formData.nameUr || ''}
                dir="rtl"
                onChange={(e) => setFormData({ ...formData, nameUr: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
              />
            </div>
          </div>

          {/* Coin Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0F0721] border border-white/5">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Base Coins
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.coinQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coinQuantity: Math.max(1, parseInt(e.target.value) || 0),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-amber-400 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Bonus Coins
              </label>
              <input
                type="number"
                min={0}
                value={formData.bonusCoins}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bonusCoins: Math.max(0, parseInt(e.target.value) || 0),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-emerald-400 font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5">
                Total Coins (Calculated)
              </label>
              <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono font-extrabold text-xs">
                {(formData.coinQuantity + formData.bonusCoins).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Demo Price ($ USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  required
                  value={formData.demoPriceUsd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      demoPriceUsd: parseFloat(e.target.value) || 0,
                      demoPricePkr: Math.round((parseFloat(e.target.value) || 0) * 280),
                    })
                  }
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs font-mono font-bold"
                />
                <DollarSign className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Demo Price (PKR)
              </label>
              <input
                type="number"
                min="1"
                value={formData.demoPricePkr}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    demoPricePkr: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Category, Status & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs"
              >
                <option value="Starter">Starter</option>
                <option value="Popular">Popular</option>
                <option value="High Roller">High Roller</option>
                <option value="VIP Exclusive">VIP Exclusive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as CoinPackageStatus })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Badge Tag (Optional)
              </label>
              <input
                type="text"
                placeholder="POPULAR, BEST VALUE"
                value={formData.badgeLabel || ''}
                onChange={(e) => setFormData({ ...formData, badgeLabel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          {/* Toggle Flags */}
          <div className="flex items-center gap-6 p-3.5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pkgFeatured"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <label htmlFor="pkgFeatured" className="text-xs text-gray-300 font-semibold cursor-pointer">
                Featured Package
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pkgBestValue"
                checked={Boolean(formData.isBestValue)}
                onChange={(e) => setFormData({ ...formData, isBestValue: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <label htmlFor="pkgBestValue" className="text-xs text-gray-300 font-semibold cursor-pointer">
                Best Value Tag
              </label>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-[11px] text-gray-500">
              {isSavedNotice ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Package updated successfully!
                </span>
              ) : (
                'Save changes to local package state.'
              )}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Package</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
