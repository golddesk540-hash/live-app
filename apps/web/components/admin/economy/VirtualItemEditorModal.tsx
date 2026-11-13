import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Coins,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { VirtualItemRecord, VirtualItemStatus } from './contentEconomyTypes';

interface Props {
  item: VirtualItemRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: VirtualItemRecord) => void;
}

export const VirtualItemEditorModal: React.FC<Props> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<VirtualItemRecord | null>(null);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
      setIsSavedNotice(false);
    }
  }, [item]);

  if (!isOpen || !item || !formData) return null;

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
      <div className="w-full max-w-lg rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#120726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Virtual Asset Editor</h3>
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
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto no-scrollbar">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Virtual Item Config: Modifies client cosmetic display rules and demo price attributes.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Category
              </label>
              <input
                type="text"
                disabled
                value={formData.categoryLabel}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516]/50 border border-white/5 text-gray-400 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Duration Label
              </label>
              <input
                type="text"
                required
                value={formData.durationLabel}
                onChange={(e) => setFormData({ ...formData, durationLabel: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Demo Coin Price
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.coinValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coinValue: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-amber-400 font-mono font-bold text-xs"
                />
                <Coins className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as VirtualItemStatus })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/10">
            <input
              type="checkbox"
              id="itemFeatured"
              checked={Boolean(formData.isFeatured)}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 rounded"
            />
            <label htmlFor="itemFeatured" className="text-xs text-gray-300 font-semibold cursor-pointer">
              Promote on Store Homepage Featured Carousel
            </label>
          </div>

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-[11px] text-gray-500">
              {isSavedNotice ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Item updated!
                </span>
              ) : (
                'Review changes before saving.'
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Item</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
