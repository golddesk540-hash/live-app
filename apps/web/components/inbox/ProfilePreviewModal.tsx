'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VideoCallDisabledButton } from '@/components/video-call/VideoCallDisabledButton';
import {
  ShieldCheck,
  MessageCircle,
  Ban,
  Flag,
  Sparkles,
  Users,
  Crown,
} from 'lucide-react';
import { InboxUserProfile } from './types';

interface ProfilePreviewModalProps {
  user: InboxUserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageUser: (user: InboxUserProfile) => void;
  onBlockUser?: (user: InboxUserProfile) => void;
  onReportUser?: (user: InboxUserProfile) => void;
  isBlocked?: boolean;
}

const RING_STYLE_MAP: Record<InboxUserProfile['ringColor'], string> = {
  pink: 'from-[#FF1A6C] via-[#EC4899] to-[#7928CA]',
  blue: 'from-[#3B82F6] via-[#00E5FF] to-[#6366F1]',
  purple: 'from-[#9333EA] via-[#A855F7] to-[#FF1A6C]',
  gold: 'from-[#FFB800] via-[#FFD700] to-[#F59E0B]',
  emerald: 'from-[#10B981] via-[#34D399] to-[#06B6D4]',
};

export const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  user,
  isOpen,
  onClose,
  onMessageUser,
  onBlockUser,
  onReportUser,
  isBlocked = false,
}) => {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Preview"
      subtitle={`Popo ID: ${user.poppoId}`}
      maxWidth="sm"
      className="bg-[#120826] border-purple-400/20"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <div className={`p-[3px] rounded-full bg-gradient-to-tr ${RING_STYLE_MAP[user.ringColor]} shadow-glow-pink`}>
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1D0F38] flex items-center justify-center border-2 border-[#0E051E]">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <span
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#120826] ${
              user.status === 'online'
                ? 'bg-emerald-400'
                : user.status === 'live'
                ? 'bg-[#FF1A6C] animate-pulse'
                : 'bg-zinc-500'
            }`}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <h4 className="text-lg font-extrabold text-white">{user.name}</h4>
            {user.isOfficial && <ShieldCheck className="w-4 h-4 text-amber-400" />}
            {user.isVip && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
          </div>
          <p className="text-xs text-purple-200/60">
            {user.handle} • {user.countryFlag} {user.countryName}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <Badge variant="level" level={user.level} size="xs" />
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF1A6C]/15 text-[#FF4D8D] border border-[#FF1A6C]/30 inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {user.roleTag}
            </span>
          </div>
        </div>

        <p className="text-xs text-purple-100/75 leading-relaxed bg-[#1B0E35] border border-white/10 rounded-2xl px-4 py-3 w-full">
          {user.bio}
        </p>

        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="rounded-2xl bg-[#1A0D32] border border-white/10 py-2.5 px-2">
            <div className="text-sm font-black text-white">{user.followersCount}</div>
            <div className="text-[10px] text-purple-200/60 flex items-center justify-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-[#FF1A6C]" /> Followers
            </div>
          </div>
          <div className="rounded-2xl bg-[#1A0D32] border border-white/10 py-2.5 px-2">
            <div className="text-sm font-black text-white">{user.followingCount}</div>
            <div className="text-[10px] text-purple-200/60 mt-0.5">Following</div>
          </div>
          <div className="rounded-2xl bg-[#1A0D32] border border-white/10 py-2.5 px-2">
            <div className="text-xs font-extrabold text-emerald-400 capitalize truncate">
              {user.status}
            </div>
            <div className="text-[10px] text-purple-200/60 mt-0.5 truncate">{user.lastSeenText}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full pt-1">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={<MessageCircle className="w-4 h-4" />}
            onClick={() => {
              onMessageUser(user);
              onClose();
            }}
          >
            Send Message
          </Button>

          <VideoCallDisabledButton
            variant="button"
            testId="profile-modal-video-call-off-btn"
            targetName={user.name}
          />

          {!user.isOfficial && (onBlockUser || onReportUser) && (
            <div className="grid grid-cols-2 gap-2">
              {onBlockUser && (
                <button
                  type="button"
                  onClick={() => {
                    onBlockUser(user);
                    onClose();
                  }}
                  className="py-2 px-3 rounded-full text-xs font-semibold bg-[#1E1038] hover:bg-red-500/15 text-purple-200 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
              )}
              {onReportUser && (
                <button
                  type="button"
                  onClick={() => {
                    onReportUser(user);
                    onClose();
                  }}
                  className="py-2 px-3 rounded-full text-xs font-semibold bg-[#1E1038] hover:bg-amber-500/15 text-purple-200 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
