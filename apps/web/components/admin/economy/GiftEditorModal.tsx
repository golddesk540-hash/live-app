import React, { useState, useEffect } from 'react';
import {
  X,
  Gift,
  Coins,
  Sparkles,
  Save,
  CheckCircle2,
  Film,
  AlertCircle,
} from 'lucide-react';
import { GiftRecord, GiftCategory, GiftStatus } from './contentEconomyTypes';

interface Props {
  gift: GiftRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: GiftRecord) => void;
}

export const GiftEditorModal: React.FC<Props> = ({
  gift,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<GiftRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (gift) {
      setFormData({ ...gift });
      setIsSavedNotice(false);
    }
  }, [gift]);

  if (!isOpen || !gift || !formData) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GiftRecord = {
      ...formData,
      updatedDate: 'Just now',
    };
    onSave(updated);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const categories: GiftCategory[] = [
    'Popular',
    'Premium',
    'Seasonal',
    'Special',
    'Luxury',
    'Romantic',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#120726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Gift Details & Editor</h3>
              <span className="font-mono text-[11px] text-gray-400">{formData.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'details'
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeTab === 'preview'
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Live Preview
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
          {activeTab === 'details' ? (
            <>
              {/* Top Banner Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Demo Mode: All coin values and gift modifications are local frontend simulations. No real financial or gift pricing records are modified.
                </span>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Gift Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Urdu Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.nameUr || ''}
                    dir="rtl"
                    onChange={(e) => setFormData({ ...formData, nameUr: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Gift Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as GiftCategory })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none transition-colors"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-[#120726]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Demo Coin Value
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.coinValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          coinValue: Math.max(1, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none transition-colors font-mono font-bold"
                    />
                    <Coins className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Status and Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Catalog Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as GiftStatus })
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={Boolean(formData.isPopular)}
                    onChange={(e) =>
                      setFormData({ ...formData, isPopular: e.target.checked })
                    }
                    className="w-4 h-4 accent-pink-500 rounded"
                  />
                  <label htmlFor="isPopular" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Popular Tag
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={Boolean(formData.isFeatured)}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 accent-pink-500 rounded"
                  />
                  <label htmlFor="isFeatured" className="text-xs text-gray-300 font-semibold cursor-pointer">
                    Featured Hero
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Gift Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Image & Animation URL preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Image Asset URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Animation JSON/Video URL
                  </label>
                  <input
                    type="text"
                    placeholder="/assets/gifts/animations/..."
                    value={formData.animationUrl || ''}
                    onChange={(e) => setFormData({ ...formData, animationUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none font-mono text-[11px]"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Live Preview Screen */
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                <img
                  src={formData.imageUrl}
                  alt={formData.name}
                  className="w-40 h-40 object-contain drop-shadow-[0_0_30px_rgba(255,15,123,0.5)] animate-pulse"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-pink-500 text-white shadow-lg">
                    {formData.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-black flex items-center gap-1 shadow-lg">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{formData.coinValue.toLocaleString()} Demo Coins</span>
                  </span>
                </div>
                {formData.animationUrl && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/80 border border-purple-500/40 text-[11px] font-bold text-white shadow-lg backdrop-blur-md">
                    <Film className="w-3.5 h-3.5 text-pink-400" />
                    <span>Particle Overlay Ready</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#0F0721] border border-white/5 space-y-2">
                <h4 className="text-base font-extrabold text-white">{formData.name}</h4>
                {formData.nameUr && (
                  <h5 className="text-xs text-pink-300 font-semibold" dir="rtl">
                    {formData.nameUr}
                  </h5>
                )}
                <p className="text-xs text-gray-300 leading-relaxed">{formData.description}</p>
                <div className="pt-2 flex items-center gap-4 text-[11px] text-gray-400 border-t border-white/5 font-mono">
                  <span>Usage count: {formData.usageCount.toLocaleString()}</span>
                  <span>Created: {formData.createdDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-[11px] text-gray-500">
              {isSavedNotice ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Changes saved to demo catalog!
                </span>
              ) : (
                'Review details before saving.'
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Gift</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
