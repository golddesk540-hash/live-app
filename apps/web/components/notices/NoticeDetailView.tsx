'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getCategoryVisualMeta } from './NoticeStyleBadge';
import { SystemNoticeItem } from './types';
import {
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  MailOpen,
  ExternalLink,
  Crown,
  Trash2,
  Bell,
} from 'lucide-react';

interface NoticeDetailViewProps {
  notice: SystemNoticeItem | null;
  onBackMobile: () => void;
  onToggleReadStatus: (noticeId: string) => void;
  onDismissNotice: (noticeId: string) => void;
}

export const NoticeDetailView: React.FC<NoticeDetailViewProps> = ({
  notice,
  onBackMobile,
  onToggleReadStatus,
  onDismissNotice,
}) => {
  if (!notice) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[540px] rounded-3xl bg-[#130728]/85 border border-purple-400/15 p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF1A6C]/25 to-[#7928CA]/25 border border-[#FF1A6C]/35 flex items-center justify-center mb-4 shadow-glow-pink">
          <Bell className="w-7 h-7 text-[#FF4D8D]" />
        </div>
        <h3 className="text-lg font-extrabold text-white">Select a System Notice</h3>
        <p className="text-xs text-purple-200/65 max-w-xs mt-1.5 leading-relaxed">
          Click any official Popo Live notice card on the left to inspect its full announcement details and related shortcuts.
        </p>
      </div>
    );
  }

  const meta = getCategoryVisualMeta(notice.category);
  const Icon = meta.Icon;

  return (
    <article
      data-testid="notice-detail-view"
      className="rounded-3xl bg-[#14072B]/95 border border-purple-400/20 overflow-hidden shadow-2xl"
    >
      {/* Top Detail Bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#190A36] border-b border-purple-400/15">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackMobile}
            data-testid="notice-detail-back-btn"
            aria-label="Back to System Notices list"
            className="lg:hidden p-2 -ml-1 rounded-full bg-[#24114A] hover:bg-[#311863] text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF1A6C] to-[#7928CA] p-[2px] shadow-glow-pink">
              <div className="w-full h-full rounded-full bg-[#120624] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white">Popo Live Official</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[9px] font-extrabold uppercase">
                  Verified System
                </span>
              </div>
              <p className="text-[11px] text-purple-200/55 font-mono">{notice.referenceCode}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleReadStatus(notice.id)}
            data-testid="notice-toggle-read-btn"
            className="px-3 py-1.5 rounded-full bg-[#24114A] hover:bg-[#311863] border border-white/10 text-[11px] font-bold text-purple-100 inline-flex items-center gap-1.5 transition-colors"
          >
            {notice.isRead ? (
              <>
                <MailOpen className="w-3.5 h-3.5 text-[#FF4D8D]" />
                <span>Mark Unread</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark Read</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onDismissNotice(notice.id)}
            data-testid="notice-dismiss-btn"
            aria-label="Dismiss notice"
            title="Dismiss notice locally"
            className="p-2 rounded-full bg-[#24114A] hover:bg-red-500/20 border border-white/10 hover:border-red-400/40 text-purple-200 hover:text-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Detail Body */}
      <div className="p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase border ${meta.pillClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{notice.categoryBadge}</span>
          </span>

          {notice.isImportant && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/45 text-amber-300 text-xs font-extrabold">
              <Crown className="w-3.5 h-3.5 fill-amber-300" />
              Important Notice
            </span>
          )}

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
              notice.isRead
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/25'
                : 'bg-[#FF1A6C]/15 text-[#FF4D8D] border border-[#FF1A6C]/35'
            }`}
          >
            {notice.isRead ? 'Read' : 'Unread'}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
          {notice.title}
        </h2>

        {/* Publication Date & Time */}
        <div className="flex items-center gap-4 flex-wrap text-xs text-purple-200/70 bg-[#1B0D37] border border-white/10 rounded-2xl px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF4D8D]" />
            <span>Published {notice.publicationDate}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{notice.publicationTime}</span>
          </span>
        </div>

        {/* Full Message Paragraphs */}
        <div className="space-y-3 text-sm text-purple-50/90 leading-relaxed">
          {notice.fullMessage.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {/* Structured Highlights */}
        {notice.highlights && notice.highlights.length > 0 && (
          <div className="rounded-2xl bg-[#1A0C34] border border-purple-400/20 p-4 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-200/65 block">
              Key Takeaways
            </span>
            <ul className="space-y-2">
              {notice.highlights.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-purple-100/85">
                  <CheckCircle2 className="w-4 h-4 text-[#FF4D8D] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related Action Button */}
        {notice.relatedAction && (
          <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-white/10">
            <Link href={notice.relatedAction.href} className="inline-flex">
              <Button
                variant={notice.isImportant ? 'vip' : 'primary'}
                size="md"
                rightIcon={<ExternalLink className="w-4 h-4" />}
              >
                {notice.relatedAction.label}
              </Button>
            </Link>

            <button
              type="button"
              onClick={onBackMobile}
              className="lg:hidden text-xs font-bold text-purple-200/75 hover:text-white underline"
            >
              Back to Notices
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
