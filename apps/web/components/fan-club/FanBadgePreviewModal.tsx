'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Crown, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { FanClubItem } from './types';

interface FanBadgePreviewModalProps {
  club: FanClubItem | null;
  isJoined: boolean;
  isOpen: boolean;
  onClose: () => void;
  onJoinClick?: (club: FanClubItem) => void;
}

export const FanBadgePreviewModal: React.FC<FanBadgePreviewModalProps> = ({
  club,
  isJoined,
  isOpen,
  onClose,
  onJoinClick,
}) => {
  if (!club) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fan Club Badge Preview"
      subtitle={`${club.name} • Host: ${club.hostName}`}
      maxWidth="sm"
      className="bg-[#120726] border-amber-400/30"
    >
      <div data-testid="fan-badge-preview-modal" className="space-y-4">
        {/* Badge Centerpiece */}
        <div className="rounded-3xl bg-gradient-to-b from-[#26104B] to-[#14072A] border border-amber-400/35 p-5 text-center space-y-3 relative overflow-hidden">
          <div className="w-20 h-20 rounded-full mx-auto bg-[#6C2BD9] border-2 border-amber-300/80 shadow-lg flex items-center justify-center">
            <Crown className="w-9 h-9 text-amber-300 fill-amber-300" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/25 to-pink-500/20 border border-amber-300/50 text-xs font-black text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{club.badgeLabel}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 text-white">
                Lv.{club.clubLevel}
              </span>
            </div>
            <p className="text-[11px] text-purple-200/75">
              Official supporter emblem for <strong className="text-white">{club.hostName}</strong>
            </p>
          </div>
        </div>

        {/* Profile Display Simulation Card */}
        <div className="rounded-2xl bg-[#190B32] border border-white/10 p-3.5 space-y-2.5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200/55">
            Display Preview on Your Popo Live Profile
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#100521] border border-purple-400/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1A6C] to-[#7928CA] flex items-center justify-center text-xs font-black text-white shrink-0 border-2 border-amber-300/60">
              ME
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white">You</span>
                <span
                  data-testid="profile-badge-preview-pill"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[10px] font-black shadow-sm"
                >
                  <Crown className="w-2.5 h-2.5 fill-black" />
                  {club.badgeLabel} Lv.{club.clubLevel}
                </span>
              </div>
              <div className="text-[10px] text-purple-200/60 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>
                  {isJoined
                    ? 'Active Fan Club badge shown in demo profile & room cards'
                    : 'Join this Fan Club to unlock this demo badge'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          {!isJoined && onJoinClick && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                onJoinClick(club);
              }}
            >
              Join to Unlock
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
