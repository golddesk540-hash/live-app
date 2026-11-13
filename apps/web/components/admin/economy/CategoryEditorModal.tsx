import React, { useState, useEffect } from 'react';
import {
  X,
  FolderTree,
  Save,
  CheckCircle2,
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

interface Props {
  category: ContentCategoryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cat: ContentCategoryRecord) => void;
}

const AVAILABLE_ICONS = [
  { key: 'Radio', label: 'Radio / Live', icon: Radio },
  { key: 'Image', label: 'Image / Banner', icon: Image },
  { key: 'Trophy', label: 'Trophy / Event', icon: Trophy },
  { key: 'Megaphone', label: 'Megaphone / Promo', icon: Megaphone },
  { key: 'Bell', label: 'Bell / Notice', icon: Bell },
  { key: 'Crown', label: 'Crown / VIP', icon: Crown },
  { key: 'Building2', label: 'Building / Agency', icon: Building2 },
  { key: 'Sparkles', label: 'Sparkles / Theme', icon: Sparkles },
];

export const CategoryEditorModal: React.FC<Props> = ({
  category,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<ContentCategoryRecord>({
    id: `CAT-${Date.now()}`,
    name: '',
    nameUr: '',
    icon: 'Radio',
    description: '',
    itemsCount: 0,
    status: 'Active',
    displayOrder: 1,
    createdDate: new Date().toISOString().split('T')[0],
  });

  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({ ...category });
    } else {
      setFormData({
        id: `CAT-${Date.now().toString().slice(-4)}`,
        name: '',
        nameUr: '',
        icon: 'Radio',
        description: '',
        itemsCount: 0,
        status: 'Active',
        displayOrder: 1,
        createdDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsSavedNotice(false);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const isEditing = Boolean(category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#120726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isEditing ? 'Edit Category' : 'Add New Content Category'}
              </h3>
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Music & Acoustic Streams"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Urdu Name (Optional)
            </label>
            <input
              type="text"
              placeholder="اردو نام"
              value={formData.nameUr || ''}
              dir="rtl"
              onChange={(e) => setFormData({ ...formData, nameUr: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Category Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = formData.icon === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: item.key })}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[10px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(255,15,123,0.3)]'
                        : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate w-full text-center">{item.key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5">
              Category Description
            </label>
            <textarea
              rows={2}
              required
              placeholder="Brief summary of what content belongs in this category..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs focus:border-pink-500 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    displayOrder: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as CategoryStatus })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B0516] border border-white/10 text-white text-xs"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-[11px] text-gray-500">
              {isSavedNotice ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Category saved!
                </span>
              ) : (
                'Review category settings.'
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
