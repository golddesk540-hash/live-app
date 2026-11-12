'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

interface SquareCreatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishQuickPost: (text: string, includePhoto: boolean) => void;
}

export const SquareCreatePreviewModal: React.FC<SquareCreatePreviewModalProps> = ({
  isOpen,
  onClose,
  onPublishQuickPost,
}) => {
  const [text, setText] = useState('');
  const [includePhoto, setIncludePhoto] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onPublishQuickPost(text.trim(), includePhoto);
    setText('');
    setIncludePhoto(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Square Post"
      subtitle="Module 8.4 Create Tools entry point • Local demo preview post"
      maxWidth="md"
      className="bg-[#120726] border-purple-400/25"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-[#1A0D35] border border-purple-400/20 p-3 space-y-2 text-xs text-purple-200/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF4D8D] shrink-0" />
            <span>Need multi-photo galleries, video playback preview, or audience controls?</span>
          </div>
          <Link
            href="/square/create"
            onClick={onClose}
            data-testid="modal-open-create-studio"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FF4D8D] hover:text-white transition-colors"
          >
            <span>Open Module 8.4 Create Post Studio ↗</span>
          </Link>
        </div>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="square-quick-post-input"
          placeholder="What would you like to share with the Popo Live community?"
          className="w-full bg-[#0C041C] text-white placeholder:text-purple-200/45 text-sm rounded-2xl p-3.5 border border-purple-400/20 focus:border-[#FF1A6C] outline-none resize-none"
        />

        <label className="flex items-center gap-2 text-xs font-semibold text-purple-100 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includePhoto}
            onChange={(e) => setIncludePhoto(e.target.checked)}
            className="accent-[#FF1A6C] rounded"
          />
          <ImageIcon className="w-3.5 h-3.5 text-[#FF4D8D]" />
          <span>Attach demo concert stage photo preview</span>
        </label>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!text.trim()}>
            Publish to Square
          </Button>
        </div>
      </form>
    </Modal>
  );
};
