'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  INITIAL_FOLLOWED_CREATOR_IDS,
  INITIAL_SQUARE_POSTS,
  SQUARE_CREATORS,
  TRENDING_TOPICS,
} from './mockSquareData';
import {
  clearLocalSquarePosts,
  loadLocalSquarePosts,
  saveLocalSquarePost,
} from './squareLocalStore';
import {
  addCommentToPosts,
  addReplyToPosts,
  clearLocalCommentsAndReports,
  deleteCommentInPosts,
  deleteReplyInPosts,
  loadLocalCommentsMap,
  loadLocalDemoReports,
  saveLocalCommentsMap,
  saveLocalDemoReports,
  toggleCommentLikeInPosts,
  toggleReplyLikeInPosts,
} from '../comments/commentsLocalStore';
import { ReportModal } from '../comments/ReportModal';
import { LocalDemoReport, ReportTarget } from '../comments/types';
import { CommentReplyItem, SquareCommentItem, SquareCreator, SquareFeedTab, SquarePostItem } from './types';
import { SquarePostCard } from './SquarePostCard';
import { SquareCommentsModal } from './SquareCommentsModal';
import { SquareShareModal, SquareReportModal } from './SquareShareReportModal';
import { SquareCreatePreviewModal } from './SquareCreatePreviewModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ProfilePreviewModal } from '@/components/inbox/ProfilePreviewModal';
import { InboxUserProfile } from '@/components/inbox/types';
import {
  ArrowLeft,
  Search,
  Heart,
  MoreVertical,
  Plus,
  Sparkles,
  Flame,
  Users,
  Bookmark,
  RotateCcw,
  Home,
  Compass,
  Camera,
  MessageCircle,
  User,
  Bell,
  Play,
  Flag,
  Crown,
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
    isVip: c.isVip,
    followersCount: c.followersCount,
    followingCount: c.followingCount,
    roleTag: c.roleTag,
  };
}

export const SquareFeedScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SquareFeedTab>('for_you');
  const [posts, setPosts] = useState<SquarePostItem[]>(INITIAL_SQUARE_POSTS);
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    () => new Set(INITIAL_FOLLOWED_CREATOR_IDS)
  );
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive modals
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<SquarePostItem | null>(null);
  const [reportPost, setReportPost] = useState<SquarePostItem | null>(null);
  const [commentReportTarget, setCommentReportTarget] = useState<ReportTarget | null>(null);
  const [demoReports, setDemoReports] = useState<LocalDemoReport[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewCreator, setPreviewCreator] = useState<SquareCreator | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{
    post: SquarePostItem;
    imageIndex: number;
  } | null>(null);
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

  const reportedTargetIds = useMemo(
    () => new Set(demoReports.map((r) => `${r.targetType}:${r.targetId}`)),
    [demoReports]
  );

  const reportedCommentIds = useMemo(
    () => new Set(demoReports.filter((r) => r.targetType === 'comment').map((r) => r.targetId)),
    [demoReports]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const commentsPost = useMemo(
    () => posts.find((p) => p.id === commentsPostId) || null,
    [posts, commentsPostId]
  );

  const visiblePosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = posts.filter((p) => !hiddenPostIds.has(p.id));

    if (savedOnly) {
      list = list.filter((p) => p.isSaved);
    }

    if (activeTab === 'following') {
      list = list.filter((p) => followedIds.has(p.creator.id));
    } else if (activeTab === 'popular') {
      list = [...list].sort((a, b) => b.categoryScore + b.likesCount - (a.categoryScore + a.likesCount));
    }

    if (q) {
      list = list.filter(
        (p) =>
          p.text.toLowerCase().includes(q) ||
          p.creator.name.toLowerCase().includes(q) ||
          p.creator.handle.toLowerCase().includes(q) ||
          (p.hashtags || []).some((h) => h.toLowerCase().includes(q))
      );
    }

    return list;
  }, [posts, hiddenPostIds, savedOnly, activeTab, followedIds, searchQuery]);

  const handleToggleLike = (postId: string) => {
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

  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextSaved = !p.isSaved;
        showToast(nextSaved ? 'Post saved to bookmarks' : 'Removed from saved posts');
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
      return next;
    });
  };

  const updatePostsAndPersistComments = (updater: (prev: SquarePostItem[]) => SquarePostItem[]) => {
    setPosts((prev) => {
      const next = updater(prev);
      saveLocalCommentsMap(next);
      return next;
    });
  };

  const handleAddComment = (postId: string, text: string) => {
    updatePostsAndPersistComments((prev) => addCommentToPosts(prev, postId, text));
    showToast('Comment posted');
  };

  const handleToggleCommentLike = (postId: string, commentId: string) => {
    updatePostsAndPersistComments((prev) => toggleCommentLikeInPosts(prev, postId, commentId));
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    updatePostsAndPersistComments((prev) => deleteCommentInPosts(prev, postId, commentId));
    showToast('Your demo comment was deleted');
  };

  const handleAddReply = (postId: string, commentId: string, text: string) => {
    updatePostsAndPersistComments((prev) => addReplyToPosts(prev, postId, commentId, text));
    showToast('Reply added');
  };

  const handleToggleReplyLike = (postId: string, commentId: string, replyId: string) => {
    updatePostsAndPersistComments((prev) => toggleReplyLikeInPosts(prev, postId, commentId, replyId));
  };

  const handleDeleteReply = (postId: string, commentId: string, replyId: string) => {
    updatePostsAndPersistComments((prev) => deleteReplyInPosts(prev, postId, commentId, replyId));
    showToast('Your demo reply was deleted');
  };

  const handleCopyComment = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast('Comment copied to clipboard');
  };

  const handleSubmitDemoReport = (report: Omit<LocalDemoReport, 'id' | 'submittedAt'>) => {
    const newReport: LocalDemoReport = {
      ...report,
      id: `rep_${Date.now()}`,
      submittedAt: 'Just now',
    };
    setDemoReports((prev) => {
      const next = [newReport, ...prev];
      saveLocalDemoReports(next);
      return next;
    });
    showToast(`Local demo report recorded (${report.reasonLabel})`);
  };

  const handleCompleteShare = (postId: string, channel: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, sharesCount: p.sharesCount + 1 } : p))
    );
    showToast(`Shared via ${channel}`);
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
    showToast('Post hidden from your Square feed');
  };

  const handlePublishQuickPost = (text: string, includePhoto: boolean) => {
    const demoPost: SquarePostItem = {
      id: `post_local_${Date.now()}`,
      creator: SQUARE_CREATORS.ayesha,
      publishedAgo: 'Just now',
      visibility: 'Public',
      text,
      hashtags: ['#PopoSquare', '#Community'],
      mediaType: includePhoto ? 'single_image' : 'none',
      images: includePhoto
        ? ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80']
        : undefined,
      likesCount: 1,
      isLiked: true,
      isSaved: false,
      sharesCount: 0,
      comments: [],
      categoryScore: 500,
    };
    setPosts((prev) => [demoPost, ...prev]);
    saveLocalSquarePost(demoPost);
    setActiveTab('for_you');
    showToast('Published post to Square locally');
  };

  const handleRefreshFeed = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Square feed refreshed');
    }, 450);
  };

  const handleRestoreFeed = () => {
    clearLocalSquarePosts();
    clearLocalCommentsAndReports();
    setPosts(INITIAL_SQUARE_POSTS);
    setDemoReports([]);
    setFollowedIds(new Set(INITIAL_FOLLOWED_CREATOR_IDS));
    setHiddenPostIds(new Set());
    setSavedOnly(false);
    setSearchQuery('');
    setActiveTab('for_you');
    showToast('Square demo feed restored');
  };

  const creatorSuggestions = useMemo(() => Object.values(SQUARE_CREATORS), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#130626] via-[#0B0418] to-[#070312] text-white flex flex-col pb-20 lg:pb-10">
      {/* Top Bar (Matches 08_03_square_posts.png) */}
      <header className="sticky top-0 z-40 bg-[#120624]/92 backdrop-blur-xl border-b border-purple-400/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/live"
              aria-label="Back to Discovery"
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
            <Link
              href="/square/create"
              data-testid="square-create-studio-link"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-purple-400/25 text-xs font-extrabold text-[#FF6BA3] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Studio</span>
            </Link>

            <Link
              href="/square/discovery"
              data-testid="square-header-discovery-link"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-purple-400/25 text-purple-100 text-xs font-extrabold transition-colors"
              title="Open Square Web Discovery"
            >
              <Compass className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span className="hidden sm:inline">Discovery</span>
            </Link>

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              data-testid="square-create-shortcut"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Create</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMobileSearch((v) => !v)}
              data-testid="square-search-toggle"
              aria-label="Toggle feed search"
              className={`p-2 rounded-full border transition-colors ${
                showMobileSearch || searchQuery
                  ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-[#FF4D8D]'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSavedOnly((v) => !v)}
              data-testid="square-saved-toggle"
              title="Toggle saved posts filter"
              aria-label="Filter saved posts"
              className={`p-2 rounded-full border transition-colors ${
                savedOnly
                  ? 'bg-[#FF1A6C] border-[#FF1A6C] text-white shadow-glow-pink'
                  : 'bg-[#1C0D38] hover:bg-[#28154D] border-white/10 text-purple-100/85'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${savedOnly ? 'fill-white' : ''}`} />
            </button>

            <Link
              href="/profile"
              aria-label="My Profile shortcut"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors hidden sm:inline-flex"
            >
              <User className="w-4 h-4" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderMenu((v) => !v)}
                data-testid="square-header-menu-btn"
                aria-label="Square options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#100521] border border-purple-400/25 shadow-2xl p-1.5 z-50 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleRefreshFeed();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Refresh Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleRestoreFeed();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" /> Restore All Posts
                  </button>
                  <Link
                    href="/square/discovery"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="square-menu-discovery-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#FF4D8D]" /> Square Discovery
                  </Link>
                  <Link
                    href="/square/comments"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="square-menu-comments-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5 text-[#FF4D8D]" /> Comments & Reports
                  </Link>
                  <Link
                    href="/fan-club"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="square-menu-fan-club-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-300" /> Fan Club
                  </Link>
                  <Link
                    href="/inbox"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> Open Inbox
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="square-menu-notifications-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Heart className="w-3.5 h-3.5 text-[#FF4D8D]" /> Notifications
                  </Link>
                  <Link
                    href="/invites"
                    onClick={() => setShowHeaderMenu(false)}
                    data-testid="square-menu-invites-link"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-pink-300" /> Invite Friends
                  </Link>
                  <Link
                    href="/system-notices"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" /> System Notices
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* MAIN FEED COLUMN */}
          <section className="space-y-4">
            {/* Heading + Tabs Header Card (Matches 08_03_square_posts.png) */}
            <div className="rounded-3xl bg-[#110523]/90 border border-purple-400/20 p-4 sm:p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-[30px] font-black tracking-tight text-white">
                    Square
                  </h1>
                  <p className="text-xs sm:text-sm text-purple-200/70 mt-0.5">
                    Posts from your community
                  </p>
                </div>

                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100"
                >
                  <User className="w-3.5 h-3.5 text-[#FF4D8D]" />
                  <span>My Profile</span>
                </Link>
              </div>

              {/* For You / Following / Popular Tabs */}
              <div role="tablist" aria-label="Square feed categories" className="grid grid-cols-3 gap-2 mt-4">
                {(
                  [
                    { id: 'for_you', label: 'For You', Icon: Sparkles },
                    { id: 'following', label: 'Following', Icon: Users },
                    { id: 'popular', label: 'Popular', Icon: Flame },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      data-testid={`square-tab-${id}`}
                      onClick={() => setActiveTab(id)}
                      className={`py-2 px-3 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                        active
                          ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                          : 'bg-[#211042] hover:bg-[#2B1754] text-purple-100/80 border border-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 hidden xs:inline" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div className={`${showMobileSearch ? 'block' : 'hidden lg:block'} mt-3.5`}>
                <SearchBar
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  data-testid="square-search-input"
                  placeholder="Search posts, creators, or #hashtags..."
                  className="bg-[#180C32] border-purple-400/20 text-xs py-2"
                />
              </div>
            </div>

            {/* Feed Loading Shimmer or Post List */}
            {isRefreshing ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="rounded-3xl bg-[#130628]/80 border border-purple-400/15 p-5 animate-pulse space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-purple-400/20" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-32 bg-purple-400/20 rounded" />
                        <div className="h-2.5 w-20 bg-purple-400/15 rounded" />
                      </div>
                    </div>
                    <div className="h-32 w-full bg-purple-400/10 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : visiblePosts.length === 0 ? (
              <EmptyState
                icon={<Heart className="w-7 h-7" />}
                title={
                  searchQuery.trim()
                    ? 'No Matching Square Posts'
                    : savedOnly
                    ? 'No Saved Posts Yet'
                    : activeTab === 'following'
                    ? 'Follow Creators to See Their Posts'
                    : 'No Posts Available'
                }
                description={
                  searchQuery.trim()
                    ? `No posts or creators matched "${searchQuery}".`
                    : savedOnly
                    ? 'Bookmark posts you want to revisit and they will show up here.'
                    : activeTab === 'following'
                    ? 'Follow hosts in the For You feed to customize your Following stream.'
                    : 'Restore demo posts or publish a quick update with Create.'
                }
                actionLabel={
                  searchQuery.trim()
                    ? 'Clear Search'
                    : savedOnly
                    ? 'Show All Posts'
                    : activeTab === 'following'
                    ? 'Explore For You'
                    : 'Restore Feed'
                }
                onAction={() => {
                  if (searchQuery.trim()) setSearchQuery('');
                  else if (savedOnly) setSavedOnly(false);
                  else if (activeTab === 'following') setActiveTab('for_you');
                  else handleRestoreFeed();
                }}
                className="bg-[#160B2C]/80 border-purple-400/15 py-12"
              />
            ) : (
              <div className="space-y-4" data-testid="square-posts-feed">
                {visiblePosts.map((post) => (
                  <SquarePostCard
                    key={post.id}
                    post={post}
                    isFollowed={followedIds.has(post.creator.id)}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                    onToggleFollow={handleToggleFollow}
                    onOpenComments={(p) => setCommentsPostId(p.id)}
                    onOpenShare={(p) => setSharePost(p)}
                    onOpenReport={(p) => setReportPost(p)}
                    onHidePost={handleHidePost}
                    onCopyLink={handleCopyLink}
                    onPreviewCreator={(c) => setPreviewCreator(c)}
                    onPreviewMedia={(p, idx = 0) => setMediaPreview({ post: p, imageIndex: idx })}
                    onFilterTag={(tag) => setSearchQuery(tag)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* DESKTOP RIGHT SIDEBAR: Discovery, Trending & Quick Creators */}
          <aside className="hidden lg:flex flex-col gap-4 sticky top-20">
            {/* Quick Create Promo */}
            <div className="rounded-3xl bg-gradient-to-br from-[#230B45] to-[#130627] border border-[#FF1A6C]/30 p-5 shadow-xl">
              <h3 className="text-sm font-black text-white">Share with Popo Community</h3>
              <p className="text-xs text-purple-200/70 mt-1 leading-relaxed">
                Post behind-the-scenes photos, party invites, and room highlights right to Square.
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-3.5 w-full py-2 px-4 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 transition-all inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Quick Post</span>
              </button>
              <Link
                href="/square/create"
                data-testid="square-sidebar-create-studio"
                className="mt-2 w-full py-2 px-4 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-purple-400/25 text-purple-100 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF4D8D]" />
                <span>Open Create Tools Studio ↗</span>
              </Link>
            </div>

            {/* Trending Topics */}
            <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/65">
                  Trending on Square
                </h3>
                <Link
                  href="/square/discovery"
                  data-testid="square-sidebar-discovery-link"
                  className="text-[11px] font-bold text-[#FF4D8D] hover:underline"
                >
                  Explore ↗
                </Link>
              </div>
              <div className="space-y-1.5">
                {TRENDING_TOPICS.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => setSearchQuery(item.tag)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-[#190B33] hover:bg-[#24114A] border border-white/5 text-left transition-colors"
                  >
                    <span className="text-xs font-bold text-[#FF4D8D]">{item.tag}</span>
                    <span className="text-[11px] text-purple-200/55">{item.posts}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Creators */}
            <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/65 px-1">
                Creators to Follow
              </h3>
              <div className="space-y-2.5">
                {creatorSuggestions.map((creator) => {
                  const following = followedIds.has(creator.id);
                  return (
                    <div key={creator.id} className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewCreator(creator)}
                        className="flex items-center gap-2.5 min-w-0 text-left group"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1D0F38] border border-purple-400/40 shrink-0">
                          {creator.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-xs font-bold">{creator.name[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-[#FF4D8D] truncate">
                            {creator.name}
                          </div>
                          <div className="text-[10px] text-purple-200/55 truncate">
                            {creator.followersCount} followers
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(creator)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          following
                            ? 'bg-[#221044] text-purple-200 border border-white/15'
                            : 'bg-[#FF1A6C] text-white'
                        }`}
                      >
                        {following ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#100422]/95 backdrop-blur-xl border-t border-purple-400/20 h-16 px-4 flex items-center justify-around"
      >
        <Link href="/" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/square" className="flex flex-col items-center gap-1 text-[#FF1A6C]">
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-extrabold">Square</span>
        </Link>
        <Link
          href="/square/create"
          aria-label="Create Square post"
          data-testid="square-mobile-create-studio-link"
          className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-[#9333EA] flex items-center justify-center text-white shadow-glow-pink"
        >
          <Camera className="w-5 h-5" />
        </Link>
        <Link href="/inbox" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Inbox</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-purple-200/55 hover:text-white">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Me</span>
        </Link>
      </nav>

      {/* Modals */}
      <SquareCommentsModal
        post={commentsPost}
        isOpen={Boolean(commentsPost)}
        onClose={() => setCommentsPostId(null)}
        reportedCommentIds={reportedCommentIds}
        onAddComment={handleAddComment}
        onToggleCommentLike={handleToggleCommentLike}
        onAddReply={handleAddReply}
        onDeleteComment={handleDeleteComment}
        onCopyComment={handleCopyComment}
        onReportComment={(postObj: SquarePostItem, comment: SquareCommentItem) =>
          setCommentReportTarget({
            type: 'comment',
            id: comment.id,
            postId: postObj.id,
            authorName: comment.authorName,
            authorHandle: comment.authorHandle,
            authorAvatarUrl: comment.authorAvatarUrl,
            authorInitials: comment.authorInitials,
            authorColor: comment.authorColor,
            previewText: comment.text,
            timestamp: comment.timestamp,
          })
        }
        onToggleReplyLike={handleToggleReplyLike}
        onDeleteReply={handleDeleteReply}
        onReportReply={(postObj: SquarePostItem, _comment: SquareCommentItem, reply: CommentReplyItem) =>
          setCommentReportTarget({
            type: 'comment',
            id: reply.id,
            postId: postObj.id,
            authorName: reply.authorName,
            authorAvatarUrl: reply.authorAvatarUrl,
            authorInitials: reply.authorInitials,
            authorColor: reply.authorColor,
            previewText: reply.text,
            timestamp: reply.timestamp,
          })
        }
        onReportPost={(postObj) => setReportPost(postObj)}
      />

      <SquareShareModal
        post={sharePost}
        onClose={() => setSharePost(null)}
        onCompleteShare={handleCompleteShare}
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

      <SquareCreatePreviewModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onPublishQuickPost={handlePublishQuickPost}
      />

      <ProfilePreviewModal
        user={previewCreator ? mapCreatorToInboxProfile(previewCreator) : null}
        isOpen={Boolean(previewCreator)}
        onClose={() => setPreviewCreator(null)}
        onMessageUser={() => showToast('Opening direct chat in Inbox...')}
      />

      {/* Media Lightbox / Video Preview Modal */}
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
            <div className="space-y-3">
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
                  <span className="text-xs font-bold bg-black/70 px-3 py-1 rounded-full">
                    Video Playback Preview ({mediaPreview.post.videoDuration || '01:42'})
                  </span>
                </div>
              </div>
            </div>
          ) : mediaPreview.post.images?.[mediaPreview.imageIndex] ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaPreview.post.images[mediaPreview.imageIndex]}
                alt="Post media preview"
                className="w-full max-h-[420px] object-cover rounded-2xl border border-white/10"
              />
              {mediaPreview.post.images.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {mediaPreview.post.images.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setMediaPreview({ ...mediaPreview, imageIndex: idx })}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                        idx === mediaPreview.imageIndex ? 'border-[#FF1A6C]' : 'border-white/15 opacity-60'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </Modal>
      )}

      {/* Toast */}
      {toast && (
        <div
          data-testid="square-toast"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap pointer-events-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
