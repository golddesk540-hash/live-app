'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MoreVertical,
  Share2,
  Flag,
  Copy,
  EyeOff,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { INITIAL_SQUARE_POSTS } from '../square/mockSquareData';
import { loadLocalSquarePosts } from '../square/squareLocalStore';
import { SquareShareModal } from '../square/SquareShareReportModal';
import { CommentReplyItem, SquareCommentItem, SquarePostItem } from '../square/types';
import {
  addCommentToPosts,
  addReplyToPosts,
  clearLocalCommentsAndReports,
  deleteCommentInPosts,
  deleteReplyInPosts,
  getTotalRepliesCount,
  loadLocalCommentsMap,
  loadLocalDemoReports,
  saveLocalCommentsMap,
  saveLocalDemoReports,
  toggleCommentLikeInPosts,
  toggleReplyLikeInPosts,
} from './commentsLocalStore';
import { CommentCard } from './CommentCard';
import { CommentComposer } from './CommentComposer';
import { ReportModal } from './ReportModal';
import { LocalDemoReport, REPORT_REASON_OPTIONS, ReportTarget } from './types';

export const CommentsAndReportsScreen: React.FC = () => {
  const searchParams = useSearchParams();
  const initialPostId = searchParams.get('post');

  const [posts, setPosts] = useState<SquarePostItem[]>(INITIAL_SQUARE_POSTS);
  const [selectedPostId, setSelectedPostId] = useState<string>(
    initialPostId || INITIAL_SQUARE_POSTS[0].id
  );
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [demoReports, setDemoReports] = useState<LocalDemoReport[]>([]);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [sharePost, setSharePost] = useState<SquarePostItem | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
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
    if (savedReports.length > 0) {
      setDemoReports(savedReports);
    }
  }, []);

  useEffect(() => {
    if (initialPostId && posts.some((p) => p.id === initialPostId)) {
      setSelectedPostId(initialPostId);
    }
  }, [initialPostId, posts]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) || posts[0] || null,
    [posts, selectedPostId]
  );

  const reportedTargetKeys = useMemo(
    () => new Set(demoReports.map((r) => `${r.targetType}:${r.targetId}`)),
    [demoReports]
  );

  const reportedCommentIds = useMemo(
    () => new Set(demoReports.filter((r) => r.targetType === 'comment').map((r) => r.targetId)),
    [demoReports]
  );

  const updatePostsAndPersist = (updater: (prev: SquarePostItem[]) => SquarePostItem[]) => {
    setPosts((prev) => {
      const next = updater(prev);
      saveLocalCommentsMap(next);
      return next;
    });
  };

  const handleTogglePostLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextLiked = !p.isLiked;
        return {
          ...p,
          isLiked: nextLiked,
          likesCount: Math.max(0, p.likesCount + (nextLiked ? 1 : -1)),
        };
      })
    );
  };

  const handleTogglePostSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextSaved = !p.isSaved;
        showToast(nextSaved ? 'Post saved locally' : 'Removed from saved posts');
        return { ...p, isSaved: nextSaved };
      })
    );
  };

  const handleCopyLink = (postId: string) => {
    const link = `https://kigolive.com/square?post=${postId}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    showToast('Post link copied to clipboard');
  };

  const handleHidePost = (postId: string) => {
    setHiddenPostIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
    showToast('Post hidden from current view');
  };

  const handleCopyComment = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast('Comment text copied');
  };

  const handleSubmitDemoReport = (report: Omit<LocalDemoReport, 'id' | 'submittedAt'>) => {
    const entry: LocalDemoReport = {
      ...report,
      id: `rep_${Date.now()}`,
      submittedAt: 'Just now',
    };
    setDemoReports((prev) => {
      const next = [entry, ...prev];
      saveLocalDemoReports(next);
      return next;
    });
    showToast(`Local demo report logged (${report.reasonLabel})`);
  };

  const handleOpenPostReport = (post: SquarePostItem) => {
    setReportTarget({
      type: 'post',
      id: post.id,
      postId: post.id,
      authorName: post.creator.name,
      authorHandle: post.creator.handle,
      authorAvatarUrl: post.creator.avatarUrl,
      previewText: post.text,
      timestamp: post.publishedAgo,
    });
  };

  const handleOpenCommentReport = (post: SquarePostItem, comment: SquareCommentItem) => {
    setReportTarget({
      type: 'comment',
      id: comment.id,
      postId: post.id,
      authorName: comment.authorName,
      authorHandle: comment.authorHandle,
      authorAvatarUrl: comment.authorAvatarUrl,
      authorInitials: comment.authorInitials,
      authorColor: comment.authorColor,
      previewText: comment.text,
      timestamp: comment.timestamp,
    });
  };

  const handleOpenReplyReport = (
    post: SquarePostItem,
    _parent: SquareCommentItem,
    reply: CommentReplyItem
  ) => {
    setReportTarget({
      type: 'comment',
      id: reply.id,
      postId: post.id,
      authorName: reply.authorName,
      authorAvatarUrl: reply.authorAvatarUrl,
      authorInitials: reply.authorInitials,
      authorColor: reply.authorColor,
      previewText: reply.text,
      timestamp: reply.timestamp,
    });
  };

  const handleRestoreDemo = () => {
    clearLocalCommentsAndReports();
    setPosts(INITIAL_SQUARE_POSTS);
    setHiddenPostIds(new Set());
    setDemoReports([]);
    setHeaderMenuOpen(false);
    showToast('Comments & local demo reports reset');
  };

  const totalReplies = selectedPost ? getTotalRepliesCount(selectedPost.comments) : 0;
  const isPostHidden = selectedPost ? hiddenPostIds.has(selectedPost.id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130626] via-[#0B0418] to-[#070312] text-white flex flex-col pb-32 lg:pb-12">
      {/* Top Bar (Matches 08_05_comments_and_reports.png) */}
      <header className="sticky top-0 z-40 bg-[#120624]/95 backdrop-blur-xl border-b border-purple-400/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/square"
              data-testid="comments-back-to-square"
              aria-label="Back to Square"
              className="p-2 rounded-full bg-[#1E0F3B] hover:bg-[#2A1652] text-purple-100 border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full border-2 border-purple-200/80 bg-[#1D0D39] flex items-center justify-center shadow-glow-pink group-hover:scale-105 transition-transform">
                <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                Popo <span className="text-[#FF1A6C]">Live</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {selectedPost && (
              <>
                <button
                  type="button"
                  onClick={() => handleTogglePostSave(selectedPost.id)}
                  aria-label="Save post"
                  className={`p-2 rounded-full border transition-colors ${
                    selectedPost.isSaved
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/80'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${selectedPost.isSaved ? 'fill-amber-300' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePostLike(selectedPost.id)}
                  aria-label="Like post"
                  className={`p-2 rounded-full border transition-colors ${
                    selectedPost.isLiked
                      ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-[#FF4D8D]'
                      : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${selectedPost.isLiked ? 'fill-[#FF4D8D]' : ''}`} />
                </button>
              </>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                data-testid="comments-header-menu-btn"
                aria-label="Comments & Reports options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/80 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {headerMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-50 space-y-0.5">
                  {selectedPost && (
                    <button
                      type="button"
                      onClick={() => {
                        setHeaderMenuOpen(false);
                        handleOpenPostReport(selectedPost);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2"
                    >
                      <Flag className="w-3.5 h-3.5" /> Report Current Post
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRestoreDemo}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Reset Demo Thread
                  </button>
                  <Link
                    href="/square/create"
                    onClick={() => setHeaderMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" /> Create Post Studio
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {/* Heading matching 08_05_comments_and_reports.png */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Comments &amp; Reports
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
              Join the conversation safely
            </p>
          </div>

          {/* Post Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {posts.slice(0, 5).map((p) => {
              const active = p.id === selectedPost?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`switch-post-${p.id}`}
                  onClick={() => setSelectedPostId(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    active
                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] border-transparent text-white shadow-glow-pink'
                      : 'bg-[#170A2F] border-white/10 text-purple-200/75 hover:text-white'
                  }`}
                >
                  {p.creator.name.split(' ')[0]} ({p.comments.length})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* LEFT / MAIN THREAD COLUMN */}
          <section className="space-y-5">
            {selectedPost && isPostHidden ? (
              <div
                data-testid="post-hidden-empty-state"
                className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-8 text-center space-y-3"
              >
                <EyeOff className="w-8 h-8 text-purple-300 mx-auto" />
                <h2 className="text-base font-black text-white">Post Hidden in Demo Session</h2>
                <p className="text-xs text-purple-200/65 max-w-sm mx-auto">
                  You hid {selectedPost.creator.name}&apos;s post from this view.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setHiddenPostIds((prev) => {
                      const next = new Set(prev);
                      next.delete(selectedPost.id);
                      return next;
                    })
                  }
                  className="px-4 py-2 rounded-full bg-[#FF1A6C] text-white text-xs font-bold shadow-glow-pink"
                >
                  Unhide Post
                </button>
              </div>
            ) : selectedPost ? (
              <>
                {/* Top POST Summary Card (Matches 08_05_comments_and_reports.png) */}
                <div
                  data-testid="comments-screen-post-preview"
                  className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 p-4 sm:p-5 shadow-xl relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF1A6C]/50 bg-[#251348] shrink-0">
                        {selectedPost.creator.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedPost.creator.avatarUrl}
                            alt={selectedPost.creator.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-xs font-bold">
                            {selectedPost.creator.name.slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4D8D] block">
                          POST
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-extrabold text-white truncate">
                            {selectedPost.creator.name}
                          </span>
                          {selectedPost.creator.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-purple-200/55 mt-0.5">
                          {selectedPost.comments.length} comments
                          {totalReplies > 0 ? ` · ${totalReplies} replies` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Post Options Menu */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setPostMenuOpen((v) => !v)}
                        data-testid="comments-post-more-btn"
                        aria-label="Post options menu"
                        className="p-2 rounded-full text-purple-200/70 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {postMenuOpen && (
                        <div
                          data-testid="comments-post-more-menu"
                          className="absolute right-0 mt-1 w-48 rounded-2xl bg-[#0F0521] border border-purple-400/30 shadow-2xl p-1.5 z-50 space-y-0.5"
                        >
                          <button
                            type="button"
                            data-testid="comments-post-report-action"
                            onClick={() => {
                              setPostMenuOpen(false);
                              handleOpenPostReport(selectedPost);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2"
                          >
                            <Flag className="w-3.5 h-3.5" /> Report Post
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPostMenuOpen(false);
                              handleTogglePostSave(selectedPost.id);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                          >
                            <Bookmark className="w-3.5 h-3.5 text-[#FF4D8D]" />
                            {selectedPost.isSaved ? 'Unsave Post' : 'Save Post'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPostMenuOpen(false);
                              handleCopyLink(selectedPost.id);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copy Link
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPostMenuOpen(false);
                              handleHidePost(selectedPost.id);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 flex items-center gap-2"
                          >
                            <EyeOff className="w-3.5 h-3.5" /> Hide Post
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm sm:text-[15px] font-semibold text-white mt-3 leading-relaxed break-words">
                    {selectedPost.text}
                  </p>

                  {/* Engagement Bar matching 08_05_comments_and_reports.png */}
                  <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() => handleTogglePostLike(selectedPost.id)}
                        className={`inline-flex items-center gap-1.5 font-bold ${
                          selectedPost.isLiked ? 'text-[#FF1A6C]' : 'text-purple-200/75 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${selectedPost.isLiked ? 'fill-[#FF1A6C]' : ''}`} />
                        <span>Like ({selectedPost.likesCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSharePost(selectedPost)}
                        className="inline-flex items-center gap-1.5 font-semibold text-purple-200/75 hover:text-white"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      data-testid="comments-screen-report-post-btn"
                      onClick={() => handleOpenPostReport(selectedPost)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-amber-200 font-bold transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>
                        {reportedTargetKeys.has(`post:${selectedPost.id}`)
                          ? 'Reported (Demo)'
                          : 'Report Post'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Desktop inline composer */}
                <div className="hidden lg:block rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4">
                  <CommentComposer
                    onSubmit={(text) => {
                      updatePostsAndPersist((prev) => addCommentToPosts(prev, selectedPost.id, text));
                      showToast('Comment posted');
                    }}
                    inputTestId="desktop-comment-input"
                    submitTestId="desktop-comment-submit"
                  />
                </div>

                {/* Recent Comments Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Recent comments
                    </h2>
                    <span className="text-xs text-purple-200/60">
                      {selectedPost.comments.length} comment{selectedPost.comments.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {selectedPost.comments.length === 0 ? (
                    <div
                      data-testid="screen-no-comments-empty"
                      className="rounded-3xl bg-[#16092D]/85 border border-purple-400/20 py-10 px-4 text-center space-y-2"
                    >
                      <MessageCircle className="w-8 h-8 text-[#FF4D8D] mx-auto" />
                      <div className="text-sm font-black text-white">No comments yet</div>
                      <p className="text-xs text-purple-200/60 max-w-xs mx-auto">
                        Be the first to share kind thoughts on {selectedPost.creator.name}&apos;s post!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="comments-thread-list">
                      {selectedPost.comments.map((comment) => (
                        <CommentCard
                          key={comment.id}
                          comment={comment}
                          isCommentReported={reportedCommentIds.has(comment.id)}
                          reportedReplyIds={reportedCommentIds}
                          onToggleLike={(commentId) =>
                            updatePostsAndPersist((prev) =>
                              toggleCommentLikeInPosts(prev, selectedPost.id, commentId)
                            )
                          }
                          onAddReply={(commentId, text) => {
                            updatePostsAndPersist((prev) =>
                              addReplyToPosts(prev, selectedPost.id, commentId, text)
                            );
                            showToast('Reply added');
                          }}
                          onDeleteComment={(commentId) => {
                            updatePostsAndPersist((prev) =>
                              deleteCommentInPosts(prev, selectedPost.id, commentId)
                            );
                            showToast('Your demo comment was deleted');
                          }}
                          onCopyComment={handleCopyComment}
                          onReportComment={(c) => handleOpenCommentReport(selectedPost, c)}
                          onToggleReplyLike={(commentId, replyId) =>
                            updatePostsAndPersist((prev) =>
                              toggleReplyLikeInPosts(prev, selectedPost.id, commentId, replyId)
                            )
                          }
                          onDeleteReply={(commentId, replyId) => {
                            updatePostsAndPersist((prev) =>
                              deleteReplyInPosts(prev, selectedPost.id, commentId, replyId)
                            );
                            showToast('Your demo reply was deleted');
                          }}
                          onReportReply={(c, r) => handleOpenReplyReport(selectedPost, c, r)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Safety Prompt Card (Matches 08_05_comments_and_reports.png bottom card) */}
                <div
                  data-testid="safety-callout-banner"
                  className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white">
                      See something that breaks the rules?
                    </h3>
                    <p className="text-[11px] sm:text-xs text-purple-200/70 mt-0.5">
                      Use Report from the comment or post menu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenPostReport(selectedPost)}
                    className="px-3.5 py-2 rounded-full bg-[#241046] hover:bg-[#31165E] border border-purple-400/30 text-xs font-bold text-[#FF6BA3] shrink-0 transition-colors"
                  >
                    Report Post
                  </button>
                </div>
              </>
            ) : null}
          </section>

          {/* DESKTOP SIDEBAR: Local Demo Reports Log + Safety Categories */}
          <aside className="space-y-4">
            <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/75">
                  Demo Reports Log ({demoReports.length})
                </h3>
                {demoReports.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearLocalCommentsAndReports();
                      setDemoReports([]);
                      showToast('Cleared local demo reports');
                    }}
                    className="text-[11px] font-bold text-red-300 hover:text-red-200 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              <p className="text-[11px] text-purple-200/55 leading-relaxed">
                Reports stay locally inside your browser session and are never sent to a real
                moderation backend.
              </p>

              {demoReports.length === 0 ? (
                <div className="rounded-2xl bg-[#190B32] border border-white/5 p-3 text-center text-xs text-purple-200/55">
                  No demo reports submitted yet.
                </div>
              ) : (
                <div data-testid="demo-reports-log" className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {demoReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-2xl bg-[#190B32] border border-amber-400/25 p-3 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-amber-300 uppercase text-[10px]">
                          {rep.targetType} · {rep.reasonLabel}
                        </span>
                        <span className="text-[10px] text-purple-200/50">{rep.submittedAt}</span>
                      </div>
                      <div className="font-semibold text-white truncate">
                        Target: {rep.targetAuthor}
                      </div>
                      <p className="text-[11px] text-purple-200/70 line-clamp-2 break-words">
                        {rep.targetPreview}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/75">
                Community Safety Categories
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {REPORT_REASON_OPTIONS.map((r) => (
                  <span
                    key={r.id}
                    className="px-2.5 py-1 rounded-full bg-[#1B0D35] border border-white/10 text-[11px] font-semibold text-purple-100/80"
                  >
                    {r.label}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile / Tablet Bottom Sticky Comment Composer */}
      {selectedPost && !isPostHidden && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#100422]/95 backdrop-blur-xl border-t border-purple-400/25 px-3 sm:px-6 py-2.5">
          <div className="max-w-3xl mx-auto">
            <CommentComposer
              onSubmit={(text) => {
                updatePostsAndPersist((prev) => addCommentToPosts(prev, selectedPost.id, text));
                showToast('Comment posted');
              }}
              inputTestId="square-comment-input"
              submitTestId="square-comment-submit"
            />
          </div>
        </div>
      )}

      {/* Share & Report Modals */}
      <SquareShareModal
        post={sharePost}
        onClose={() => setSharePost(null)}
        onCompleteShare={(postId, channel) => {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, sharesCount: p.sharesCount + 1 } : p))
          );
          showToast(`Shared via ${channel}`);
        }}
      />

      <ReportModal
        target={reportTarget}
        alreadyReported={Boolean(
          reportTarget && reportedTargetKeys.has(`${reportTarget.type}:${reportTarget.id}`)
        )}
        onClose={() => setReportTarget(null)}
        onSubmitReport={handleSubmitDemoReport}
      />

      {toast && (
        <div
          data-testid="comments-toast"
          className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap pointer-events-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
