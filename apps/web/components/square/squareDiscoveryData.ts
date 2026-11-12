import { INITIAL_FOLLOWED_CREATOR_IDS, SQUARE_CREATORS } from './mockSquareData';
import { SquareCreator, SquarePostItem } from './types';

const FOLLOWED_CREATORS_STORAGE_KEY = 'popo_square_followed_creators_v1';
const RECENT_DISCOVERY_SEARCHES_KEY = 'popo_square_discovery_recent_searches_v1';

export const DEFAULT_RECENT_DISCOVERY_SEARCHES = [
  '#AcousticNight',
  'Ayesha',
  '#SquareMoments',
];

export const SQUARE_CREATORS_LIST: SquareCreator[] = Object.values(SQUARE_CREATORS);

export function loadLocalFollowedCreatorIds(): Set<string> {
  if (typeof window === 'undefined') return new Set(INITIAL_FOLLOWED_CREATOR_IDS);
  try {
    const raw = window.localStorage.getItem(FOLLOWED_CREATORS_STORAGE_KEY);
    if (!raw) return new Set(INITIAL_FOLLOWED_CREATOR_IDS);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch {
    // Ignore storage error
  }
  return new Set(INITIAL_FOLLOWED_CREATOR_IDS);
}

export function saveLocalFollowedCreatorIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FOLLOWED_CREATORS_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage error
  }
}

export function loadRecentDiscoverySearches(): string[] {
  if (typeof window === 'undefined') return DEFAULT_RECENT_DISCOVERY_SEARCHES;
  try {
    const raw = window.localStorage.getItem(RECENT_DISCOVERY_SEARCHES_KEY);
    if (!raw) return DEFAULT_RECENT_DISCOVERY_SEARCHES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore storage error
  }
  return DEFAULT_RECENT_DISCOVERY_SEARCHES;
}

export function saveRecentDiscoverySearches(items: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_DISCOVERY_SEARCHES_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {
    // Ignore storage error
  }
}

export function getDiscoverySections(posts: SquarePostItem[], followedIds: Set<string>) {
  const popularPosts = [...posts].sort(
    (a, b) => b.likesCount + b.comments.length * 4 - (a.likesCount + a.comments.length * 4)
  );
  const featuredPosts = popularPosts.slice(0, 4);
  const followingPosts = posts.filter((p) => followedIds.has(p.creator.id));

  const trendingCreators = [
    SQUARE_CREATORS.hamza,
    SQUARE_CREATORS.mina,
    SQUARE_CREATORS.ayesha,
  ].filter(Boolean);

  const recommendedCreators = [
    SQUARE_CREATORS.sara,
    SQUARE_CREATORS.zaid,
  ].filter(Boolean);

  const recentlyActiveCreators = [...SQUARE_CREATORS_LIST].sort((a, b) => {
    const score = (s: SquareCreator['status']) => (s === 'live' ? 3 : s === 'online' ? 2 : 1);
    return score(b.status) - score(a.status);
  });

  return {
    featuredPosts,
    popularPosts,
    followingPosts,
    trendingCreators,
    recommendedCreators,
    recentlyActiveCreators,
  };
}
