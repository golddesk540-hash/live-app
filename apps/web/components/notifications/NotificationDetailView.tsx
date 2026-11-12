'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getNotificationCategoryIconMeta } from './NotificationCard';
import { ActivityNotificationItem } from './types';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  MailOpen,
  Radio,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';

interface NotificationDetailViewProps {
  item: ActivityNotificationItem | null;
  isFollowedBack: boolean;
  onBackMobile: () => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFollowBack: (item: ActivityNotificationItem) => void;
  onOpenProfile: (item: ActivityNotificationItem) => void;
  onOpenInvite: (item: ActivityNotificationItem) => void;
  onOpenLivePreview: (item: ActivityNotificationItem) => void;
}

export const NotificationDetailView: React.FC<NotificationDetailViewProps> = ({
  item,
  isFollowedBack,
  onBackMobile,
  onToggleRead,
  onDelete,
  onToggleFollowBack,
  onOpenProfile,
  onOpenInvite,
  onOpenLivePreview,
}) => {
  if (!item) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[540px] rounded-3xl bg-[#130728]/85 border border-purple-400/15 p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF1A6C]/25 to-[#7928CA]/25 border border-[#FF1A6C]/35 flex items-center justify-center mb-4 shadow-glow-pink">
          <Bell className="w-7 h-7 text-[#FF4D8D]" />
        </div>
        <h3 className="text-lg font-extrabold text-white">Select an Activity Notification</h3>
        <p className="text-xs text-purple-200/65 max-w-xs mt-1.5 leading-relaxed">
          Tap any personal notification on the left to inspect its full details, sender profile, and quick community actions.
        </p>
      </div>
    );
  }

  const meta = getNotificationCategoryIconMeta(item.type);
  const CategoryIcon = meta.Icon;

  return (
    <article
      data-testid="notification-detail-view"
      className="rounded-3xl bg-[#14072B]/95 border border-purple-400/20 overflow-hidden shadow-2xl"
    >
      {/* Top Detail Bar */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#190A36] border-b border-purple-400/15 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackMobile}
            data-testid="notification-detail-back-btn"
            aria-label="Back to Notifications list"
            className="lg:hidden p-2 -ml-1 rounded-full bg-[#24114A] hover:bg-[#311863] text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onOpenProfile(item)}
            className="flex items-center gap-2.5 text-left group min-w-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.sender.avatarUrl}
              alt={item.sender.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#FF4D8D] shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white truncate">
                  {item.sender.name}
                </span>
                {item.sender.roleTag && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[#FF6BA3] text-[10px] font-bold">
                    {item.sender.roleTag}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-200/60 truncate">
                {item.sender.handle} · ID {item.sender.poppoId}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleRead(item.id)}
            data-testid="notification-detail-toggle-read-btn"
            className="px-3 py-1.5 rounded-full bg-[#24114A] hover:bg-[#311863] border border-white/10 text-[11px] font-bold text-purple-100 inline-flex items-center gap-1.5 transition-colors"
          >
            {item.isRead ? (
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
            onClick={() => onDelete(item.id)}
            data-testid="notification-detail-delete-btn"
            aria-label="Delete notification"
            className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-400/25 text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Detail Content */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-extrabold ${meta.boxBg}`}
            >
              <CategoryIcon className={`w-3.5 h-3.5 ${meta.iconColor}`} />
              <span className="text-white">{item.categoryLabel}</span>
            </span>

            <span
              data-testid="notification-detail-status-pill"
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                item.isRead
                  ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200'
                  : 'bg-[#FF1A6C]/20 border-[#FF1A6C]/45 text-[#FF6BA3]'
              }`}
            >
              {item.isRead ? 'Read' : 'Unread'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
            {item.title}
          </h2>

          <div className="flex items-center gap-4 text-xs text-purple-200/60">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
              {item.publicationDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-300" />
              {item.publicationTime} ({item.timestamp} ago)
            </span>
          </div>
        </div>

        {/* Full Notification Message */}
        <div className="rounded-2xl bg-[#1C0B38]/90 border border-purple-400/20 p-4 space-y-2.5">
          {item.fullMessage.map((para, idx) => (
            <p key={idx} className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Related Content Preview Card */}
        {(item.postPreviewText ||
          item.commentPreview ||
          item.clubName ||
          item.inviteRoomTitle ||
          item.liveRoomTitle) && (
          <div
            data-testid="notification-related-preview"
            className="rounded-2xl bg-[#100523]/95 border border-purple-400/25 p-4 space-y-3"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200/55">
              Related Content Preview
            </p>

            {item.commentPreview && (
              <blockquote className="rounded-xl bg-[#1E0E3B] border-l-2 border-[#FF1A6C] px-3.5 py-2.5 text-xs sm:text-sm text-white italic">
                &ldquo;{item.commentPreview}&rdquo;
              </blockquote>
            )}

            <div className="flex items-start gap-3">
              {item.postThumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.postThumbnailUrl}
                  alt="Related thumbnail"
                  className="w-16 h-16 rounded-xl object-cover border border-white/15 shrink-0"
                />
              )}

              <div className="min-w-0 flex-1 space-y-1">
                {item.clubName && (
                  <p className="text-xs font-black text-amber-300 inline-flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    {item.clubName}
                  </p>
                )}
                {item.inviteRoomTitle && (
                  <p className="text-xs font-black text-emerald-300 inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {item.inviteRoomTitle} · Code: {item.inviteCode}
                  </p>
                )}
                {item.liveRoomTitle && (
                  <p className="text-xs font-black text-rose-300 inline-flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    {item.liveRoomTitle} ({(item.liveViewerCount || 0).toLocaleString()} viewers)
                  </p>
                )}
                {item.postPreviewText && (
                  <p className="text-xs text-purple-100/80 leading-relaxed">
                    {item.postPreviewText}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contextual Action Footer */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {item.action.actionKind === 'follow_back' && (
            <Button
              variant={isFollowedBack ? 'secondary' : 'primary'}
              size="sm"
              data-testid="detail-follow-back-btn"
              leftIcon={isFollowedBack ? <Check className="w-3.5 h-3.5" /> : undefined}
              onClick={() => onToggleFollowBack(item)}
            >
              {isFollowedBack ? 'Following Back ✓' : 'Follow Back'}
            </Button>
          )}

          {item.action.actionKind === 'open_invite' && (
            <Button
              variant="primary"
              size="sm"
              data-testid="detail-open-invite-btn"
              onClick={() => onOpenInvite(item)}
            >
              View Party Invitation
            </Button>
          )}

          {item.action.actionKind === 'open_live_preview' && (
            <Button
              variant="primary"
              size="sm"
              data-testid="detail-open-live-btn"
              leftIcon={<Radio className="w-3.5 h-3.5" />}
              onClick={() => onOpenLivePreview(item)}
            >
              Open Mock Live Preview
            </Button>
          )}

          {item.action.href && (
            <Link
              href={item.action.href}
              data-testid="detail-primary-nav-link"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 transition-all"
            >
              <span>{item.action.label}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <Button
            variant="secondary"
            size="sm"
            data-testid="detail-view-profile-btn"
            leftIcon={<User className="w-3.5 h-3.5 text-cyan-300" />}
            onClick={() => onOpenProfile(item)}
          >
            Sender Profile
          </Button>
        </div>
      </div>
    </article>
  );
};
