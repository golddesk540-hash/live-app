import React from 'react';
import {
  X,
  ExternalLink,
  Eye,
  MousePointerClick,
  Layers,
  Calendar,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { ContentRecord } from './contentEconomyTypes';

interface Props {
  content: ContentRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (c: ContentRecord) => void;
}

export const ContentPreviewModal: React.FC<Props> = ({
  content,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#120726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Content Item Preview</h3>
              <span className="font-mono text-[11px] text-gray-400">{content.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto no-scrollbar">
          {/* Visual Thumbnail */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-lg">
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-pink-500 text-white shadow-md uppercase tracking-wider">
                {content.type}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                  content.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : content.status === 'Pending Review'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/10 text-gray-300 border-white/20'
                }`}
              >
                {content.status}
              </span>
            </div>
            {content.isFeatured && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 text-black flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3" /> FEATURED
              </div>
            )}
          </div>

          {/* Titles & Description */}
          <div>
            <h2 className="text-base font-extrabold text-white mb-1">{content.title}</h2>
            {content.titleUr && (
              <h3 className="text-xs text-pink-300 font-semibold mb-2" dir="rtl">
                {content.titleUr}
              </h3>
            )}
            <p className="text-xs text-gray-300 leading-relaxed bg-[#0F0721] p-3.5 rounded-xl border border-white/5">
              {content.description}
            </p>
          </div>

          {/* Telemetry & Key Properties */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
                <Eye className="w-3 h-3 text-pink-400" /> Views
              </div>
              <div className="text-sm font-extrabold text-white">
                {content.viewsCount.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
                <MousePointerClick className="w-3 h-3 text-blue-400" /> Clicks
              </div>
              <div className="text-sm font-extrabold text-white">
                {content.clicksCount.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Priority</div>
              <div className="text-sm font-extrabold text-white">#{content.priorityOrder}</div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-purple-400" /> Updated
              </div>
              <div className="text-xs font-bold text-white truncate">{content.updatedDate}</div>
            </div>
          </div>

          {/* Deep link preview */}
          {content.targetUrl && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-900/20 border border-purple-500/20 text-xs">
              <span className="text-gray-400">Target Route:</span>
              <span className="font-mono font-bold text-pink-300 flex items-center gap-1">
                {content.targetUrl} <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-[#120726]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(content);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Content</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
