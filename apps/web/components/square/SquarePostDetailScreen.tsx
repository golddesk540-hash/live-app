'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  INITIAL_SQUARE_POSTS,
  TRENDING_TOPICS,
} from './mockSquareData';
import { loadLocalSquarePosts } from './squareLocalStore';
import {
  loadLocalFollowedCreatorIds,
  saveLocalFollowedCreatorIds,
} from './squareDiscoveryData';
import { SquareCreator, SquarePostItem } from './types';
import { SquarePostCard } from './SquarePostCard';
import { SquareReportModal, SquareShareModal } from './SquareShareReportModal';
import { SquareWebFooter, SquareWebNavbar } from './SquareWebNavbar';
import {
  addCommentToPosts,
  addReplyToPosts,
  deleteCommentInPosts,
  deleteReplyInPosts,
  loadLocalCommentsMap,
  loadLocalDemoReports,
  saveLocalCommentsMap,
  saveLocalDemoReports,
  toggleCommentLikeInPosts,
  toggleReplyLikeInPosts,
} from '../comments/commentsLocalStore';
import { CommentCard } from '../comments/CommentCard';
import { CommentComposer } from '../comments/CommentComposer';
import { ReportModal } from '../comments/ReportModal';
import { CommentReplyItem, LocalDemoReport, ReportTarget, SquareCommentItem } from '../comments/types';
import { ProfilePreviewModal } from '@/components/inbox/ProfilePreviewModal';
import { InboxUserProfile } from '@/components/inbox/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft,
  Compass,
  Crown,
  Flag,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
} from 'lucide-react';

function mapCreatorToInboxProfile(c: SquareCreator): InboxUserProfile {
  return {
    id: c.id,
    name: c.name,
    handle: c.handle,
    poppoId: c.poppoId,
    avatarUrl: c.avatarUrl,
    avatarColor: c.avatarColor,
    ringColor: c.ringColor,
    status: c.status,
    lastSeenText: c.status === 'live' ? 'In Live Room' : c.status === 'online' ? 'Online now' : 'Offline',
    bio: c.bio,
    countryFlag: c.countryFlag,
    countryName: c.countryName,
    level: c.level,
    roleTag: c.roleTag,
    followersCount: c.followersCount,
    followingCount: c.followingCount,
    isVip: c.isVip,
    isOfficial: false,
  };
}

interface SquarePostDetailScreenProps {
  postId: string;
}

export const SquarePostDetailScreen: React.FC<SquarePostDetailScreenProps> = ({ postId }) => {
  const [posts, setPosts] = useState<SquarePostItem[]>(INITIAL_SQUARE_POSTS);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [demoReports, setDemoReports] = useState<LocalDemoReport[]>([]);
  const [sharePost, setSharePost] = useState<SquarePostItem | null>(null);
  const [reportPost, setReportPost] = useState<SquarePostItem | null>(null);
  const [commentReportTarget, setCommentReportTarget] = useState<ReportTarget | null>(null);
  const [previewCreator, setPreviewCreator] = useState<SquareCreator | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ post: SquarePostItem; imageIndex: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const localPosts = loadLocalSquarePosts();
    const commentsMap = loadLocalCommentsMap();
    const savedReports = loadLocalDemoReports();

    setPosts((prev) => {
      const ids = new Set(localPosts.map((p) => p.id));
      const merged = [...localPosts, ...prev.filter((p) => !ids.has(p.id))];
      if (Object.keys(commentsMap).length === 0) return merged;
      return merged.map((p) => (commentsMap[p.id] ? { ...p, comments: commentsMap[p.id] } : p));
    });
    setFollowedIds(loadLocalFollowedCreatorIds());
    if (savedReports.length > 0) setDemoReports(savedReports);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  const post = useMemo(
    () => posts.find((item) => item.id === postId) || null,
    [posts, postId]
  );

  const relatedPosts = useMemo(
    () => posts.filter((item) => item.id !== postId).slice(0, 3),
    [posts, postId]
  );

  const reportedTargetIds = useMemo(
    () => new Set(demoReports.map((r) => `${r.targetType}:${r.targetId}`)),
    [demoReports]
  );

  const reportedCommentIds = useMemo(
    () => new Set(demoReports.filter((r) => r.targetType === 'comment').map((r) => r.targetId)),
    [demoReports]
  );

  const handleToggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: Math.max(0, p.likesCount + (p.isLiked ? -1 : 1)),
            }
          : p
      )
    );
  };

  const handleToggleSave = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const nextSaved = !p.isSaved;
        showToast(nextSaved ? 'Saved post locally' : 'Removed from saved posts');
        return { ...p, isSaved: nextSaved };
      })
    );
  };

  const handleToggleFollow = (creator: SquareCreator) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(creator.id)) {
        next.delete(creator.id);
        showToast(`Unfollowed ${creator.name}`);
      } else {
        next.add(creator.id);
        showToast(`Following ${creator.name}`);
      }
      saveLocalFollowedCreatorIds(next);
      return next;
    });
  };

  const handleAddComment = (text: string) => {
    if (!post) return;
    setPosts((prev) => {
      const next = addCommentToPosts(prev, post.id, text);
      saveLocalCommentsMap(next);
      return next;
    });
    showToast('Comment posted to post details');
  };

  const handleToggleCommentLike = (commentId: string) => {
    if (!post) return;
    setPosts((prev) => {
      const next = toggleCommentLikeInPosts(prev, post.id, commentId);
      saveLocalCommentsMap(next);
      return next;
    });
  };

  const handleAddReply = (commentId: string, text: string) => {
    if (!post) return;
    setPosts((prev) => {
      const next = addReplyToPosts(prev, post.id, commentId, text);
      saveLocalCommentsMap(next);
      return next;
    });
    showToast('Reply added');
  };

  const handleDeleteComment = (commentId: string) => {
    if (!post) return;
    setPosts((prev) => {
      const next = deleteCommentInPosts(prev, post.id, commentId);
      saveLocalCommentsMap(next);
      return next;
    });
    showToast('Comment deleted');
  };

  const handleToggleReplyLike = (commentId: string, replyId: string) => {
    if (!post) return;
    setPosts((prev) => {
      const next = toggleReplyLikeInPosts(prev, post.id, commentId, replyId);
      saveLocalCommentsMap(next);
      return next;
    });
  };

  const handleDeleteReply = (commentId: string, replyId: string) => {
    if (!post) return;
    setPosts((prev) => {
      const next = deleteReplyInPosts(prev, post.id, commentId, replyId);
      saveLocalCommentsMap(next);
      return next;
    });
    showToast('Reply deleted');
  };

  const handleSubmitDemoReport = (input: Omit<LocalDemoReport, 'id' | 'submittedAt'>) => {
    const newReport: LocalDemoReport = {
      ...input,
      id: `rep_detail_${Date.now()}`,
      submittedAt: 'Just now',
    };
    setDemoReports((prev) => {
      const next = [newReport, ...prev];
      saveLocalDemoReports(next);
      return next;
    });
    showToast('Safety report submitted (demo preview)');
  };

  return (
    <div
      data-testid="square-post-detail-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-16 lg:pb-0"
    >
      <SquareWebNavbar activeSection="post" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-purple-200/70">
            <Link
              href="/square"
              data-testid="post-detail-back-square"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#190B33] hover:bg-[#26124A] border border-white/10 text-white font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Square
            </Link>
            <span>/</span>
            <Link href="/square/discovery" className="hover:text-white font-semibold">
              Discovery
            </Link>
            <span>/</span>
            <span className="text-[#FF4D8D] font-bold">Post Details</span>
          </div>
        </div>

        {!post ? (
          <div
            data-testid="post-detail-not-found"
            className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-8"
          >
            <EmptyState
              icon={<Compass className="w-8 h-8" />}
              title="Post Not Found"
              description="This community post could not be located in the local demo feed."
              actionLabel="Browse Square Discovery"
              onAction={() => {
                if (typeof window !== 'undefined') window.location.href = '/square/discovery';
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* LEFT COLUMN: Reused SquarePostCard + Inline Comments Section (8.5 Reuse) */}
            <div className="space-y-5 min-w-0">
              <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white">Post Details</h1>
                    <p className="text-xs text-purple-200/65">
                      Community post by {post.creator.name} ({post.creator.handle})
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="post-detail-report-btn"
                    onClick={() => setReportPost(post)}
                    className="px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-amber-500/15 border border-amber-400/25 text-xs font-bold text-amber-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report Post</span>
                  </button>
                </div>

                {/* REUSE MODULE 8.3 SquarePostCard */}
                <SquarePostCard
                  post={post}
                  isFollowed={followedIds.has(post.creator.id)}
                  onToggleLike={handleToggleLike}
                  onToggleSave={handleToggleSave}
                  onToggleFollow={handleToggleFollow}
                  onOpenComments={() => {
                    const el = document.getElementById('post-detail-comments-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onOpenShare={(p) => setSharePost(p)}
                  onOpenReport={(p) => setReportPost(p)}
                  onHidePost={() => showToast('Return to Square Feed to hide posts from timeline')}
                  onCopyLink={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href).catch(() => {});
                    }
                    showToast('Post link copied!');
                  }}
                  onPreviewCreator={setPreviewCreator}
                  onPreviewMedia={(p, idx = 0) => setMediaPreview({ post: p, imageIndex: idx })}
                />
              </div>

              {/* REUSE MODULE 8.5 CommentComposer & CommentCard Inline */}
              <section
                id="post-detail-comments-section"
                data-testid="post-detail-comments-panel"
                className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#FF4D8D]" />
                    <span>Comments ({post.comments.length})</span>
                  </h2>
                  <Link
                    href={`/square/comments?post=${post.id}`}
                    className="text-xs font-bold text-[#FF4D8D] hover:underline"
                  >
                    Moderate in Comments View ↗
                  </Link>
                </div>

                <CommentComposer
                  onSubmit={handleAddComment}
                  placeholder={`Add a comment on ${post.creator.name}'s post...`}
                  inputTestId="detail-comment-input"
                  submitTestId="detail-comment-submit"
                />

                {post.comments.length === 0 ? (
                  <EmptyState
                    icon={<MessageCircle className="w-7 h-7" />}
                    title="No comments yet"
                    description="Start the conversation with a kind comment above!"
                  />
                ) : (
                  <div className="space-y-3" data-testid="detail-comments-list">
                    {post.comments.map((comment: SquareCommentItem) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        isCommentReported={reportedCommentIds.has(comment.id)}
                        reportedReplyIds={reportedCommentIds}
                        onToggleLike={handleToggleCommentLike}
                        onAddReply={handleAddReply}
                        onDeleteComment={handleDeleteComment}
                        onCopyComment={(txt) => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(txt).catch(() => {});
                          }
                          showToast('Comment copied!');
                        }}
                        onReportComment={(c) =>
                          setCommentReportTarget({
                            type: 'comment',
                            id: c.id,
                            postId: post.id,
                            authorName: c.authorName,
                            authorHandle: c.authorHandle,
                            authorAvatarUrl: c.authorAvatarUrl,
                            authorInitials: c.authorInitials,
                            authorColor: c.authorColor,
                            previewText: c.text,
                            timestamp: c.timestamp,
                          })
                        }
                        onToggleReplyLike={handleToggleReplyLike}
                        onDeleteReply={handleDeleteReply}
                        onReportReply={(_c, reply: CommentReplyItem) =>
                          setCommentReportTarget({
                            type: 'comment',
                            id: reply.id,
                            postId: post.id,
                            authorName: reply.authorName,
                            authorAvatarUrl: reply.authorAvatarUrl,
                            authorInitials: reply.authorInitials,
                            authorColor: reply.authorColor,
                            previewText: reply.text,
                            timestamp: reply.timestamp,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT SIDEBAR: Author Summary & Related Community Posts */}
            <aside className="space-y-5 lg:sticky lg:top-20">
              <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#241046] border-2 border-[#FF1A6C] shrink-0">
                    {post.creator.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.creator.avatarUrl} alt={post.creator.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center font-black">
                        {post.creator.name.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-white truncate">{post.creator.name}</h3>
                      {post.creator.isVerified && <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                      {post.creator.isVip && <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-purple-200/65">{post.creator.handle} · ID {post.creator.poppoId}</p>
                  </div>
                </div>

                <p className="text-xs text-purple-100/80 leading-relaxed">{post.creator.bio}</p>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-2xl bg-[#190B33] border border-white/5 py-2">
                    <p className="font-black text-white">{post.creator.followersCount}</p>
                    <p className="text-[10px] text-purple-200/60">Followers</p>
                  </div>
                  <div className="rounded-2xl bg-[#190B33] border border-white/5 py-2">
                    <p className="font-black text-white">Lv.{post.creator.level}</p>
                    <p className="text-[10px] text-purple-200/60">{post.creator.roleTag}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(post.creator)}
                    data-testid="detail-author-follow-btn"
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all ${
                      followedIds.has(post.creator.id)
                        ? 'bg-[#25124A] border border-purple-300/25 text-purple-100'
                        : 'bg-[#FF1A6C] text-white shadow-glow-pink'
                    }`}
                  >
                    {followedIds.has(post.creator.id) ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Follow Author
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewCreator(post.creator)}
                    className="px-3 py-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100"
                  >
                    Profile
                  </button>
                </div>
              </div>

              {/* Related Posts */}
              <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-5 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF4D8D]" />
                  <span>More in Square Discovery</span>
                </h3>

                <div className="space-y-2.5">
                  {relatedPosts.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/square/post/${rel.id}`}
                      data-testid={`related-post-link-${rel.id}`}
                      className="block rounded-2xl bg-[#190B33] hover:bg-[#25124A] border border-white/5 p-3 space-y-1 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-white">{rel.creator.name}</span>
                        <span className="text-purple-200/50">{rel.publishedAgo}</span>
                      </div>
                      <p className="text-xs text-purple-100/80 line-clamp-2">{rel.text}</p>
                    </Link>
                  ))}
                </div>

                <Link
                  href="/square/discovery"
                  className="block w-full py-2 text-center rounded-full bg-[#1D0D3B] hover:bg-[#2A1554] border border-purple-400/20 text-xs font-bold text-[#FF4D8D]"
                >
                  Explore Full Discovery Hub →
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <SquareWebFooter />

      <SquareShareModal
        post={sharePost}
        onClose={() => setSharePost(null)}
        onCompleteShare={(_id, ch) => showToast(`Shared post (${ch})`)}
      />

      <SquareReportModal
        post={reportPost}
        alreadyReported={Boolean(reportPost && reportedTargetIds.has(`post:${reportPost.id}`))}
        onClose={() => setReportPost(null)}
        onConfirmReport={handleSubmitDemoReport}
      />

      <ReportModal
        target={commentReportTarget}
        alreadyReported={Boolean(
          commentReportTarget &&
            reportedTargetIds.has(`${commentReportTarget.type}:${commentReportTarget.id}`)
        )}
        onClose={() => setCommentReportTarget(null)}
        onSubmitReport={handleSubmitDemoReport}
      />

      <ProfilePreviewModal
        user={previewCreator ? mapCreatorToInboxProfile(previewCreator) : null}
        isOpen={Boolean(previewCreator)}
        onClose={() => setPreviewCreator(null)}
        onMessageUser={(u) => showToast(`Open Inbox to message ${u.name}`)}
      />

      {mediaPreview && (
        <Modal
          isOpen={Boolean(mediaPreview)}
          onClose={() => setMediaPreview(null)}
          title={mediaPreview.post.videoTitle || `Post by ${mediaPreview.post.creator.name}`}
          subtitle={mediaPreview.post.publishedAgo}
          maxWidth="lg"
          className="bg-[#120726] border-purple-400/25"
        >
          {mediaPreview.post.mediaType === 'video' && mediaPreview.post.videoThumbnailUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaPreview.post.videoThumbnailUrl}
                alt={mediaPreview.post.videoTitle || 'Video preview'}
                className="w-full max-h-[380px] object-cover"
              />
              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center text-white gap-2">
                <div className="w-16 h-16 rounded-full bg-[#FF1A6C] flex items-center justify-center shadow-glow-pink">
                  <Play className="w-7 h-7 fill-white ml-0.5" />
                </div>
              </div>
            </div>
          ) : mediaPreview.post.images?.[mediaPreview.imageIndex] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaPreview.post.images[mediaPreview.imageIndex]}
              alt="Post media preview"
              className="w-full max-h-[420px] object-cover rounded-2xl border border-white/10"
            />
          ) : null}
        </Modal>
      )}

      {toast && (
        <div
          data-testid="post-detail-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap pointer-events-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
