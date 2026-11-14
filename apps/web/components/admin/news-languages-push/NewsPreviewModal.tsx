import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Calendar,
  User,
  Tag,
  Globe,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { NewsArticleRecord } from './newsLanguagesPushTypes';

interface NewsPreviewModalProps {
  article: NewsArticleRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (article: NewsArticleRecord) => void;
}

export const NewsPreviewModal: React.FC<NewsPreviewModalProps> = ({
  article,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('desktop');

  if (!isOpen || !article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto"
      data-testid="news-preview-modal"
    >
      <div className="relative w-full max-w-4xl bg-[#17082e] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/70 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header & Device Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-purple-500/20 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                article.status === 'Published'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : article.status === 'Draft'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : article.status === 'Scheduled'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}
            >
              {article.status === 'Published' ? 'Live Published' : 'Demo Preview'}
            </span>
            <span className="text-xs text-purple-300 font-mono">#{article.id}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Switcher */}
            <div className="p-1 bg-black/40 border border-purple-500/30 rounded-xl flex items-center text-xs">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  deviceMode === 'desktop' ? 'bg-pink-600 text-white' : 'text-purple-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Web</span>
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  deviceMode === 'mobile' ? 'bg-pink-600 text-white' : 'text-purple-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile App</span>
              </button>
            </div>

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(article);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-xs font-semibold text-purple-200 transition cursor-pointer"
              >
                Edit Article
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Container */}
        {deviceMode === 'desktop' ? (
          /* Desktop Layout Preview */
          <div className="bg-[#120524] border border-purple-500/20 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden border border-purple-500/30 shadow-lg">
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-600 text-white shadow-md">
                  {article.categoryName}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 drop-shadow-md">
                  {article.title}
                </h1>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-purple-300 pb-4 border-b border-purple-500/20">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-pink-400" />
                  Author: <strong className="text-white">{article.author}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  {article.publishedAt ? `Published: ${article.publishedAt}` : `Created: ${article.createdAt}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono uppercase bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/20">
                  <Globe className="w-3.5 h-3.5 text-pink-400" />
                  Lang: {article.languageCode}
                </span>
                <span className="flex items-center gap-1 text-purple-400">
                  <Eye className="w-3.5 h-3.5" />
                  {article.viewsCount.toLocaleString()} views
                </span>
              </div>
            </div>

            {/* Lead Description */}
            <p className="text-base font-semibold text-purple-100 leading-relaxed border-l-4 border-pink-500 pl-4 py-1 italic bg-pink-950/10 rounded-r-xl">
              {article.description}
            </p>

            {/* Full Content */}
            <div
              className={`text-sm text-purple-200/90 leading-relaxed whitespace-pre-line space-y-4 ${
                article.languageCode === 'ur' ? 'font-urdu text-right text-base leading-loose' : ''
              }`}
            >
              {article.content}
            </div>
          </div>
        ) : (
          /* Mobile App Layout Preview */
          <div className="flex justify-center py-4">
            <div className="w-[360px] bg-[#120524] border-4 border-purple-900 rounded-[36px] overflow-hidden shadow-2xl p-4 space-y-4">
              {/* Simulated Mobile Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-purple-300/80 px-2 pb-1 border-b border-purple-500/15">
                <span>9:41</span>
                <span>Popo Live News</span>
                <span>100%</span>
              </div>

              {/* Mobile News Card */}
              <div className="h-44 rounded-xl overflow-hidden relative border border-purple-500/25">
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-600 text-white">
                  {article.categoryName}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{article.title}</h2>
                <p className="text-[11px] text-purple-400 mt-1">
                  By {article.author} • {article.publishedAt || article.createdAt}
                </p>
              </div>

              <p className="text-xs font-medium text-pink-200 bg-pink-950/30 p-2.5 rounded-xl border border-pink-500/20">
                {article.description}
              </p>

              <div
                className={`text-xs text-purple-200 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar p-2 bg-black/30 rounded-xl whitespace-pre-line ${
                  article.languageCode === 'ur' ? 'text-right' : ''
                }`}
              >
                {article.content}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-purple-500/20 mt-6">
          <span className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Frontend simulated preview. No live content published to external app stores.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 font-medium text-xs transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
