'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  DEFAULT_INVITE_MESSAGE,
  DEMO_INVITE_CODE,
  DEMO_INVITE_FULL_URL,
  DEMO_INVITE_SHORT_URL,
} from './mockInvitesData';
import { InviteChannelId } from './types';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Facebook,
  History,
  Info,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface ShareOptionConfig {
  id: InviteChannelId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}

const SHARE_OPTIONS: ShareOptionConfig[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    Icon: MessageCircle,
    accentClass: 'text-emerald-400',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: Facebook,
    accentClass: 'text-blue-400',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    Icon: Send,
    accentClass: 'text-cyan-300',
  },
  {
    id: 'sms',
    label: 'SMS',
    Icon: MessageSquare,
    accentClass: 'text-[#FF4D8D]',
  },
  {
    id: 'email',
    label: 'Email',
    Icon: Mail,
    accentClass: 'text-amber-300',
  },
  {
    id: 'copy_link',
    label: 'Copy Link',
    Icon: Copy,
    accentClass: 'text-purple-200',
  },
  {
    id: 'native_share',
    label: 'More',
    Icon: MoreHorizontal,
    accentClass: 'text-[#FF1A6C]',
  },
];

interface InviteSharePanelProps {
  message: string;
  onChangeMessage: (msg: string) => void;
  onRestoreDefaultMessage: () => void;
  onCopyText: (text: string, label: string) => Promise<void>;
  onOpenHistoryTab: () => void;
  onLogDemoShare: (channelLabel: string) => void;
}

export const InviteSharePanel: React.FC<InviteSharePanelProps> = ({
  message,
  onChangeMessage,
  onRestoreDefaultMessage,
  onCopyText,
  onOpenHistoryTab,
  onLogDemoShare,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState(message);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [channelNotice, setChannelNotice] = useState<{
    title: string;
    detail: string;
    href?: string;
    channelLabel: string;
  } | null>(null);

  const handleCopyLinkClick = async () => {
    await onCopyText(DEMO_INVITE_FULL_URL, 'Invite link');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleCopyCodeClick = async () => {
    await onCopyText(DEMO_INVITE_CODE, 'Invitation code');
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const handleCopyMessageClick = async () => {
    await onCopyText(message, 'Invitation message');
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 1800);
  };

  const handleTriggerChannel = async (channelId: InviteChannelId) => {
    const encodedMsg = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(DEMO_INVITE_FULL_URL);

    if (channelId === 'copy_link') {
      await handleCopyLinkClick();
      onLogDemoShare('Copy Link');
      return;
    }

    if (channelId === 'native_share') {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({
            title: 'Join me on Popo Live!',
            text: message,
            url: DEMO_INVITE_FULL_URL,
          });
          onLogDemoShare('Native Share');
          return;
        } catch (err) {
          const errName = err instanceof Error ? err.name : '';
          if (errName === 'AbortError') return;
        }
      }
      setChannelNotice({
        title: 'Browser Native Sharing Unavailable',
        detail:
          'This browser does not expose native device sharing here. Copy your invitation message or link cleanly using the buttons below.',
        channelLabel: 'More Sharing Options',
      });
      return;
    }

    const externalMap: Record<
      Exclude<InviteChannelId, 'copy_link' | 'native_share'>,
      { title: string; detail: string; href: string; label: string }
    > = {
      whatsapp: {
        title: 'WhatsApp App Not Confirmed in Browser',
        detail:
          'We cannot verify whether WhatsApp is installed or confirm message delivery from this web preview. You can copy the message safely or try opening WhatsApp Web manually.',
        href: `https://wa.me/?text=${encodedMsg}`,
        label: 'WhatsApp',
      },
      facebook: {
        title: 'Facebook External Share Preview',
        detail:
          'Direct app handoff cannot be confirmed in demo mode. Copy your invite link cleanly or launch the external share dialog manually.',
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        label: 'Facebook',
      },
      telegram: {
        title: 'Telegram External Share Preview',
        detail:
          'We cannot confirm whether Telegram is installed on this device. Copy the invitation message below or open Telegram manually.',
        href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`,
        label: 'Telegram',
      },
      sms: {
        title: 'SMS Composer Unavailable in Web Preview',
        detail:
          'Sending SMS automatically is not supported on web browsers without an active carrier handler. Copy your invite message to paste into your Messages app.',
        href: `sms:?body=${encodedMsg}`,
        label: 'SMS',
      },
      email: {
        title: 'Email Client Required',
        detail:
          'If no default mail app is configured, your browser cannot deliver emails directly. Copy the invite message cleanly or open your mail app below.',
        href: `mailto:?subject=${encodeURIComponent('Join me on Popo Live!')}&body=${encodedMsg}`,
        label: 'Email',
      },
    };

    const info = externalMap[channelId];
    setChannelNotice({
      title: info.title,
      detail: info.detail,
      href: info.href,
      channelLabel: info.label,
    });
  };

  const handleSaveEditedMessage = () => {
    const trimmed = draftMessage.trim();
    if (!trimmed) {
      setDraftMessage(DEFAULT_INVITE_MESSAGE);
      onChangeMessage(DEFAULT_INVITE_MESSAGE);
    } else {
      onChangeMessage(draftMessage);
    }
    setEditingMessage(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Hero Banner Card matching 08_08_invites.png */}
      <div
        data-testid="invite-hero-banner"
        className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 p-5 sm:p-6 text-center space-y-3 shadow-xl relative overflow-hidden"
      >
        <div className="w-12 h-12 rounded-2xl mx-auto bg-[#FF1A6C]/15 border border-[#FF1A6C]/40 flex items-center justify-center shadow-glow-pink">
          <Mail className="w-6 h-6 text-[#FF4D8D]" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
            Good times are better together
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/75 max-w-sm mx-auto">
            Invite friends to join Popo Live and connect across live streams &amp; party rooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            data-testid="banner-share-invite-btn"
            onClick={() => setShareSheetOpen(true)}
            className="px-7 py-2.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-xs sm:text-sm font-black shadow-glow-pink hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Invite Link</span>
          </button>

          <button
            type="button"
            data-testid="banner-invite-history-btn"
            onClick={onOpenHistoryTab}
            className="px-4 py-2.5 rounded-full bg-[#241046] hover:bg-[#31165E] border border-purple-400/25 text-xs font-bold text-purple-100 inline-flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-amber-300" />
            <span>Invite History</span>
          </button>
        </div>
      </div>

      {/* Personal Invite Link & Demo Code Box matching 08_08_invites.png */}
      <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-extrabold text-white">Your invite link</h3>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/35 text-[10px] font-extrabold text-amber-200 uppercase">
            Demo Invite Code
          </span>
        </div>

        <div className="rounded-2xl bg-[#220E45] border border-purple-400/25 px-3.5 py-3 flex items-center justify-between gap-2">
          <span
            data-testid="personal-invite-url-text"
            className="text-xs sm:text-sm font-semibold text-white truncate select-all"
          >
            {DEMO_INVITE_SHORT_URL}
          </span>
          <button
            type="button"
            data-testid="copy-invite-link-btn"
            onClick={handleCopyLinkClick}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold inline-flex items-center gap-1 shrink-0 transition-all ${
              copiedLink
                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/45'
                : 'text-[#FF4D8D] hover:bg-[#FF1A6C]/15'
            }`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap rounded-2xl bg-[#110523] border border-white/10 px-3.5 py-2.5">
          <div className="text-xs">
            <span className="text-purple-200/60">Invite code: </span>
            <span data-testid="personal-invite-code" className="font-mono font-black text-amber-300">
              {DEMO_INVITE_CODE}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="copy-invite-code-btn"
              onClick={handleCopyCodeClick}
              className="px-3 py-1 rounded-full bg-[#241046] hover:bg-[#311761] border border-white/10 text-[11px] font-bold text-purple-100 inline-flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerChannel('native_share')}
              className="px-3 py-1 rounded-full bg-[#FF1A6C]/20 hover:bg-[#FF1A6C] border border-[#FF1A6C]/45 text-[11px] font-bold text-[#FF6BA3] hover:text-white transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Invite Friends Using Grid matching 08_08_invites.png */}
      <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-white">Invite friends using</h3>
          <span className="text-[11px] text-purple-200/55">7 channels supported</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 pt-1">
          {SHARE_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`share-channel-${opt.id}`}
                onClick={() => handleTriggerChannel(opt.id)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-11 h-11 rounded-full bg-[#26124A] group-hover:bg-[#341963] border border-purple-400/25 group-hover:border-[#FF1A6C]/60 flex items-center justify-center transition-all shadow-md">
                  <Icon className={`w-4 h-4 ${opt.accentClass}`} />
                </div>
                <span className="text-[10px] font-semibold text-purple-100/80 group-hover:text-white text-center leading-tight">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Invitation Message Preview & Local Editor */}
      <div className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF4D8D]" />
            <h3 className="text-sm font-extrabold text-white">Invitation Message Preview</h3>
          </div>

          <div className="flex items-center gap-1.5">
            {!editingMessage && (
              <button
                type="button"
                data-testid="edit-invite-message-btn"
                onClick={() => {
                  setDraftMessage(message);
                  setEditingMessage(true);
                }}
                className="px-2.5 py-1 rounded-full bg-[#241046] hover:bg-[#311761] border border-white/10 text-[11px] font-bold text-purple-100 inline-flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3 text-cyan-300" />
                <span>Edit Message</span>
              </button>
            )}

            <button
              type="button"
              data-testid="restore-default-message-btn"
              onClick={() => {
                setDraftMessage(DEFAULT_INVITE_MESSAGE);
                setEditingMessage(false);
                onRestoreDefaultMessage();
              }}
              className="px-2.5 py-1 rounded-full bg-[#241046] hover:bg-[#311761] border border-white/10 text-[11px] font-bold text-amber-200 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Default</span>
            </button>
          </div>
        </div>

        {editingMessage ? (
          <div className="space-y-2">
            <textarea
              data-testid="invite-message-textarea"
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              rows={5}
              className="w-full rounded-2xl bg-[#0F0521] border border-[#FF1A6C]/45 focus:border-[#FF1A6C] px-3.5 py-2.5 text-xs text-white leading-relaxed outline-none resize-y"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingMessage(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                data-testid="save-invite-message-btn"
                onClick={handleSaveEditedMessage}
              >
                Save Message
              </Button>
            </div>
          </div>
        ) : (
          <div
            data-testid="invite-message-preview-box"
            className="rounded-2xl bg-[#100523] border border-purple-400/20 px-4 py-3 text-xs text-purple-100/90 whitespace-pre-line leading-relaxed"
          >
            {message}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] text-purple-200/55">
            Preview saved locally in demo mode.
          </span>
          <button
            type="button"
            data-testid="copy-invite-message-btn"
            onClick={handleCopyMessageClick}
            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-sm hover:brightness-110 inline-flex items-center gap-1.5"
          >
            {copiedMsg ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMsg ? 'Message Copied' : 'Copy Message'}</span>
          </button>
        </div>
      </div>

      {/* Invite Tip Box matching 08_08_invites.png */}
      <div className="rounded-3xl bg-[#130628]/95 border border-purple-400/25 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-extrabold text-white">Invite tip</h4>
          <p className="text-[11px] text-purple-200/70 mt-0.5">
            Only invite people you know and trust. Demo invitation links shown here do not generate server rewards.
          </p>
        </div>
      </div>

      {/* Share Sheet Modal */}
      <Modal
        isOpen={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
        title="Share Your Popo Live Invite"
        maxWidth="md"
      >
        <div data-testid="share-options-modal" className="space-y-4">
          <p className="text-xs text-purple-200/75 leading-relaxed">
            Choose a sharing method below. Native device sharing runs where browser permissions support it; unsupported apps display clear instructions rather than faking delivery.
          </p>

          <div className="grid grid-cols-4 gap-3">
            {SHARE_OPTIONS.map((opt) => {
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setShareSheetOpen(false);
                    handleTriggerChannel(opt.id);
                  }}
                  className="rounded-2xl bg-[#1A0B36] hover:bg-[#28124F] border border-purple-400/20 p-3 flex flex-col items-center gap-2 transition-colors"
                >
                  <Icon className={`w-5 h-5 ${opt.accentClass}`} />
                  <span className="text-[11px] font-bold text-white">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setShareSheetOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Truthful External/Unsupported Channel Fallback Notice Modal */}
      <Modal
        isOpen={Boolean(channelNotice)}
        onClose={() => setChannelNotice(null)}
        title={channelNotice?.title || 'Share Notice'}
        maxWidth="md"
      >
        {channelNotice && (
          <div data-testid="share-fallback-modal" className="space-y-4">
            <div className="rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3.5 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-100/90 leading-relaxed">
                {channelNotice.detail}
              </p>
            </div>

            <div className="rounded-2xl bg-[#110523] border border-purple-400/20 p-3 text-xs text-purple-100/80 whitespace-pre-line max-h-36 overflow-y-auto">
              {message}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await onCopyText(message, 'Invitation message');
                  onLogDemoShare(channelNotice.channelLabel);
                  setChannelNotice(null);
                }}
              >
                Copy Message &amp; Log Demo
              </Button>

              {channelNotice.href && (
                <a
                  href={channelNotice.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onLogDemoShare(channelNotice.channelLabel)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink"
                >
                  <span>Try Opening Manually</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
