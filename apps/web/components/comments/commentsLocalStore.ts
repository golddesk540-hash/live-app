import { CommentReplyItem, LocalDemoReport, SquareCommentItem, SquarePostItem } from './types';

const COMMENTS_STORAGE_KEY = 'popo_live_square_comments_map_v1';
const REPORTS_STORAGE_KEY = 'popo_live_square_demo_reports_v1';

export const COMMENT_EMOJI_OPTIONS = ['❤️', '🔥', '👏', '✨', '😍', '🎵', '💎', '🙌', '🥳', '💜'];

export const CURRENT_DEMO_COMMENTER = {
  authorName: 'You',
  authorHandle: '@you.popolive',
  authorInitials: 'ME',
  authorColor: 'from-[#FF1A6C] to-[#7928CA]',
};

export function loadLocalCommentsMap(): Record<string, SquareCommentItem[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, SquareCommentItem[]>) : {};
  } catch {
    return {};
  }
}

export function saveLocalCommentsMap(posts: SquarePostItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const map: Record<string, SquareCommentItem[]> = {};
    for (const p of posts) {
      map[p.id] = p.comments;
    }
    window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors gracefully
  }
}

export function loadLocalDemoReports(): LocalDemoReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalDemoReport[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalDemoReports(reports: LocalDemoReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports.slice(0, 50)));
  } catch {
    // ignore storage quota errors
  }
}

export function clearLocalCommentsAndReports(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(COMMENTS_STORAGE_KEY);
    window.localStorage.removeItem(REPORTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getTotalRepliesCount(comments: SquareCommentItem[]): number {
  return comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0);
}

export function createDemoComment(text: string): SquareCommentItem {
  return {
    id: `c_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorName: CURRENT_DEMO_COMMENTER.authorName,
    authorHandle: CURRENT_DEMO_COMMENTER.authorHandle,
    authorInitials: CURRENT_DEMO_COMMENTER.authorInitials,
    authorColor: CURRENT_DEMO_COMMENTER.authorColor,
    text,
    timestamp: 'Just now',
    likes: 0,
    isLiked: false,
    isOwn: true,
    replies: [],
  };
}

export function createDemoReply(text: string): CommentReplyItem {
  return {
    id: `r_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    authorName: CURRENT_DEMO_COMMENTER.authorName,
    authorInitials: CURRENT_DEMO_COMMENTER.authorInitials,
    authorColor: CURRENT_DEMO_COMMENTER.authorColor,
    text,
    timestamp: 'Just now',
    likes: 0,
    isLiked: false,
    isOwn: true,
  };
}

export function addCommentToPosts(
  posts: SquarePostItem[],
  postId: string,
  text: string
): SquarePostItem[] {
  const newComment = createDemoComment(text);
  return posts.map((p) => (p.id === postId ? { ...p, comments: [newComment, ...p.comments] } : p));
}

export function toggleCommentLikeInPosts(
  posts: SquarePostItem[],
  postId: string,
  commentId: string
): SquarePostItem[] {
  return posts.map((p) => {
    if (p.id !== postId) return p;
    return {
      ...p,
      comments: p.comments.map((c) => {
        if (c.id !== commentId) return c;
        const nextLiked = !c.isLiked;
        return {
          ...c,
          isLiked: nextLiked,
          likes: Math.max(0, c.likes + (nextLiked ? 1 : -1)),
        };
      }),
    };
  });
}

export function deleteCommentInPosts(
  posts: SquarePostItem[],
  postId: string,
  commentId: string
): SquarePostItem[] {
  return posts.map((p) =>
    p.id === postId
      ? { ...p, comments: p.comments.filter((c) => !(c.id === commentId && c.isOwn)) }
      : p
  );
}

export function addReplyToPosts(
  posts: SquarePostItem[],
  postId: string,
  commentId: string,
  text: string
): SquarePostItem[] {
  const reply = createDemoReply(text);
  return posts.map((p) => {
    if (p.id !== postId) return p;
    return {
      ...p,
      comments: p.comments.map((c) =>
        c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c
      ),
    };
  });
}

export function toggleReplyLikeInPosts(
  posts: SquarePostItem[],
  postId: string,
  commentId: string,
  replyId: string
): SquarePostItem[] {
  return posts.map((p) => {
    if (p.id !== postId) return p;
    return {
      ...p,
      comments: p.comments.map((c) => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          replies: (c.replies || []).map((r) => {
            if (r.id !== replyId) return r;
            const nextLiked = !r.isLiked;
            return {
              ...r,
              isLiked: nextLiked,
              likes: Math.max(0, r.likes + (nextLiked ? 1 : -1)),
            };
          }),
        };
      }),
    };
  });
}

export function deleteReplyInPosts(
  posts: SquarePostItem[],
  postId: string,
  commentId: string,
  replyId: string
): SquarePostItem[] {
  return posts.map((p) => {
    if (p.id !== postId) return p;
    return {
      ...p,
      comments: p.comments.map((c) =>
        c.id === commentId
          ? { ...c, replies: (c.replies || []).filter((r) => !(r.id === replyId && r.isOwn)) }
          : c
      ),
    };
  });
}
