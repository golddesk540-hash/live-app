'use client';

import React, { useState } from 'react';
import { Smile, Send, X, AlertCircle } from 'lucide-react';
import { COMMENT_EMOJI_OPTIONS } from './commentsLocalStore';

interface CommentComposerProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  replyingToName?: string | null;
  onCancelReply?: () => void;
  maxLength?: number;
  compact?: boolean;
  inputTestId?: string;
  submitTestId?: string;
  autoFocus?: boolean;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  onSubmit,
  placeholder = 'Write a respectful comment...',
  replyingToName = null,
  onCancelReply,
  maxLength = 300,
  compact = false,
  inputTestId = 'square-comment-input',
  submitTestId = 'square-comment-submit',
  autoFocus = false,
}) => {
  const [draft, setDraft] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned) {
      setValidationError(
        replyingToName
          ? `Please write a reply to ${replyingToName} before sending.`
          : 'Please write a comment before sending.'
      );
      return;
    }
    onSubmit(cleaned);
    setDraft('');
    setShowEmojis(false);
    setValidationError(null);
  };

  const handlePickEmoji = (emoji: string) => {
    setDraft((prev) => {
      const next = `${prev}${emoji}`;
      return next.length <= maxLength ? next : prev;
    });
    setValidationError(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? 'space-y-2' : 'space-y-2.5 pt-2 border-t border-white/10'}
    >
      {replyingToName && (
        <div
          data-testid="composer-reply-banner"
          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#220E44] border border-[#FF1A6C]/35 text-[11px]"
        >
          <span className="text-purple-100/90 truncate">
            Replying to <strong className="text-[#FF4D8D]">@{replyingToName}</strong>
          </span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              data-testid="composer-cancel-reply"
              aria-label="Cancel reply"
              className="text-purple-200/70 hover:text-white p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {showEmojis && (
        <div
          data-testid="comment-emoji-tray"
          className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-[#180A31] border border-purple-400/25"
        >
          {COMMENT_EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handlePickEmoji(emoji)}
              className="w-8 h-8 rounded-xl bg-[#241145] hover:bg-[#FF1A6C]/25 border border-white/5 text-base flex items-center justify-center transition-transform active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!compact && (
          <div
            title="Current demo user: You"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 border border-[#FF1A6C]/50 bg-gradient-to-br from-[#FF1A6C] to-[#7928CA] flex items-center justify-center text-[11px] font-black text-white shadow-sm"
          >
            ME
          </div>
        )}

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={draft}
            maxLength={maxLength}
            autoFocus={autoFocus}
            onChange={(e) => {
              setDraft(e.target.value);
              if (validationError) setValidationError(null);
            }}
            data-testid={inputTestId}
            placeholder={replyingToName ? `Write a reply to @${replyingToName}...` : placeholder}
            className={`w-full bg-[#0C041C] text-white placeholder:text-purple-200/45 text-xs sm:text-sm rounded-full pl-3.5 ${
              draft ? 'pr-16' : 'pr-9'
            } ${compact ? 'py-2' : 'py-2.5'} border ${
              validationError ? 'border-amber-400' : 'border-purple-400/25 focus:border-[#FF1A6C]'
            } outline-none transition-colors`}
          />

          <div className="absolute right-2 flex items-center gap-1">
            {draft.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  setValidationError(null);
                }}
                aria-label="Clear comment input"
                data-testid={`${inputTestId}-clear`}
                className="p-1 rounded-full text-purple-200/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowEmojis((v) => !v)}
              aria-label="Toggle emoji picker"
              data-testid={`${inputTestId}-emoji`}
              className={`p-1 rounded-full transition-colors ${
                showEmojis ? 'text-[#FF4D8D] bg-[#FF1A6C]/15' : 'text-purple-200/65 hover:text-white'
              }`}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          data-testid={submitTestId}
          className={`px-3.5 ${compact ? 'py-2' : 'py-2.5'} rounded-full text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-all ${
            draft.trim()
              ? 'bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white shadow-glow-pink hover:brightness-110 active:scale-95'
              : 'bg-[#251348] text-purple-200/75 border border-white/10 hover:border-[#FF1A6C]/50'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span className={compact ? 'hidden xs:inline' : ''}>{replyingToName ? 'Reply' : 'Send'}</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 px-1 text-[10px]">
        {validationError ? (
          <span
            data-testid="comment-empty-error"
            className="text-amber-300 font-semibold inline-flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 shrink-0" />
            {validationError}
          </span>
        ) : (
          <span className="text-purple-200/45">
            Local demo session • Stay kind in Popo Square
          </span>
        )}
        <span
          data-testid={`${inputTestId}-counter`}
          className={`font-mono shrink-0 ${
            draft.length >= maxLength ? 'text-amber-300 font-bold' : 'text-purple-200/55'
          }`}
        >
          {draft.length} / {maxLength}
        </span>
      </div>
    </form>
  );
};
