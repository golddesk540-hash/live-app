import React, { useState, useEffect } from 'react';
import { X, Tag, Sparkles } from 'lucide-react';
import { NewsCategoryRecord, NewsCategoryName } from './newsLanguagesPushTypes';

interface CategoryEditorModalProps {
  isOpen: boolean;
  category: NewsCategoryRecord | null;
  onClose: () => void;
  onSave: (category: NewsCategoryRecord) => void;
}

const AVAILABLE_ICONS = ['📢', '🎪', '🚀', '💬', '🎁', '⚠️', '🌟', '💡', '🏆', '🔥', '🛡️', '🔔'];

export const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState<NewsCategoryName>('Announcements');
  const [customName, setCustomName] = useState('');
  const [icon, setIcon] = useState('📢');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (category) {
      setName(category.name);
      setCustomName(category.name);
      setIcon(category.icon);
      setDescription(category.description);
      setStatus(category.status);
    } else {
      setName('Announcements');
      setCustomName('');
      setIcon('📢');
      setDescription('');
      setStatus('Active');
    }
    setErrors({});
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    const finalName = (customName.trim() || name) as NewsCategoryName;
    if (!finalName) {
      newErrors.name = 'Category name is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const savedRecord: NewsCategoryRecord = {
      id: category ? category.id : `CAT-${Date.now().toString().slice(-4)}`,
      name: finalName,
      icon,
      description: description.trim(),
      articleCount: category ? category.articleCount : 0,
      status,
    };

    onSave(savedRecord);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      data-testid="category-editor-modal"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {category ? 'Edit News Category' : 'Create New Category'}
              </h2>
              <p className="text-xs text-slate-400">Classify articles for audience filtering</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Announcements, Community, Updates..."
              className={`w-full px-3.5 py-2.5 bg-slate-800 border ${
                errors.name ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-sm`}
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                    icon === ic
                      ? 'bg-pink-500/30 border-2 border-pink-500 scale-105'
                      : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of articles that belong in this category..."
              className={`w-full px-3.5 py-2 bg-slate-800 border ${
                errors.description ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-sm resize-none`}
            />
            {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="flex gap-3">
              {(['Active', 'Inactive'] as const).map((s) => (
                <label
                  key={s}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                    status === s
                      ? s === 'Active'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-700 border-slate-500 text-slate-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="catStatus"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="sr-only"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 transition-all"
            >
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
