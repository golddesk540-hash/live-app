'use client';

import React from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { MessageCircle, ExternalLink, Flag } from 'lucide-react';
import { CommentReplyItem, SquareCommentItem, SquarePostItem } from './types';
import { CommentCard } from '../comments/CommentCard';
import { CommentComposer } from '../comments/CommentComposer';
import { getTotalRepliesCount } from '../comments/commentsLocalStore';

interface SquareCommentsModalProps {
  post: SquarePostItem | null;
  isOpen: boolean;
  onClose: () => void;
  reportedCommentIds?: Set<string>;
  onAddComment: (postId: string, text: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onAddReply: (postId: string, commentId: string, text: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onCopyComment: (text: string) => void;
  onReportComment: (post: SquarePostItem, comment: SquareCommentItem) => void;
  onToggleReplyLike: (postId: string, commentId: string, replyId: string) => void;
  onDeleteReply: (postId: string, commentId: string, replyId: string) => void;
  onReportReply: (post: SquarePostItem, comment: SquareCommentItem, reply: CommentReplyItem) => void;
  onReportPost?: (post: SquarePostItem) => void;
}

export const SquareCommentsModal: React.FC<SquareCommentsModalProps> = ({
  post,
  isOpen,
  onClose,
  reportedCommentIds,
  onAddComment,
  onToggleCommentLike,
  onAddReply,
  onDeleteComment,
  onCopyComment,
  onReportComment,
  onToggleReplyLike,
  onDeleteReply,
  onReportReply,
  onReportPost,
}) => {
  if (!post) return null;

  const totalReplies = getTotalRepliesCount(post.comments);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comments (${post.comments.length})`}
      subtitle={`Post by ${post.creator.name}${totalReplies > 0 ? ` · ${totalReplies} replies` : ''} · Demo state`}
      maxWidth="lg"
      className="bg-[#120726] border-purple-400/25"
    >
      <div className="space-y-4">
        {/* Post Preview Summary */}
        <div className="rounded-2xl bg-[#1A0D35] border border-white/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-extrabold text-[#FF4D8D] uppercase tracking-wider">Post Preview</span>
            <div className="flex items-center gap-2">
              {onReportPost && (
                <button
                  type="button"
                  onClick={() => onReportPost(post)}
                  data-testid="comments-modal-report-post"
                  className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <Flag className="w-3 h-3" />
                  <span>Report Post</span>
                </button>
              )}
              <Link
                href={`/square/comments?post=${encodeURIComponent(post.id)}`}
                onClick={onClose}
                data-testid="comments-modal-open-full"
                className="inline-flex items-center gap-1 font-bold text-cyan-300 hover:text-white transition-colors"
              >
                <span>Full View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <p className="text-xs text-purple-100/85 line-clamp-2 break-words">{post.text}</p>
        </div>

        {/* Comments List */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {post.comments.length === 0 ? (
            <div
              data-testid="comments-empty-state"
              className="py-10 text-center text-xs text-purple-200/65 flex flex-col items-center gap-2 rounded-2xl bg-[#16092D]/60 border border-white/5"
            >
              <MessageCircle className="w-7 h-7 text-[#FF4D8D]" />
              <div className="font-bold text-white">No comments yet</div>
              <span className="max-w-xs text-[11px] text-purple-200/55">
                Start the conversation respectfully in Popo Square!
              </span>
            </div>
          ) : (
            post.comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                isCommentReported={Boolean(reportedCommentIds?.has(comment.id))}
                reportedReplyIds={reportedCommentIds}
                onToggleLike={(commentId) => onToggleCommentLike(post.id, commentId)}
                onAddReply={(commentId, text) => onAddReply(post.id, commentId, text)}
                onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)}
                onCopyComment={onCopyComment}
                onReportComment={(c) => onReportComment(post, c)}
                onToggleReplyLike={(commentId, replyId) =>
                  onToggleReplyLike(post.id, commentId, replyId)
                }
                onDeleteReply={(commentId, replyId) => onDeleteReply(post.id, commentId, replyId)}
                onReportReply={(c, r) => onReportReply(post, c, r)}
              />
            ))
          )}
        </div>

        {/* Composer */}
        <CommentComposer
          onSubmit={(text) => onAddComment(post.id, text)}
          inputTestId="square-comment-input"
          submitTestId="square-comment-submit"
        />
      </div>
    </Modal>
  );
};
