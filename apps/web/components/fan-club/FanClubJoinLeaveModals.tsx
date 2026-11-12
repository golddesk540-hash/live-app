'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  Crown,
  Sparkles,
  Heart,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { FanClubItem } from './types';

interface JoinFanClubModalProps {
  club: FanClubItem | null;
  onClose: () => void;
  onConfirmJoin: (club: FanClubItem) => void;
  onViewMembership: (clubId: string) => void;
}

export const JoinFanClubModal: React.FC<JoinFanClubModalProps> = ({
  club,
  onClose,
  onConfirmJoin,
  onViewMembership,
}) => {
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    setJoinedSuccess(false);
  }, [club?.id]);

  if (!club) return null;

  const handleConfirm = () => {
    onConfirmJoin(club);
    setJoinedSuccess(true);
  };

  return (
    <Modal
      isOpen={Boolean(club)}
      onClose={onClose}
      title={joinedSuccess ? 'Joined Fan Club!' : `Join ${club.name}`}
      subtitle={
        joinedSuccess
          ? `Welcome to ${club.hostName}'s community`
          : `Level ${club.clubLevel} · ${club.memberCount.toLocaleString()} fans`
      }
      maxWidth="md"
      className="bg-[#120726] border-purple-400/25"
    >
      {joinedSuccess ? (
        <div data-testid="fan-club-join-success" className="space-y-4 py-2 text-center">
          <div className="w-16 h-16 rounded-full mx-auto bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-black text-white">Welcome to {club.name}!</h4>
            <p className="text-xs text-purple-100/80 max-w-sm mx-auto leading-relaxed">
              Your local demo Fan Club membership with <strong className="text-white">{club.hostName}</strong> is now active.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-400/25 to-pink-500/20 border border-amber-300/45 text-xs font-black text-amber-200">
            <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Badge Unlocked: {club.badgeLabel} Lv.{club.clubLevel}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Done
            </Button>
            <Button
              variant="primary"
              size="sm"
              data-testid="join-success-view-membership-btn"
              onClick={() => {
                onClose();
                onViewMembership(club.id);
              }}
            >
              View Membership
            </Button>
          </div>
        </div>
      ) : (
        <div data-testid="fan-club-join-confirm-modal" className="space-y-4">
          {/* Host + Club Preview */}
          <div className="rounded-2xl bg-[#190B32] border border-white/10 p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-300/70 bg-[#251348] shrink-0">
              {club.hostAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={club.hostAvatarUrl} alt={club.hostName} className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-sm font-black">
                  {club.hostName.slice(0, 2)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white truncate">{club.hostName}</span>
                {club.hostVerified && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </div>
              <div className="text-[11px] text-purple-200/70 flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#FF4D8D]" />
                  {club.memberCount.toLocaleString()} fans
                </span>
                <span>·</span>
                <span className="text-amber-300 font-bold">Level {club.clubLevel}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-purple-200 shrink-0">
              Not Joined
            </span>
          </div>

          {/* Membership Benefits */}
          <div className="space-y-2">
            <div className="text-xs font-extrabold text-white">Membership Benefits</div>
            {club.benefits.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl bg-[#180A30] border border-white/10 px-3.5 py-2.5"
              >
                <span className="w-8 h-8 rounded-full bg-[#27124C] flex items-center justify-center shrink-0">
                  {b.iconKey === 'crown' ? (
                    <Crown className="w-4 h-4 text-amber-300" />
                  ) : b.iconKey === 'sparkle' ? (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  ) : (
                    <Heart className="w-4 h-4 text-[#FF4D8D]" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">{b.title}</div>
                  <div className="text-[11px] text-purple-200/65">{b.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-purple-200/60 rounded-2xl bg-[#140729] border border-white/5 px-3 py-2">
            Frontend Demo Mode: Joining updates your local browser session only and performs no real
            payment or coin deduction.
          </p>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              data-testid="confirm-join-fan-club-btn"
              onClick={handleConfirm}
            >
              Confirm Join
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

interface LeaveFanClubModalProps {
  club: FanClubItem | null;
  onClose: () => void;
  onConfirmLeave: (clubId: string) => void;
}

export const LeaveFanClubModal: React.FC<LeaveFanClubModalProps> = ({
  club,
  onClose,
  onConfirmLeave,
}) => {
  if (!club) return null;

  return (
    <Modal
      isOpen={Boolean(club)}
      onClose={onClose}
      title="Leave Fan Club?"
      subtitle={club.name}
      maxWidth="sm"
      className="bg-[#120726] border-red-400/25"
    >
      <div data-testid="fan-club-leave-confirm-modal" className="space-y-4">
        <div className="rounded-2xl bg-red-500/10 border border-red-400/30 p-3.5 flex items-start gap-2.5 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Leaving <strong>{club.name}</strong> removes its local demo fan badge and membership
            status from this session. You can rejoin anytime.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            data-testid="confirm-leave-fan-club-btn"
            onClick={() => {
              onConfirmLeave(club.id);
              onClose();
            }}
          >
            Leave Fan Club
          </Button>
        </div>
      </div>
    </Modal>
  );
};
