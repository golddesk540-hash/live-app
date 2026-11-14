import React from 'react';
import { Tag, Plus, Edit, Sparkles, CheckCircle2, XCircle, Newspaper } from 'lucide-react';
import { NewsCategoryRecord } from './newsLanguagesPushTypes';

interface NewsCategoriesViewProps {
  categories: NewsCategoryRecord[];
  onAddCategory: () => void;
  onEditCategory: (category: NewsCategoryRecord) => void;
  onToggleStatus: (categoryId: string) => void;
}

export const NewsCategoriesView: React.FC<NewsCategoriesViewProps> = ({
  categories,
  onAddCategory,
  onEditCategory,
  onToggleStatus,
}) => {
  return (
    <div className="space-y-6" data-testid="news-categories-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">News Categories</h2>
          <p className="text-xs text-slate-400">
            Structure and taxonomy for in-app articles, feed segmentation, and notification tags
          </p>
        </div>
        <button
          onClick={onAddCategory}
          data-testid="add-category-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-pink-500/50 transition-all flex flex-col justify-between shadow-lg group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                      cat.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        cat.status === 'Active' ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                    />
                    {cat.status}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-pink-400" />
                <span className="font-semibold text-white">{cat.articleCount}</span> articles
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleStatus(cat.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                >
                  {cat.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => onEditCategory(cat)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
