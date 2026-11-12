'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Heart,
  MoreVertical,
  Reply,
  Copy,
  Flag,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { CommentReplyItem, SquareCommentItem } from './types';
import { CommentComposer } from './CommentComposer';

interface CommentCardProps {
  comment: SquareCommentItem;
  isCommentReported?: boolean;
  reportedReplyIds?: Set<string>;
  onToggleLike: (commentId: string) => void;
  onAddReply: (commentId: string, text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onCopyComment: (text: string) => void;
  onReportComment: (comment: SquareCommentItem) => void;
  onToggleReplyLike: (commentId: string, replyId: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
  onReportReply: (comment: SquareCommentItem, reply: CommentReplyItem) => void;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isCommentReported = false,
  reportedReplyIds,
  onToggleLike,
  onAddReply,
  onDeleteComment,
  onCopyComment,
  onReportComment,
  onToggleReplyLike,
  onDeleteReply,
  onReportReply,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [repliesMode, setRepliesMode] = useState<'collapsed' | 'preview' | 'expanded'>(
    (comment.replies?.length || 0) > 0 ? 'preview' : 'collapsed'
  );
  const replyContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (replyOpen && replyContainerRef.current) {
      replyContainerRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [replyOpen]);

  useEffect(() => {
    if (menuOpen && menuRef.current) {
      menuRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [menuOpen]);

  const replies = comment.replies || [];
  const hasText = Boolean(comment.text && comment.text.trim().length > 0);
  const visibleReplies =
    repliesMode === 'expanded'
      ? replies
      : repliesMode === 'preview'
      ? replies.slice(0, 1)
      : [];

  const handleOpenReply = () => {
    setMenuOpen(false);
    setReplyOpen((v) => !v);
    setRepliesMode('expanded');
  };

  return (
    <div
      data-testid={`square-comment-${comment.id}`}
      className="rounded-2xl bg-[#16092D]/95 border border-purple-400/20 p-3.5 sm:p-4 transition-all hover:border-purple-400/35 relative"
    >
      <div className="flex items-start gap-3">
        {/* Ringed Profile Avatar (Matches 08_05_comments_and_reports.png) */}
        <div className="p-[2px] rounded-full bg-gradient-to-tr from-[#9333EA] to-[#FF1A6C] shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#120624] bg-[#251348] flex items-center justify-center">
            {comment.authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.authorAvatarUrl}
                alt={comment.authorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className={`w-full h-full flex items-center justify-center text-xs font-extrabold text-white bg-gradient-to-br ${comment.authorColor}`}
              >
                {comment.authorInitials}
              </span>
            )}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                  {comment.authorName}
                </span>
                {comment.isOwn && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[9px] font-bold text-[#FF6BA3]">
                    You
                  </span>
                )}
                {isCommentReported && (
                  <span
                    data-testid={`comment-reported-badge-${comment.id}`}
                    className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[9px] font-bold text-amber-300"
                  >
                    Reported (Demo)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-purple-200/50 mt-0.5">
                {comment.authorHandle ? `${comment.authorHandle} · ` : ''}
                {comment.timestamp}
              </div>
            </div>

            {/* Comment More Options Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                data-testid={`comment-more-btn-${comment.id}`}
                aria-label="Comment options menu"
                className="p-1.5 rounded-full text-purple-200/65 hover:text-white hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  data-testid={`comment-more-menu-${comment.id}`}
                  className="absolute right-0 mt-1 w-44 rounded-2xl bg-[#0F0521] border border-purple-400/30 shadow-2xl p-1.5 z-50 space-y-0.5 scroll-mb-32 scroll-mt-24"
                >
                  <button
                    type="button"
                    onClick={handleOpenReply}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Reply className="w-3.5 h-3.5 text-[#FF4D8D]" />
                    <span>Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onCopyComment(comment.text);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy Comment</span>
                  </button>

                  {comment.isOwn ? (
                    <button
                      type="button"
                      data-testid={`delete-own-comment-${comment.id}`}
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteComment(comment.id);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete My Comment</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`report-comment-btn-${comment.id}`}
                      onClick={() => {
                        setMenuOpen(false);
                        onReportComment(comment);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{isCommentReported ? 'Report Submitted' : 'Report Comment'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comment Text or Empty Content State */}
          {hasText ? (
            <p className="text-xs sm:text-sm text-purple-100/90 mt-1.5 leading-relaxed break-words">
              {comment.text}
            </p>
          ) : (
            <p
              data-testid={`comment-empty-content-${comment.id}`}
              className="text-xs italic text-purple-200/45 mt-1.5"
            >
              No available comment content.
            </p>
          )}

          {/* Action Row: Like, Reply, Toggle Replies */}
          <div className="flex items-center flex-wrap gap-4 mt-2.5 pt-2 border-t border-white/5 text-xs">
            <button
              type="button"
              onClick={() => onToggleLike(comment.id)}
              data-testid={`comment-like-btn-${comment.id}`}
              className={`inline-flex items-center gap-1.5 font-bold transition-all active:scale-90 ${
                comment.isLiked ? 'text-[#FF1A6C]' : 'text-purple-200/70 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-[#FF1A6C]' : ''}`} />
              <span data-testid={`comment-like-count-${comment.id}`}>{comment.likes}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenReply}
              data-testid={`comment-reply-btn-${comment.id}`}
              className="inline-flex items-center gap-1 font-bold text-[#FF4D8D] hover:text-white transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>

            {replies.length > 0 && repliesMode === 'collapsed' && (
              <button
                type="button"
                onClick={() => setRepliesMode('expanded')}
                data-testid={`show-replies-btn-${comment.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-200/75 hover:text-white"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show replies ({replies.length})</span>
              </button>
            )}

            {repliesMode === 'preview' && replies.length > 1 && (
              <button
                type="button"
                onClick={() => setRepliesMode('expanded')}
                data-testid={`show-more-replies-btn-${comment.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-white"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show more replies ({replies.length - 1})</span>
              </button>
            )}

            {replies.length > 0 && repliesMode !== 'collapsed' && (
              <button
                type="button"
                onClick={() => setRepliesMode('collapsed')}
                data-testid={`hide-replies-btn-${comment.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-200/55 hover:text-purple-100 ml-auto"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide replies</span>
              </button>
            )}
          </div>

          {/* Inline Reply Input */}
          {replyOpen && (
            <div
              ref={replyContainerRef}
              className="mt-3 p-3 rounded-2xl bg-[#110624] border border-purple-400/20 scroll-mb-32 scroll-mt-24"
            >
              <CommentComposer
                compact
                autoFocus
                replyingToName={comment.authorName}
                onCancelReply={() => setReplyOpen(false)}
                inputTestId={`reply-input-${comment.id}`}
                submitTestId={`reply-submit-${comment.id}`}
                onSubmit={(replyText) => {
                  onAddReply(comment.id, replyText);
                  setReplyOpen(false);
                  setRepliesMode('expanded');
                }}
              />
            </div>
          )}

          {/* Nested Replies Thread */}
          {repliesMode !== 'collapsed' && (
            <div
              data-testid={`comment-replies-list-${comment.id}`}
              className="mt-3 pl-3 ml-1 sm:ml-2 border-l-2 border-[#FF1A6C]/35 space-y-2"
            >
              {replies.length === 0 ? (
                <div
                  data-testid={`comment-no-replies-${comment.id}`}
                  className="py-2 px-3 rounded-xl bg-[#110624]/80 border border-white/5 text-[11px] text-purple-200/55 flex items-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#FF4D8D] shrink-0" />
                  <span>No replies yet. Add a friendly reply above!</span>
                </div>
              ) : (
                visibleReplies.map((reply) => {
                  const replyReported = Boolean(reportedReplyIds?.has(reply.id));
                  return (
                    <div
                      key={reply.id}
                      data-testid={`comment-reply-${reply.id}`}
                      className="rounded-xl bg-[#120726]/95 border border-white/10 p-2.5 sm:p-3 flex items-start gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-purple-300/30 bg-[#251348] shrink-0 flex items-center justify-center">
                        {reply.authorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={reply.authorAvatarUrl}
                            alt={reply.authorName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span
                            className={`w-full h-full flex items-center justify-center text-[10px] font-extrabold text-white bg-gradient-to-br ${reply.authorColor}`}
                          >
                            {reply.authorInitials}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-extrabold text-white">
                              {reply.authorName}
                            </span>
                            {reply.isOwn && (
                              <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/20 text-[9px] font-bold text-[#FF6BA3]">
                                You
                              </span>
                            )}
                            <span className="text-[10px] text-purple-200/50">
                              replied to @{comment.authorName} · {reply.timestamp}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => onToggleReplyLike(comment.id, reply.id)}
                              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                reply.isLiked ? 'text-[#FF1A6C]' : 'text-purple-200/60 hover:text-white'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-[#FF1A6C]' : ''}`} />
                              <span>{reply.likes}</span>
                            </button>

                            {reply.isOwn ? (
                              <button
                                type="button"
                                onClick={() => onDeleteReply(comment.id, reply.id)}
                                aria-label="Delete my reply"
                                className="text-[10px] text-red-300/80 hover:text-red-200 p-1 rounded-full hover:bg-red-500/15"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onReportReply(comment, reply)}
                                aria-label="Report reply"
                                className={`text-[10px] p-1 rounded-full ${
                                  replyReported
                                    ? 'text-amber-300 bg-amber-500/15'
                                    : 'text-purple-200/60 hover:text-amber-300 hover:bg-amber-500/15'
                                }`}
                              >
                                <Flag className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-purple-100/85 mt-1 leading-relaxed break-words">
                          {reply.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
