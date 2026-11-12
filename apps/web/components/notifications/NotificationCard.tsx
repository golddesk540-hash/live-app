'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ActivityNotificationItem, NotificationType } from './types';
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Crown,
  Sparkles,
  Radio,
  MoreVertical,
  Check,
  MailOpen,
  Trash2,
  User,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';

const RING_CLASSES: Record<ActivityNotificationItem['ringColor'], string> = {
  pink: 'from-[#FF1A6C] via-[#EC4899] to-[#9333EA]',
  blue: 'from-[#3B82F6] via-[#00E5FF] to-[#6366F1]',
  purple: 'from-[#9333EA] via-[#A855F7] to-[#D946EF]',
  gold: 'from-[#FFB800] via-[#FFD700] to-[#F59E0B]',
  emerald: 'from-[#10B981] via-[#34D399] to-[#06B6D4]',
};

export function getNotificationCategoryIconMeta(type: NotificationType) {
  switch (type) {
    case 'likes':
      return {
        Icon: Heart,
        iconColor: 'text-[#FF4D8D]',
        boxBg: 'bg-[#281247] border-pink-400/30',
        pillLabel: 'Like',
      };
    case 'comments':
      return {
        Icon: MessageCircle,
        iconColor: 'text-purple-300',
        boxBg: 'bg-[#281247] border-purple-400/30',
        pillLabel: 'Comment',
      };
    case 'followers':
      return {
        Icon: UserPlus,
        iconColor: 'text-[#FF1A6C]',
        boxBg: 'bg-[#281247] border-[#FF1A6C]/35',
        pillLabel: 'Follower',
      };
    case 'mentions':
      return {
        Icon: AtSign,
        iconColor: 'text-cyan-300',
        boxBg: 'bg-[#281247] border-cyan-400/30',
        pillLabel: 'Mention',
      };
    case 'fan_club':
      return {
        Icon: Crown,
        iconColor: 'text-amber-300',
        boxBg: 'bg-[#281247] border-amber-300/35',
        pillLabel: 'Fan Club',
      };
    case 'invites':
      return {
        Icon: Sparkles,
        iconColor: 'text-emerald-300',
        boxBg: 'bg-[#281247] border-emerald-400/30',
        pillLabel: 'Invite',
      };
    case 'live':
    default:
      return {
        Icon: Radio,
        iconColor: 'text-rose-400',
        boxBg: 'bg-[#281247] border-rose-400/40',
        pillLabel: 'Live',
      };
  }
}

interface NotificationCardProps {
  item: ActivityNotificationItem;
  isSelected: boolean;
  isFollowedBack: boolean;
  onOpen: (item: ActivityNotificationItem) => void;
  onToggleRead: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFollowBack: (item: ActivityNotificationItem) => void;
  onOpenProfile: (item: ActivityNotificationItem) => void;
  onOpenInvite: (item: ActivityNotificationItem) => void;
  onOpenLivePreview: (item: ActivityNotificationItem) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  isSelected,
  isFollowedBack,
  onOpen,
  onToggleRead,
  onDelete,
  onToggleFollowBack,
  onOpenProfile,
  onOpenInvite,
  onOpenLivePreview,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = getNotificationCategoryIconMeta(item.type);
  const CategoryIcon = meta.Icon;

  return (
    <div
      data-testid={`notification-card-${item.id}`}
      data-read={item.isRead ? 'true' : 'false'}
      onClick={() => onOpen(item)}
      className={`group relative rounded-2xl border p-3.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-[#251049] border-[#FF1A6C]/70 shadow-glow-pink'
          : !item.isRead
          ? 'bg-[#1B0C36]/95 border-[#FF1A6C]/35 hover:border-[#FF1A6C]/60 shadow-lg'
          : 'bg-[#120624]/85 border-purple-400/15 hover:border-purple-400/35 opacity-85 hover:opacity-100'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Colored-Ring Avatar matching 08_07_notifications.png */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(item);
          }}
          aria-label={`Preview ${item.sender.name} profile`}
          className={`relative w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-tr ${RING_CLASSES[item.ringColor]} shrink-0 hover:scale-105 transition-transform`}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[#16092D]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.sender.avatarUrl}
              alt={item.sender.name}
              className="w-full h-full object-cover"
            />
          </div>
          {!item.isRead && (
            <span
              data-testid={`notification-unread-dot-${item.id}`}
              className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FF1A6C] border-2 border-[#16092D] shadow-glow-pink"
            />
          )}
        </button>

        {/* Body Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-black text-white truncate">
              {item.sender.name}
            </span>
            {item.type === 'live' && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-[9px] font-black text-rose-300 uppercase">
                LIVE
              </span>
            )}
            {!item.isRead && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/20 text-[9px] font-bold text-[#FF6BA3]">
                New
              </span>
            )}
          </div>

          <p className="text-xs text-purple-100/85 mt-0.5 line-clamp-2 leading-snug">
            {item.description}
          </p>

          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="text-[11px] font-medium text-purple-200/50">
              {item.timestamp}
            </span>

            {item.type === 'followers' && (
              <button
                type="button"
                data-testid={`follow-back-btn-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFollowBack(item);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 transition-all ${
                  isFollowedBack
                    ? 'bg-emerald-500/20 border border-emerald-400/45 text-emerald-200'
                    : 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-sm hover:brightness-110'
                }`}
              >
                {isFollowedBack ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Following</span>
                  </>
                ) : (
                  <span>Follow Back</span>
                )}
              </button>
            )}

            {item.type === 'invites' && (
              <button
                type="button"
                data-testid={`view-invite-btn-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenInvite(item);
                }}
                className="px-3 py-1 rounded-full bg-[#2B1454] hover:bg-[#3A1C70] border border-emerald-400/35 text-[11px] font-bold text-emerald-200 transition-colors"
              >
                View Invite
              </button>
            )}

            {item.type === 'live' && (
              <button
                type="button"
                data-testid={`view-live-btn-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLivePreview(item);
                }}
                className="px-3 py-1 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-[11px] font-bold text-rose-200 transition-colors"
              >
                View Live
              </button>
            )}

            {item.type === 'fan_club' && item.action.href && (
              <Link
                href={item.action.href}
                onClick={(e) => e.stopPropagation()}
                data-testid={`view-fan-club-link-${item.id}`}
                className="px-3 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-300/35 text-[11px] font-bold text-amber-200 inline-flex items-center gap-1 transition-colors"
              >
                <span>View Fan Club</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}

            {(item.type === 'likes' || item.type === 'comments' || item.type === 'mentions') &&
              item.action.href && (
                <Link
                  href={item.action.href}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`view-post-link-${item.id}`}
                  className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-purple-100 inline-flex items-center gap-1 transition-colors"
                >
                  <span>View Post</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              )}
          </div>
        </div>

        {/* Right Thumbnail / Category Icon + More Options */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.postThumbnailUrl ? (
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-400/25 bg-[#241046] relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.postThumbnailUrl}
                alt="Related post preview"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-md bg-[#120624]/90 border border-white/15 flex items-center justify-center">
                <CategoryIcon className={`w-2.5 h-2.5 ${meta.iconColor}`} />
              </span>
            </div>
          ) : (
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${meta.boxBg}`}
            >
              <CategoryIcon className={`w-4 h-4 ${meta.iconColor}`} />
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              data-testid={`notification-menu-btn-${item.id}`}
              aria-label={`More options for ${item.sender.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="p-1.5 rounded-full text-purple-200/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-1 w-44 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-40 space-y-0.5"
              >
                <button
                  type="button"
                  data-testid={`menu-toggle-read-${item.id}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleRead(item.id);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                >
                  {item.isRead ? (
                    <>
                      <MailOpen className="w-3.5 h-3.5 text-[#FF4D8D]" /> Mark as Unread
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Mark as Read
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfile(item);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" /> View User Profile
                </button>
                <button
                  type="button"
                  data-testid={`menu-delete-${item.id}`}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(item.id);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Notification
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
