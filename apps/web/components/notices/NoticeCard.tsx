'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { getCategoryVisualMeta } from './NoticeStyleBadge';
import { SystemNoticeItem } from './types';

interface NoticeCardProps {
  notice: SystemNoticeItem;
  isSelected: boolean;
  onSelect: (notice: SystemNoticeItem) => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  notice,
  isSelected,
  onSelect,
}) => {
  const meta = getCategoryVisualMeta(notice.category);
  const Icon = meta.Icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(notice)}
      data-testid={`notice-card-${notice.id}`}
      className={`w-full text-left rounded-2xl p-4 sm:p-5 transition-all duration-200 border group relative overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-br from-[#230E48] via-[#1A0B36] to-[#140729] border-[#FF1A6C]/60 shadow-glow-pink'
          : notice.isImportant
          ? 'bg-[#190B34]/95 border-amber-400/35 hover:border-amber-400/70'
          : !notice.isRead
          ? 'bg-[#180A33] border-purple-400/30 hover:border-[#FF1A6C]/50'
          : 'bg-[#130728]/85 border-purple-400/15 hover:border-purple-300/35'
      }`}
    >
      {/* Top Row: Category pill badge + Priority + Unread Dot */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase border ${meta.pillClass}`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span>{notice.categoryBadge}</span>
          </span>

          {notice.isImportant && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
              <Crown className="w-2.5 h-2.5 fill-amber-300" />
              Important
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!notice.isRead ? (
            <span
              data-testid={`notice-unread-dot-${notice.id}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF4D8D]"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF1A6C] shadow-glow-pink" />
              Unread
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-purple-200/45">Read</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        className={`text-base sm:text-[17px] font-extrabold tracking-tight leading-snug group-hover:text-[#FF4D8D] transition-colors ${
          !notice.isRead ? 'text-white' : 'text-purple-100/90'
        }`}
      >
        {notice.title}
      </h3>

      {/* Short Description */}
      <p className="text-xs sm:text-sm text-purple-200/70 mt-1.5 leading-relaxed line-clamp-2">
        {notice.shortDescription}
      </p>

      {/* Date and Time */}
      <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-white/5 text-[11px] text-purple-200/55">
        <span>{notice.displayTimestamp}</span>
        <span className="text-[#FF4D8D] font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
          Open Notice →
        </span>
      </div>
    </button>
  );
};
