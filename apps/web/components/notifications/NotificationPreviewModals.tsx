'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ActivityNotificationItem } from './types';
import {
  Sparkles,
  Users,
  Radio,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';

interface InvitePreviewModalProps {
  item: ActivityNotificationItem | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const InvitePreviewModal: React.FC<InvitePreviewModalProps> = ({
  item,
  onClose,
  onShowToast,
}) => {
  const [inviteResponse, setInviteResponse] = useState<'pending' | 'accepted' | 'declined'>('pending');

  if (!item) return null;

  const handleCopyCode = () => {
    if (item.inviteCode && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(item.inviteCode).catch(() => {});
    }
    onShowToast(`Copied invite code ${item.inviteCode || 'PTY-DEMO'}`);
  };

  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} title="Party Room Invitation" maxWidth="md">
      <div data-testid="invite-preview-modal" className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#230E45] to-[#140729] border border-emerald-400/30 p-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.sender.avatarUrl}
            alt={item.sender.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white truncate">{item.sender.name}</p>
            <p className="text-xs text-purple-200/75 truncate">{item.sender.handle}</p>
            <p className="text-[11px] font-bold text-emerald-300 mt-0.5">
              Invited you to {item.inviteRoomTitle || 'Party Room'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#16092D] border border-purple-400/20 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-200/60 font-semibold">Room Name</span>
            <span className="text-white font-bold">{item.inviteRoomTitle}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-200/60 font-semibold">Demo Room Code</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 font-mono font-bold text-amber-300 hover:text-amber-200"
            >
              <span>{item.inviteCode || 'PTY-9482-LIVE'}</span>
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-200/60 font-semibold">Status</span>
            <span
              data-testid="invite-demo-status"
              className={`font-extrabold ${
                inviteResponse === 'accepted'
                  ? 'text-emerald-300'
                  : inviteResponse === 'declined'
                  ? 'text-rose-300'
                  : 'text-amber-300'
              }`}
            >
              {inviteResponse === 'accepted'
                ? 'Accepted (Local Demo)'
                : inviteResponse === 'declined'
                ? 'Declined (Local Demo)'
                : 'Awaiting Response'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            data-testid="invite-decline-btn"
            leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-300" />}
            onClick={() => {
              setInviteResponse('declined');
              onShowToast('Invitation declined locally');
            }}
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="sm"
            data-testid="invite-accept-btn"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => {
              setInviteResponse('accepted');
              onShowToast(`Accepted ${item.sender.name}'s party invite locally!`);
            }}
          >
            Accept Demo Invite
          </Button>
          <Link
            href="/party"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#241046] hover:bg-[#311761] border border-purple-400/30 text-xs font-bold text-purple-100"
          >
            <span>Open Party</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Modal>
  );
};

interface LivePreviewModalProps {
  item: ActivityNotificationItem | null;
  onClose: () => void;
}

export const LivePreviewModal: React.FC<LivePreviewModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} title="Live Activity Preview" maxWidth="md">
      <div data-testid="live-preview-modal" className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden border border-rose-400/40 bg-[#140729]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              item.postThumbnailUrl ||
              'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80'
            }
            alt={item.liveRoomTitle || 'Live Stream Preview'}
            className="w-full h-44 object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0418] via-transparent to-black/40" />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-lg">
              <Radio className="w-3 h-3 animate-pulse" /> LIVE DEMO
            </span>
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-[11px] font-bold text-white inline-flex items-center gap-1">
              <Users className="w-3 h-3 text-cyan-300" />
              {(item.liveViewerCount || 1200).toLocaleString()} watching
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.sender.avatarUrl}
              alt={item.sender.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-amber-300 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate">
                {item.liveRoomTitle || `${item.sender.name} Live Stream`}
              </p>
              <p className="text-xs text-purple-100/80 truncate">
                Host: {item.sender.name} · Room #{item.liveRoomId || '7001'}
              </p>
            </div>
          </div>
        </div>

        {item.liveTags && item.liveTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.liveTags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-[#241046] border border-purple-400/25 text-[11px] font-semibold text-purple-100 inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-[#FF4D8D]" />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-purple-200/60">
            Mock stream preview card using local frontend data.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Link
              href={item.action.href || '/live'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink"
            >
              <span>Browse Live Rooms</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};
