import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Coins,
  Percent,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { EconomySettingsConfig } from './contentEconomyTypes';

interface Props {
  settings: EconomySettingsConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: EconomySettingsConfig) => void;
  onReset: () => void;
}

export const EconomySettingsModal: React.FC<Props> = ({
  settings,
  isOpen,
  onClose,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<EconomySettingsConfig>({ ...settings });
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
    setIsSavedNotice(false);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#120726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Economy Parameters & Rules</h3>
              <span className="font-mono text-[11px] text-gray-400">
                CFG-ECONOMY-V10.6 · Local Simulation
              </span>
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
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-pink-500/10 border border-pink-500/25 text-pink-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Simulation Environment: Parameters govern frontend balance previews, revenue projections, and gift validation bounds.
            </span>
          </div>

          {/* 1. Host vs Platform Split */}
          <div className="p-4 rounded-2xl bg-[#0F0721] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Percent className="w-3.5 h-3.5 text-pink-400" />
                Revenue Share Split
              </h4>
              <span className="text-[11px] text-gray-400 font-mono">
                Host: {formData.hostCommissionPercentage}% · Platform: {formData.platformCommissionPercentage}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Host Share (%)</label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={formData.hostCommissionPercentage}
                  onChange={(e) => {
                    const h = Math.min(90, Math.max(10, parseInt(e.target.value) || 70));
                    setFormData({
                      ...formData,
                      hostCommissionPercentage: h,
                      platformCommissionPercentage: 100 - h,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-emerald-400 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Platform Share (%)</label>
                <input
                  type="number"
                  disabled
                  value={formData.platformCommissionPercentage}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0516]/50 border border-white/5 text-purple-300 font-mono font-bold text-xs cursor-not-allowed"
                />
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-3 rounded-full bg-purple-950 overflow-hidden flex">
              <div
                style={{ width: `${formData.hostCommissionPercentage}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
              />
              <div
                style={{ width: `${formData.platformCommissionPercentage}%` }}
                className="bg-pink-500 h-full transition-all duration-300"
              />
            </div>
          </div>

          {/* 2. Gift Bounds & Daily Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#0F0721] border border-white/5">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Min Gift Coins
              </label>
              <input
                type="number"
                min={1}
                value={formData.minGiftCoinPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minGiftCoinPrice: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Max Gift Coins
              </label>
              <input
                type="number"
                min={100}
                value={formData.maxGiftCoinPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxGiftCoinPrice: parseInt(e.target.value) || 50000,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Daily Sending Cap
              </label>
              <input
                type="number"
                min={100000}
                step={50000}
                value={formData.dailyGiftSendingCeiling}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyGiftSendingCeiling: parseInt(e.target.value) || 5000000,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-amber-400 font-mono text-xs"
              />
            </div>
          </div>

          {/* 3. Cashout & Recharge Promotion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0F0721] border border-white/5">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Cashout Rate (Coins per $1 USD)
              </label>
              <input
                type="number"
                min={50}
                value={formData.cashoutConversionRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cashoutConversionRate: parseInt(e.target.value) || 280,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Minimum Cashout Coins
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={formData.minimumCashoutCoins}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumCashoutCoins: parseInt(e.target.value) || 10000,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rechargeBonusActive"
                  checked={formData.isRechargeBonusActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isRechargeBonusActive: e.target.checked })
                  }
                  className="w-4 h-4 accent-pink-500 rounded"
                />
                <label
                  htmlFor="rechargeBonusActive"
                  className="text-xs text-gray-300 font-semibold cursor-pointer"
                >
                  Global Promotional Recharge Bonus Active
                </label>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-400">Bonus:</span>
                <input
                  type="number"
                  min={5}
                  max={50}
                  disabled={!formData.isRechargeBonusActive}
                  value={formData.rechargeBonusPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rechargeBonusPercentage: parseInt(e.target.value) || 15,
                    })
                  }
                  className="w-16 px-2 py-1 rounded-lg bg-[#0B0516] border border-white/10 text-pink-400 font-mono font-bold text-xs text-center disabled:opacity-40"
                />
                <span className="text-xs font-bold text-pink-400">%</span>
              </div>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Parameters</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
