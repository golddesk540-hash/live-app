'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Copy, Share2, MessageCircle, Check } from 'lucide-react';
import { SquarePostItem } from './types';
import { ReportModal } from '../comments/ReportModal';
import { LocalDemoReport } from '../comments/types';

interface SquareShareModalProps {
  post: SquarePostItem | null;
  onClose: () => void;
  onCompleteShare: (postId: string, channel: string) => void;
}

export const SquareShareModal: React.FC<SquareShareModalProps> = ({
  post,
  onClose,
  onCompleteShare,
}) => {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const shareUrl = `https://kigolive.com/square?post=${post.id}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopied(true);
    onCompleteShare(post.id, 'Link copied');
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Modal
      isOpen={Boolean(post)}
      onClose={onClose}
      title="Share Square Post"
      subtitle={`Shared from ${post.creator.name}`}
      maxWidth="sm"
      className="bg-[#120726] border-purple-400/25"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#1A0D35] border border-white/10">
          <span className="text-xs text-purple-100/80 font-mono truncate">{shareUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1 rounded-full bg-[#FF1A6C] text-white text-xs font-bold shrink-0 inline-flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/inbox"
            onClick={() => onCompleteShare(post.id, 'Popo Inbox')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#1E0F3D] hover:bg-[#2A1655] border border-white/10 text-xs font-bold text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#FF4D8D]" />
            <span>Send via Inbox</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              onCompleteShare(post.id, 'Community Highlight');
              onClose();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#1E0F3D] hover:bg-[#2A1655] border border-white/10 text-xs font-bold text-white transition-colors"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span>Quick Repost</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

interface SquareReportModalProps {
  post: SquarePostItem | null;
  alreadyReported?: boolean;
  onClose: () => void;
  onConfirmReport: (report: Omit<LocalDemoReport, 'id' | 'submittedAt'>) => void;
}

export const SquareReportModal: React.FC<SquareReportModalProps> = ({
  post,
  alreadyReported = false,
  onClose,
  onConfirmReport,
}) => {
  return (
    <ReportModal
      target={
        post
          ? {
              type: 'post',
              id: post.id,
              postId: post.id,
              authorName: post.creator.name,
              authorHandle: post.creator.handle,
              authorAvatarUrl: post.creator.avatarUrl,
              previewText: post.text,
              timestamp: post.publishedAgo,
            }
          : null
      }
      alreadyReported={alreadyReported}
      onClose={onClose}
      onSubmitReport={onConfirmReport}
    />
  );
};
