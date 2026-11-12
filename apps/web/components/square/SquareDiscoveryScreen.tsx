'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  INITIAL_SQUARE_POSTS,
  TRENDING_TOPICS,
} from './mockSquareData';
import { loadLocalSquarePosts } from './squareLocalStore';
import {
  DEFAULT_RECENT_DISCOVERY_SEARCHES,
  SQUARE_CREATORS_LIST,
  getDiscoverySections,
  loadLocalFollowedCreatorIds,
  loadRecentDiscoverySearches,
  saveLocalFollowedCreatorIds,
  saveRecentDiscoverySearches,
} from './squareDiscoveryData';
import { SquareCreator, SquarePostItem } from './types';
import { SquareWebFooter, SquareWebNavbar } from './SquareWebNavbar';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfilePreviewModal } from '@/components/inbox/ProfilePreviewModal';
import { InboxUserProfile } from '@/components/inbox/types';
import {
  Compass,
  Crown,
  Flame,
  Hash,
  Heart,
  History,
  MessageCircle,
  MoreVertical,
  Play,
  Plus,
  Radio,
  RotateCcw,
  SearchX,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

type SearchScope = 'all' | 'posts' | 'creators' | 'hashtags';
type ShowcaseTab = 'for_you' | 'popular' | 'following';

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

export const SquareDiscoveryScreen: React.FC = () => {
  const [posts, setPosts] = useState<SquarePostItem[]>(INITIAL_SQUARE_POSTS);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [showcaseTab, setShowcaseTab] = useState<ShowcaseTab>('for_you');
  const [recentSearches, setRecentSearches] = useState<string[]>(
    DEFAULT_RECENT_DISCOVERY_SEARCHES
  );
  const [previewCreator, setPreviewCreator] = useState<SquareCreator | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Empty-state simulation toggles cleanly accessible via header menu
  const [hideTrendingPreview, setHideTrendingPreview] = useState(false);
  const [hideCreatorsPreview, setHideCreatorsPreview] = useState(false);
  const [hideAllContentPreview, setHideAllContentPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const localPosts = loadLocalSquarePosts();
    if (localPosts.length > 0) {
      setPosts((prev) => {
        const ids = new Set(localPosts.map((p) => p.id));
        return [...localPosts, ...prev.filter((p) => !ids.has(p.id))];
      });
    }
    setFollowedIds(loadLocalFollowedCreatorIds());
    setRecentSearches(loadRecentDiscoverySearches());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2400);
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

  const handleRecordSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      saveRecentDiscoverySearches(next);
      return next;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    saveRecentDiscoverySearches([]);
    showToast('Cleared recent discovery searches');
  };

  const sections = useMemo(
    () => getDiscoverySections(posts, followedIds),
    [posts, followedIds]
  );

  const showcasePosts = useMemo(() => {
    if (hideAllContentPreview) return [];
    if (showcaseTab === 'popular') return sections.popularPosts;
    if (showcaseTab === 'following') return sections.followingPosts;
    return sections.featuredPosts;
  }, [hideAllContentPreview, showcaseTab, sections]);

  const queryLower = searchQuery.trim().toLowerCase();
  const isSearching = queryLower.length > 0;

  const matchedPosts = useMemo(() => {
    if (!isSearching || hideAllContentPreview) return [];
    return posts.filter(
      (p) =>
        p.text.toLowerCase().includes(queryLower) ||
        p.creator.name.toLowerCase().includes(queryLower) ||
        (p.hashtags || []).some((t) => t.toLowerCase().includes(queryLower))
    );
  }, [posts, queryLower, isSearching, hideAllContentPreview]);

  const matchedCreators = useMemo(() => {
    if (!isSearching || hideAllContentPreview || hideCreatorsPreview) return [];
    return SQUARE_CREATORS_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(queryLower) ||
        c.handle.toLowerCase().includes(queryLower) ||
        c.roleTag.toLowerCase().includes(queryLower) ||
        c.bio.toLowerCase().includes(queryLower)
    );
  }, [queryLower, isSearching, hideAllContentPreview, hideCreatorsPreview]);

  const matchedHashtags = useMemo(() => {
    if (!isSearching || hideAllContentPreview) return [];
    return TRENDING_TOPICS.filter((t) => t.tag.toLowerCase().includes(queryLower));
  }, [queryLower, isSearching, hideAllContentPreview]);

  const totalSearchMatches = useMemo(() => {
    if (searchScope === 'posts') return matchedPosts.length;
    if (searchScope === 'creators') return matchedCreators.length;
    if (searchScope === 'hashtags') return matchedHashtags.length;
    return matchedPosts.length + matchedCreators.length + matchedHashtags.length;
  }, [searchScope, matchedPosts.length, matchedCreators.length, matchedHashtags.length]);

  const restoreDiscoveryDefaults = () => {
    setHideTrendingPreview(false);
    setHideCreatorsPreview(false);
    setHideAllContentPreview(false);
    setSearchQuery('');
    showToast('Restored Square Discovery content');
  };

  return (
    <div
      data-testid="square-discovery-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-20 lg:pb-0"
    >
      <SquareWebNavbar
        activeSection="discovery"
        rightSlot={
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu((v) => !v)}
              data-testid="discovery-options-menu-btn"
              aria-label="Discovery preview options"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div
                data-testid="discovery-options-menu"
                className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-[#1A0B33] border border-purple-400/25 shadow-2xl p-1.5 z-50"
              >
                <button
                  type="button"
                  data-testid="menu-empty-trending-btn"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setHideTrendingPreview(true);
                    showToast('Previewing empty trending state');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Preview Empty Trending
                </button>
                <button
                  type="button"
                  data-testid="menu-empty-creators-btn"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setHideCreatorsPreview(true);
                    showToast('Previewing empty creator recommendations');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Preview Empty Creators
                </button>
                <button
                  type="button"
                  data-testid="menu-empty-content-btn"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setHideAllContentPreview(true);
                    showToast('Previewing empty community content');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Preview Empty Content
                </button>
                <button
                  type="button"
                  data-testid="menu-restore-discovery-btn"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    restoreDiscoveryDefaults();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-white/10 flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore Discovery Content
                </button>
              </div>
            )}
          </div>
        }
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-6">
        {/* Hero Web Chrome Banner matching 08_10_square_web_and_discovery.png */}
        <section className="rounded-3xl bg-[#110523]/95 border border-purple-400/25 p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF1A6C] to-[#9333EA] flex items-center justify-center shadow-glow-pink shrink-0">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-[30px] font-black tracking-tight text-white">
                    Square Discovery
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-purple-200/75">
                    popolive.app/square
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
                  Discover posts, creators, and hashtags across the Popo Live community on Web &amp; App.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/square"
                data-testid="discovery-open-full-feed-link"
                className="px-4 py-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-purple-400/25 text-xs font-bold text-purple-100 transition-colors"
              >
                Open Full Square Feed
              </Link>
              <Link
                href="/square/create"
                data-testid="discovery-create-post-btn"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold shadow-glow-pink hover:brightness-110 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Post</span>
              </Link>
            </div>
          </div>

          {/* Search Input + Scope Tabs + Recent Searches */}
          <div className="space-y-3 pt-1">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRecordSearch(searchQuery);
              }}
              onClear={() => setSearchQuery('')}
              placeholder="Search Square posts, creators, or #hashtags..."
              data-testid="discovery-search-input"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Scope Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'all', label: 'All Results' },
                    { id: 'posts', label: 'Posts' },
                    { id: 'creators', label: 'Creators' },
                    { id: 'hashtags', label: 'Hashtags' },
                  ] as const
                ).map((tab) => {
                  const active = searchScope === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`discovery-search-tab-${tab.id}`}
                      onClick={() => setSearchScope(tab.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        active
                          ? 'bg-[#FF1A6C] text-white shadow-glow-pink'
                          : 'bg-[#1D0D3B] text-purple-200/80 border border-purple-400/20 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div
                  data-testid="recent-searches-bar"
                  className="flex items-center gap-1.5 flex-wrap"
                >
                  <span className="text-[11px] font-bold text-purple-200/55 inline-flex items-center gap-1">
                    <History className="w-3 h-3" /> Recent:
                  </span>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setSearchQuery(term)}
                      className="px-2.5 py-0.5 rounded-full bg-[#1C0D38] hover:bg-[#2B1755] border border-white/10 text-[11px] font-semibold text-purple-100"
                    >
                      {term}
                    </button>
                  ))}
                  <button
                    type="button"
                    data-testid="clear-recent-searches-btn"
                    onClick={handleClearRecentSearches}
                    className="text-[11px] font-bold text-[#FF4D8D] hover:underline ml-1"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {hideAllContentPreview ? (
          <div
            data-testid="empty-discovery-content"
            className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-8"
          >
            <EmptyState
              icon={<Compass className="w-8 h-8" />}
              title="No community content found"
              description="Discovery feed content is temporarily cleared in this preview. Restore demo content to explore Square again."
              actionLabel="Restore Discovery Content"
              onAction={restoreDiscoveryDefaults}
            />
          </div>
        ) : isSearching ? (
          /* SEARCH RESULTS VIEW */
          <section data-testid="discovery-search-results" className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">
                Search Results for &ldquo;{searchQuery}&rdquo; ({totalSearchMatches})
              </h2>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-[#FF4D8D] hover:underline whitespace-nowrap shrink-0"
              >
                Clear Search
              </button>
            </div>

            {totalSearchMatches === 0 ? (
              <div
                data-testid="empty-discovery-search"
                className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-8"
              >
                <EmptyState
                  icon={<SearchX className="w-8 h-8" />}
                  title="No discovery results found"
                  description={`We couldn't find posts, creators, or hashtags matching "${searchQuery}".`}
                  actionLabel="Clear Search"
                  onAction={() => setSearchQuery('')}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {(searchScope === 'all' || searchScope === 'creators') && matchedCreators.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-200/70">
                      Matching Creators ({matchedCreators.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matchedCreators.map((creator) => (
                        <CreatorDiscoveryCard
                          key={creator.id}
                          creator={creator}
                          isFollowing={followedIds.has(creator.id)}
                          onToggleFollow={handleToggleFollow}
                          onPreview={setPreviewCreator}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(searchScope === 'all' || searchScope === 'hashtags') && matchedHashtags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-200/70">
                      Matching Hashtags ({matchedHashtags.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {matchedHashtags.map((topic) => (
                        <button
                          key={topic.tag}
                          type="button"
                          onClick={() => {
                            setSearchQuery(topic.tag);
                            setSearchScope('posts');
                            handleRecordSearch(topic.tag);
                          }}
                          className="px-4 py-2 rounded-2xl bg-[#190B33] hover:bg-[#28134E] border border-purple-400/25 text-xs font-bold text-[#FF4D8D] flex items-center gap-2"
                        >
                          <Hash className="w-3.5 h-3.5" />
                          <span>{topic.tag.replace('#', '')}</span>
                          <span className="text-purple-200/55">{topic.posts}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(searchScope === 'all' || searchScope === 'posts') && matchedPosts.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-200/70">
                      Matching Posts ({matchedPosts.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matchedPosts.map((post) => (
                        <DiscoveryPostPreviewCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        ) : (
          /* DISCOVERY HUB MAIN MULTI-COLUMN LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            {/* LEFT & CENTER WEB DISCOVERY SHOWCASE */}
            <div className="space-y-6 min-w-0">
              {/* Feed Mode Showcase Card matching 08_10_square_web_and_discovery.png */}
              <section className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#FF4D8D]" />
                    <h2 className="text-lg font-black text-white">Featured &amp; Popular Posts</h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#1C0D38] p-1 rounded-full border border-white/10">
                      {(
                        [
                          { id: 'for_you', label: 'For You' },
                          { id: 'popular', label: 'Popular' },
                          { id: 'following', label: 'Following' },
                        ] as const
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          data-testid={`discovery-feed-tab-${t.id}`}
                          onClick={() => setShowcaseTab(t.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            showcaseTab === t.id
                              ? 'bg-[#FF1A6C] text-white shadow-glow-pink'
                              : 'text-purple-200/70 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <Link
                      href="/square"
                      className="text-xs font-bold text-[#FF4D8D] hover:underline whitespace-nowrap"
                    >
                      View All ↗
                    </Link>
                  </div>
                </div>

                {hideTrendingPreview ? (
                  <div data-testid="empty-discovery-trending">
                    <EmptyState
                      icon={<TrendingUp className="w-7 h-7" />}
                      title="No trending posts yet"
                      description="Trending and featured posts will appear here as soon as community activity is active."
                      actionLabel="Restore Trending Posts"
                      onAction={() => setHideTrendingPreview(false)}
                    />
                  </div>
                ) : showcasePosts.length === 0 ? (
                  <div className="rounded-2xl bg-[#180A33] border border-purple-400/15 p-6 text-center text-xs text-purple-200/70">
                    No posts in your Following selection yet. Follow creators below to customize this view!
                  </div>
                ) : (
                  <div
                    data-testid="discovery-posts-grid"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {showcasePosts.map((post) => (
                      <DiscoveryPostPreviewCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </section>

              {/* Creators Sections: Trending + Recommended + Recently Active */}
              <section className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-4 sm:p-5 space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#FF4D8D]" />
                    <h2 className="text-lg font-black text-white">Trending &amp; Recommended Creators</h2>
                  </div>
                  <Link href="/fan-club" className="text-xs font-bold text-amber-300 hover:underline">
                    Fan Clubs ↗
                  </Link>
                </div>

                {hideCreatorsPreview ? (
                  <div data-testid="empty-discovery-creators">
                    <EmptyState
                      icon={<Users className="w-7 h-7" />}
                      title="No creator recommendations available"
                      description="No suggested creators are currently loaded in this preview."
                      actionLabel="Restore Creator Suggestions"
                      onAction={() => setHideCreatorsPreview(false)}
                    />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/60 mb-2.5">
                        Trending Creators
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sections.trendingCreators.map((creator) => (
                          <CreatorDiscoveryCard
                            key={creator.id}
                            creator={creator}
                            isFollowing={followedIds.has(creator.id)}
                            onToggleFollow={handleToggleFollow}
                            onPreview={setPreviewCreator}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/60 mb-2.5">
                        Recommended &amp; Recently Active
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sections.recommendedCreators.concat(sections.recentlyActiveCreators.slice(0, 1)).map((creator, idx) => (
                          <CreatorDiscoveryCard
                            key={`${creator.id}_${idx}`}
                            creator={creator}
                            isFollowing={followedIds.has(creator.id)}
                            onToggleFollow={handleToggleFollow}
                            onPreview={setPreviewCreator}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* DESKTOP RIGHT DISCOVERY RAIL */}
            <aside className="space-y-5 lg:sticky lg:top-20">
              {/* Popular Hashtags Card */}
              <div className="rounded-3xl bg-[#110523]/95 border border-purple-400/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#FF4D8D]" />
                    <span>Popular Hashtags</span>
                  </h3>
                  <span className="text-[11px] text-purple-200/55">Tap to filter</span>
                </div>

                <div className="space-y-2">
                  {TRENDING_TOPICS.map((topic) => (
                    <button
                      key={topic.tag}
                      type="button"
                      data-testid={`discovery-hashtag-${topic.tag.replace('#', '')}`}
                      onClick={() => {
                        setSearchQuery(topic.tag);
                        setSearchScope('posts');
                        handleRecordSearch(topic.tag);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#180A32] hover:bg-[#25124A] border border-white/5 text-left transition-colors"
                    >
                      <span className="text-xs font-extrabold text-[#FF4D8D]">{topic.tag}</span>
                      <span className="text-[11px] text-purple-200/65">{topic.posts}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Create + Shortcuts Card */}
              <div className="rounded-3xl bg-gradient-to-br from-[#230B45] to-[#130627] border border-[#FF1A6C]/30 p-5 space-y-3 shadow-xl">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF4D8D]" />
                  <span>Explore More on Popo Live</span>
                </h3>
                <p className="text-xs text-purple-200/75 leading-relaxed">
                  Share moments in Create Tools, join host Fan Clubs, or view community posts directly on Desktop Web.
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/square/create"
                    className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] text-white text-xs font-extrabold text-center shadow-glow-pink"
                  >
                    Create Text / Photo / Video Post
                  </Link>
                  <Link
                    href="/invites"
                    className="w-full py-2 px-4 rounded-full bg-[#1B0C35] hover:bg-[#27124C] border border-purple-400/25 text-purple-100 text-xs font-bold text-center"
                  >
                    Invite Friends
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <SquareWebFooter />

      {/* Profile Preview Modal Reused From Module 8.1 */}
      <ProfilePreviewModal
        user={previewCreator ? mapCreatorToInboxProfile(previewCreator) : null}
        isOpen={Boolean(previewCreator)}
        onClose={() => setPreviewCreator(null)}
        onMessageUser={(u) => showToast(`Open Inbox to message ${u.name}`)}
      />

      {toast && (
        <div
          data-testid="discovery-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap pointer-events-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
};

interface DiscoveryPostPreviewCardProps {
  post: SquarePostItem;
}

const DiscoveryPostPreviewCard: React.FC<DiscoveryPostPreviewCardProps> = ({ post }) => {
  const thumb =
    post.images?.[0] ||
    post.videoThumbnailUrl ||
    post.creator.avatarUrl;

  return (
    <article
      data-testid={`discovery-post-card-${post.id}`}
      className="rounded-2xl bg-[#170931] border border-purple-400/20 hover:border-[#FF1A6C]/55 overflow-hidden flex flex-col justify-between transition-all shadow-lg group"
    >
      <Link href={`/square/post/${post.id}`} className="block">
        {thumb && (
          <div className="relative h-40 w-full overflow-hidden bg-[#100422]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={post.creator.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {post.mediaType === 'video' && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 text-white text-[10px] font-bold inline-flex items-center gap-1">
                <Play className="w-3 h-3 fill-white" /> {post.videoDuration || 'Video'}
              </span>
            )}
            {post.mediaType === 'live_room' && (
              <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#FF1A6C] text-white text-[10px] font-black inline-flex items-center gap-1">
                <Radio className="w-3 h-3" /> LIVE
              </span>
            )}
          </div>
        )}

        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-extrabold text-white truncate">
                {post.creator.name}
              </span>
              {post.creator.isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
            </div>
            <span className="text-[10px] text-purple-200/55 shrink-0">{post.publishedAgo}</span>
          </div>

          <p className="text-xs text-purple-100/90 line-clamp-2 leading-relaxed">
            {post.text}
          </p>

          {(post.hashtags || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(post.hashtags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold text-[#FF4D8D] bg-[#FF1A6C]/10 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-purple-200/70">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-[#FF4D8D]" /> {post.likesCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-300" /> {post.comments.length}
          </span>
        </div>

        <Link
          href={`/square/post/${post.id}`}
          data-testid={`discovery-view-post-${post.id}`}
          className="font-extrabold text-[#FF4D8D] hover:underline"
        >
          View Details →
        </Link>
      </div>
    </article>
  );
};

interface CreatorDiscoveryCardProps {
  creator: SquareCreator;
  isFollowing: boolean;
  onToggleFollow: (creator: SquareCreator) => void;
  onPreview: (creator: SquareCreator) => void;
}

const CreatorDiscoveryCard: React.FC<CreatorDiscoveryCardProps> = ({
  creator,
  isFollowing,
  onToggleFollow,
  onPreview,
}) => {
  return (
    <div
      data-testid={`discovery-creator-card-${creator.id}`}
      className="rounded-2xl bg-[#170931] border border-purple-400/20 p-3.5 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        onClick={() => onPreview(creator)}
        className="flex items-center gap-3 min-w-0 text-left group"
      >
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-[#241046] border-2 border-[#FF1A6C]/50">
            {creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatarUrl} alt={creator.name} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-xs font-black">
                {creator.name.slice(0, 2)}
              </span>
            )}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#170931] ${
              creator.status === 'live'
                ? 'bg-[#FF1A6C]'
                : creator.status === 'online'
                ? 'bg-emerald-400'
                : 'bg-zinc-500'
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-[#FF4D8D] truncate">
              {creator.name}
            </span>
            {creator.isVip && <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          <p className="text-[11px] text-purple-200/65 truncate">
            {creator.roleTag} · {creator.followersCount} followers
          </p>
        </div>
      </button>

      <button
        type="button"
        data-testid={`discovery-follow-creator-${creator.id}`}
        onClick={() => onToggleFollow(creator)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 inline-flex items-center gap-1 transition-all ${
          isFollowing
            ? 'bg-[#26124A] border border-purple-300/25 text-purple-100'
            : 'bg-[#FF1A6C] text-white shadow-glow-pink'
        }`}
      >
        {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
        <span>{isFollowing ? 'Following' : 'Follow'}</span>
      </button>
    </div>
  );
};
