import { query, withTransaction } from '@/lib/db';
import { dispatchPushNotification } from '@/lib/pushNotifications';
import { AuthUser, validateSessionToken } from '@/lib/auth';
import { NextRequest } from 'next/server';

/**
 * Resolves requesting user from cookies (poppo_session, session_token), Bearer header, or test header
 */
export async function resolveSquareActor(req: NextRequest): Promise<AuthUser | null> {
  const cookieToken = req.cookies.get('poppo_session')?.value || req.cookies.get('session_token')?.value;
  if (cookieToken) {
    const user = await validateSessionToken(cookieToken);
    if (user) return user;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = await validateSessionToken(token);
    if (user) return user;
  }

  const testViewerId = req.headers.get('x-viewer-id') || req.headers.get('x-user-id');
  if (testViewerId) {
    const rows = await query('SELECT * FROM popolive.users WHERE id = $1 AND status = $2', [testViewerId, 'active']);
    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        poppo_id: r.poppo_id,
        email: r.email,
        phone: r.phone,
        nickname: r.nickname,
        avatar_url: r.avatar_url,
        gender: r.gender,
        birthdate: r.birthdate ? r.birthdate.toISOString().split('T')[0] : null,
        is_adult_verified: r.is_adult_verified,
        status: r.status,
        created_at: r.created_at ? r.created_at.toISOString() : '',
        country: r.country || 'Pakistan',
        country_code: r.country_code || 'PK',
        is_profile_completed: Boolean(r.is_profile_completed),
        bio: r.bio || '',
        host_level: Number(r.host_level) || 1,
        wealth_level: Number(r.wealth_level) || 1,
        role: r.role || 'user',
        is_staff: Boolean(r.is_staff),
        is_face_verified: Boolean(r.is_face_verified),
        live_cover_url: r.live_cover_url || null,
        go_live_eligible: Boolean(r.go_live_eligible),
      };
    }
  }

  return null;
}

export interface SquareCreator {
  id: string;
  name: string;
  handle: string;
  poppoId: string;
  avatarUrl?: string;
  avatarColor: string;
  ringColor: string;
  isVerified: boolean;
  isVip: boolean;
  level: number;
  roleTag: string;
  bio: string;
  countryFlag: string;
  countryName: string;
  followersCount: number;
  followingCount: number;
  status: 'online' | 'live' | 'offline';
}

export interface SquarePostItem {
  id: string;
  creator: SquareCreator;
  publishedAgo: string;
  visibility: 'Public' | 'Followers' | 'Following' | 'Private' | 'VIP Circle';
  text: string;
  hashtags: string[];
  mediaType: 'none' | 'single_image' | 'two_images' | 'multi_images' | 'video' | 'live_room';
  images: string[];
  videoThumbnailUrl?: string;
  videoPreviewUrl?: string;
  videoDuration?: string;
  videoTitle?: string;
  mediaMetaLabel?: string;
  liveRoomTitle?: string;
  liveRoomHref?: string;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  sharesCount: number;
  commentsCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface SquareCommentItem {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl?: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  isOwn: boolean;
  parentCommentId?: string;
  replies?: SquareCommentItem[];
}

export interface FanClubItem {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  hostHandle: string;
  hostPoppoId: string;
  hostAvatarUrl?: string;
  hostVerified: boolean;
  hostVip: boolean;
  hostRole: string;
  coverImageUrl?: string;
  description: string;
  memberCount: number;
  clubLevel: number;
  badgeLabel: string;
  accentTone: string;
  isFeatured: boolean;
  isJoined?: boolean;
}

export interface FanClubInviteItem {
  id: string;
  clubId: string;
  clubName: string;
  badgeLabel: string;
  inviterId: string;
  inviterName: string;
  inviterAvatarUrl?: string;
  inviteeId: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
}

function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return `${Math.floor(diffSec / 604800)}w ago`;
}

function getInitials(name: string): string {
  if (!name) return 'PL';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Get Square Feed with tabs, search, tags, and pagination
 */
export async function getSquareFeed(params: {
  userId?: string;
  tab?: 'for_you' | 'following' | 'popular';
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, tab = 'for_you', search = '', tag = '', page = 1, limit = 20 } = params;
  const offset = (Math.max(1, page) - 1) * limit;

  const conditions: string[] = ["p.status = 'published'"];
  const values: any[] = [];
  let paramIdx = 1;

  // Filter blocked users if userId is provided
  if (userId) {
    values.push(userId);
    conditions.push(`
      p.author_id NOT IN (
        SELECT blocked_id FROM popolive.user_blocks WHERE blocker_id = $${paramIdx}
        UNION
        SELECT blocker_id FROM popolive.user_blocks WHERE blocked_id = $${paramIdx}
      )
    `);
    paramIdx++;
  }

  // Search filter
  if (search && search.trim()) {
    values.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(`(LOWER(p.content) LIKE $${paramIdx} OR LOWER(u.nickname) LIKE $${paramIdx})`);
    paramIdx++;
  }

  // Tag filter
  if (tag && tag.trim()) {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    values.push(cleanTag);
    conditions.push(`$${paramIdx} = ANY(p.hashtags)`);
    paramIdx++;
  }

  // Following tab filter
  if (tab === 'following' && userId) {
    values.push(userId);
    conditions.push(`
      p.author_id IN (
        SELECT followed_id FROM popolive.user_follows WHERE follower_id = $${paramIdx}
      )
    `);
    paramIdx++;
  }

  // Order clause
  let orderBy = 'p.is_pinned DESC, p.created_at DESC';
  if (tab === 'popular') {
    orderBy = '(p.likes_count * 2 + p.comments_count * 3 + p.shares_count) DESC, p.created_at DESC';
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `
    SELECT COUNT(*) as total
    FROM popolive.square_posts p
    JOIN popolive.users u ON p.author_id = u.id
    ${whereClause}
  `;
  const countRes = await query(countSql, values);
  const total = parseInt(countRes[0]?.total || '0', 10);

  // Query posts
  values.push(limit, offset);
  const postsSql = `
    SELECT 
      p.id,
      p.author_id,
      p.content,
      p.media_type,
      p.images,
      p.video_url,
      p.video_thumbnail_url,
      p.video_duration,
      p.video_title,
      p.live_room_label,
      p.live_room_id,
      p.hashtags,
      p.visibility,
      p.likes_count,
      p.comments_count,
      p.shares_count,
      p.is_pinned,
      p.created_at,
      u.nickname as author_name,
      u.poppo_id as author_poppo_id,
      u.avatar_url as author_avatar_url,
      u.role as author_role,
      COALESCE(u.wealth_level, 1) as author_level,
      EXISTS(
        SELECT 1 FROM popolive.square_post_likes pl
        WHERE pl.post_id = p.id AND pl.user_id = ${userId ? `'${userId}'` : 'NULL'}
      ) as is_liked
    FROM popolive.square_posts p
    JOIN popolive.users u ON p.author_id = u.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  const rows = await query(postsSql, values);

  const posts: SquarePostItem[] = rows.map((r: any) => {
    let images: string[] = [];
    if (typeof r.images === 'string') {
      try { images = JSON.parse(r.images); } catch (_) { images = []; }
    } else if (Array.isArray(r.images)) {
      images = r.images;
    }

    return {
      id: r.id,
      creator: {
        id: r.author_id,
        name: r.author_name || 'Popo User',
        handle: `@${(r.author_name || 'user').toLowerCase().replace(/\s+/g, '.')}`,
        poppoId: r.author_poppo_id || '900010',
        avatarUrl: r.author_avatar_url || undefined,
        avatarColor: 'from-[#FF1A6C] to-[#7928CA]',
        ringColor: r.author_level >= 5 ? '#FF1768' : '#00E5FF',
        isVerified: r.author_level >= 3,
        isVip: r.author_level >= 5,
        level: r.author_level || 1,
        roleTag: r.author_role === 'host' ? 'Host' : 'Member',
        bio: 'Popo Live Community Star',
        countryFlag: '🌐',
        countryName: 'Pakistan',
        followersCount: 150,
        followingCount: 45,
        status: 'online',
      },
      publishedAgo: timeAgo(r.created_at),
      visibility: r.visibility,
      text: r.content,
      hashtags: r.hashtags || [],
      mediaType: r.media_type,
      images,
      videoThumbnailUrl: r.video_thumbnail_url || undefined,
      videoPreviewUrl: r.video_url || undefined,
      videoDuration: r.video_duration || undefined,
      videoTitle: r.video_title || undefined,
      liveRoomTitle: r.live_room_label || undefined,
      liveRoomHref: r.live_room_id ? `/live/${r.live_room_id}` : undefined,
      likesCount: parseInt(r.likes_count || '0', 10),
      isLiked: !!r.is_liked,
      isSaved: false,
      sharesCount: parseInt(r.shares_count || '0', 10),
      commentsCount: parseInt(r.comments_count || '0', 10),
      isPinned: !!r.is_pinned,
      createdAt: r.created_at,
    };
  });

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + posts.length < total,
    },
  };
}

/**
 * Create a new Square Post
 */
export async function createSquarePost(params: {
  userId: string;
  content: string;
  mediaType?: 'none' | 'single_image' | 'two_images' | 'multi_images' | 'video' | 'live_room';
  images?: string[];
  videoUrl?: string;
  videoThumbnailUrl?: string;
  videoDuration?: string;
  videoTitle?: string;
  liveRoomLabel?: string;
  liveRoomId?: string;
  hashtags?: string[];
  visibility?: 'Public' | 'Followers' | 'Following' | 'Private' | 'VIP Circle';
}) {
  const {
    userId,
    content,
    mediaType = 'none',
    images = [],
    videoUrl,
    videoThumbnailUrl,
    videoDuration,
    videoTitle,
    liveRoomLabel,
    liveRoomId,
    hashtags = [],
    visibility = 'Public',
  } = params;

  if (!content || !content.trim()) {
    if (images.length === 0 && !videoUrl) {
      throw new Error('POST_CONTENT_EMPTY');
    }
  }

  if (content.length > 500) {
    throw new Error('POST_CONTENT_TOO_LONG');
  }

  let determinedMediaType = mediaType;
  if (videoUrl) {
    determinedMediaType = 'video';
  } else if (images.length === 1) {
    determinedMediaType = 'single_image';
  } else if (images.length === 2) {
    determinedMediaType = 'two_images';
  } else if (images.length > 2) {
    determinedMediaType = 'multi_images';
  }

  // Extract hashtags from content if not explicitly supplied
  const autoTags = hashtags.length > 0 ? hashtags : (content.match(/#[a-zA-Z0-9_]+/g) || []);

  const res = await query(
    `INSERT INTO popolive.square_posts (
      author_id, content, media_type, images, video_url, video_thumbnail_url,
      video_duration, video_title, live_room_label, live_room_id, hashtags, visibility
    ) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, author_id, content, media_type, images, video_url, created_at`,
    [
      userId,
      content.trim(),
      determinedMediaType,
      JSON.stringify(images),
      videoUrl || null,
      videoThumbnailUrl || null,
      videoDuration || null,
      videoTitle || null,
      liveRoomLabel || null,
      liveRoomId || null,
      autoTags,
      visibility,
    ]
  );

  const post = res[0];

  // Log real-time event
  await query(
    `INSERT INTO popolive.square_realtime_events (event_type, target_user_id, payload)
     VALUES ('new_post', NULL, $1::jsonb)`,
    [JSON.stringify({ postId: post.id, authorId: userId, content: post.content })]
  );

  return post;
}

/**
 * Get Post by ID
 */
export async function getSquarePostById(postId: string, currentUserId?: string): Promise<SquarePostItem | null> {
  const sql = `
    SELECT 
      p.id,
      p.author_id,
      p.content,
      p.media_type,
      p.images,
      p.video_url,
      p.video_thumbnail_url,
      p.video_duration,
      p.video_title,
      p.live_room_label,
      p.live_room_id,
      p.hashtags,
      p.visibility,
      p.likes_count,
      p.comments_count,
      p.shares_count,
      p.is_pinned,
      p.status,
      p.created_at,
      u.nickname as author_name,
      u.poppo_id as author_poppo_id,
      u.avatar_url as author_avatar_url,
      u.role as author_role,
      COALESCE(u.wealth_level, 1) as author_level,
      EXISTS(
        SELECT 1 FROM popolive.square_post_likes pl
        WHERE pl.post_id = p.id AND pl.user_id = ${currentUserId ? `'${currentUserId}'` : 'NULL'}
      ) as is_liked
    FROM popolive.square_posts p
    JOIN popolive.users u ON p.author_id = u.id
    WHERE p.id = $1 AND p.status = 'published'
  `;

  const rows = await query(sql, [postId]);
  if (rows.length === 0) return null;

  const r = rows[0];
  let images: string[] = [];
  if (typeof r.images === 'string') {
    try { images = JSON.parse(r.images); } catch (_) { images = []; }
  } else if (Array.isArray(r.images)) {
    images = r.images;
  }

  return {
    id: r.id,
    creator: {
      id: r.author_id,
      name: r.author_name || 'Popo User',
      handle: `@${(r.author_name || 'user').toLowerCase().replace(/\s+/g, '.')}`,
      poppoId: r.author_poppo_id || '900010',
      avatarUrl: r.author_avatar_url || undefined,
      avatarColor: 'from-[#FF1A6C] to-[#7928CA]',
      ringColor: r.author_level >= 5 ? '#FF1768' : '#00E5FF',
      isVerified: r.author_level >= 3,
      isVip: r.author_level >= 5,
      level: r.author_level || 1,
      roleTag: r.author_role === 'host' ? 'Host' : 'Member',
      bio: 'Popo Live Community Star',
      countryFlag: '🌐',
      countryName: 'Pakistan',
      followersCount: 150,
      followingCount: 45,
      status: 'online',
    },
    publishedAgo: timeAgo(r.created_at),
    visibility: r.visibility,
    text: r.content,
    hashtags: r.hashtags || [],
    mediaType: r.media_type,
    images,
    videoThumbnailUrl: r.video_thumbnail_url || undefined,
    videoPreviewUrl: r.video_url || undefined,
    videoDuration: r.video_duration || undefined,
    videoTitle: r.video_title || undefined,
    liveRoomTitle: r.live_room_label || undefined,
    liveRoomHref: r.live_room_id ? `/live/${r.live_room_id}` : undefined,
    likesCount: parseInt(r.likes_count || '0', 10),
    isLiked: !!r.is_liked,
    isSaved: false,
    sharesCount: parseInt(r.shares_count || '0', 10),
    commentsCount: parseInt(r.comments_count || '0', 10),
    isPinned: !!r.is_pinned,
    createdAt: r.created_at,
  };
}

/**
 * Delete a post (by author or admin)
 */
export async function deleteSquarePost(postId: string, userId: string): Promise<boolean> {
  const rows = await query('SELECT author_id FROM popolive.square_posts WHERE id = $1', [postId]);
  if (rows.length === 0) throw new Error('POST_NOT_FOUND');
  if (rows[0].author_id !== userId) throw new Error('FORBIDDEN_NOT_POST_AUTHOR');

  await query("UPDATE popolive.square_posts SET status = 'removed_by_author' WHERE id = $1", [postId]);
  return true;
}

/**
 * Like a Square Post
 */
export async function likeSquarePost(postId: string, userId: string) {
  return await withTransaction(async (client) => {
    // Check post exists
    const postRes = await client.query('SELECT author_id, likes_count FROM popolive.square_posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) throw new Error('POST_NOT_FOUND');
    const post = postRes.rows[0];

    // Insert like (idempotent)
    const likeRes = await client.query(
      `INSERT INTO popolive.square_post_likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING id`,
      [postId, userId]
    );

    const inserted = likeRes.rows.length > 0;
    let newLikesCount = parseInt(post.likes_count || '0', 10);

    if (inserted) {
      const updateRes = await client.query(
        `UPDATE popolive.square_posts
         SET likes_count = likes_count + 1
         WHERE id = $1
         RETURNING likes_count`,
        [postId]
      );
      newLikesCount = parseInt(updateRes.rows[0].likes_count, 10);

      // Push notification to author if not liking own post
      if (post.author_id !== userId) {
        dispatchPushNotification({
          userId: post.author_id,
          payload: {
            type: 'system_notice',
            title: 'New Like on your Square Post',
            body: 'Someone liked your post on Popo Live Square!',
            data: { postId, action: 'like' },
            senderId: userId,
          },
        }).catch(() => null);
      }
    }

    // Log real-time event
    await client.query(
      `INSERT INTO popolive.square_realtime_events (event_type, target_user_id, payload)
       VALUES ('post_liked', $1, $2::jsonb)`,
      [post.author_id, JSON.stringify({ postId, userId, likesCount: newLikesCount })]
    );

    return { success: true, isLiked: true, likesCount: newLikesCount };
  });
}

/**
 * Unlike a Square Post
 */
export async function unlikeSquarePost(postId: string, userId: string) {
  return await withTransaction(async (client) => {
    const deleteRes = await client.query(
      'DELETE FROM popolive.square_post_likes WHERE post_id = $1 AND user_id = $2 RETURNING id',
      [postId, userId]
    );

    const deleted = deleteRes.rows.length > 0;
    let newLikesCount = 0;

    if (deleted) {
      const updateRes = await client.query(
        `UPDATE popolive.square_posts
         SET likes_count = GREATEST(0, likes_count - 1)
         WHERE id = $1
         RETURNING likes_count`,
        [postId]
      );
      newLikesCount = parseInt(updateRes.rows[0]?.likes_count || '0', 10);
    } else {
      const postRes = await client.query('SELECT likes_count FROM popolive.square_posts WHERE id = $1', [postId]);
      newLikesCount = parseInt(postRes.rows[0]?.likes_count || '0', 10);
    }

    return { success: true, isLiked: false, likesCount: newLikesCount };
  });
}

/**
 * Get Comments for a Post
 */
export async function getSquarePostComments(postId: string, currentUserId?: string): Promise<SquareCommentItem[]> {
  const sql = `
    SELECT 
      c.id,
      c.post_id,
      c.author_id,
      c.parent_comment_id,
      c.content,
      c.likes_count,
      c.created_at,
      u.nickname as author_name,
      u.poppo_id as author_poppo_id,
      u.avatar_url as author_avatar_url,
      EXISTS(
        SELECT 1 FROM popolive.square_comment_likes cl
        WHERE cl.comment_id = c.id AND cl.user_id = ${currentUserId ? `'${currentUserId}'` : 'NULL'}
      ) as is_liked
    FROM popolive.square_comments c
    JOIN popolive.users u ON c.author_id = u.id
    WHERE c.post_id = $1 AND c.status = 'active'
    ORDER BY c.created_at ASC
  `;

  const rows = await query(sql, [postId]);

  const allComments: SquareCommentItem[] = rows.map((r: any) => ({
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    authorName: r.author_name || 'Popo User',
    authorHandle: `@${(r.author_name || 'user').toLowerCase().replace(/\s+/g, '.')}`,
    authorAvatarUrl: r.author_avatar_url || undefined,
    authorInitials: getInitials(r.author_name || 'User'),
    authorColor: '#FF1768',
    text: r.content,
    timestamp: timeAgo(r.created_at),
    likes: parseInt(r.likes_count || '0', 10),
    isLiked: !!r.is_liked,
    isOwn: currentUserId === r.author_id,
    parentCommentId: r.parent_comment_id || undefined,
    replies: [],
  }));

  // Build threaded tree
  const commentMap = new Map<string, SquareCommentItem>();
  const rootComments: SquareCommentItem[] = [];

  for (const c of allComments) {
    commentMap.set(c.id, c);
  }

  for (const c of allComments) {
    if (c.parentCommentId && commentMap.has(c.parentCommentId)) {
      commentMap.get(c.parentCommentId)!.replies!.push(c);
    } else {
      rootComments.push(c);
    }
  }

  return rootComments;
}

/**
 * Create a Comment
 */
export async function createSquareComment(params: {
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
}) {
  const { postId, userId, content, parentCommentId } = params;

  if (!content || !content.trim()) {
    throw new Error('COMMENT_EMPTY');
  }

  if (content.length > 300) {
    throw new Error('COMMENT_TOO_LONG');
  }

  return await withTransaction(async (client) => {
    // Check post exists
    const postRes = await client.query('SELECT author_id FROM popolive.square_posts WHERE id = $1', [postId]);
    if (postRes.rows.length === 0) throw new Error('POST_NOT_FOUND');
    const post = postRes.rows[0];

    // Insert comment
    const commentRes = await client.query(
      `INSERT INTO popolive.square_comments (post_id, author_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, post_id, author_id, parent_comment_id, content, likes_count, created_at`,
      [postId, userId, parentCommentId || null, content.trim()]
    );

    const comment = commentRes.rows[0];

    // Increment post comments_count
    await client.query('UPDATE popolive.square_posts SET comments_count = comments_count + 1 WHERE id = $1', [postId]);

    // Push notification to post author
    if (post.author_id !== userId) {
      dispatchPushNotification({
        userId: post.author_id,
        payload: {
          type: 'system_notice',
          title: 'New Comment on your Square Post',
          body: `${content.slice(0, 60)}...`,
          data: { postId, commentId: comment.id, action: 'comment' },
          senderId: userId,
        },
      }).catch(() => null);
    }

    // Push notification to parent comment author if reply
    if (parentCommentId) {
      const parentRes = await client.query('SELECT author_id FROM popolive.square_comments WHERE id = $1', [parentCommentId]);
      if (parentRes.rows.length > 0 && parentRes.rows[0].author_id !== userId) {
        dispatchPushNotification({
          userId: parentRes.rows[0].author_id,
          payload: {
            type: 'system_notice',
            title: 'Reply to your Comment',
            body: `${content.slice(0, 60)}...`,
            data: { postId, commentId: comment.id, action: 'reply' },
            senderId: userId,
          },
        }).catch(() => null);
      }
    }

    // Log real-time event
    await client.query(
      `INSERT INTO popolive.square_realtime_events (event_type, target_user_id, payload)
       VALUES ('new_comment', $1, $2::jsonb)`,
      [post.author_id, JSON.stringify({ postId, commentId: comment.id, content: comment.content })]
    );

    return comment;
  });
}

/**
 * Delete Comment
 */
export async function deleteSquareComment(commentId: string, userId: string) {
  return await withTransaction(async (client) => {
    const comRes = await client.query('SELECT post_id, author_id FROM popolive.square_comments WHERE id = $1', [commentId]);
    if (comRes.rows.length === 0) throw new Error('COMMENT_NOT_FOUND');
    if (comRes.rows[0].author_id !== userId) throw new Error('FORBIDDEN_NOT_COMMENT_AUTHOR');

    const postId = comRes.rows[0].post_id;
    await client.query("UPDATE popolive.square_comments SET status = 'deleted_by_author' WHERE id = $1", [commentId]);
    await client.query('UPDATE popolive.square_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = $1', [postId]);

    return true;
  });
}

/**
 * Like/Unlike Comment
 */
export async function toggleCommentLike(commentId: string, userId: string) {
  return await withTransaction(async (client) => {
    const checkRes = await client.query(
      'SELECT id FROM popolive.square_comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );

    if (checkRes.rows.length > 0) {
      await client.query('DELETE FROM popolive.square_comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
      const upd = await client.query(
        'UPDATE popolive.square_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = $1 RETURNING likes_count',
        [commentId]
      );
      return { isLiked: false, likesCount: parseInt(upd.rows[0]?.likes_count || '0', 10) };
    } else {
      await client.query('INSERT INTO popolive.square_comment_likes (comment_id, user_id) VALUES ($1, $2)', [commentId, userId]);
      const upd = await client.query(
        'UPDATE popolive.square_comments SET likes_count = likes_count + 1 WHERE id = $1 RETURNING likes_count',
        [commentId]
      );
      return { isLiked: true, likesCount: parseInt(upd.rows[0]?.likes_count || '0', 10) };
    }
  });
}

/**
 * Submit Community Report
 */
export async function submitSquareReport(params: {
  reporterId: string;
  targetType: 'post' | 'comment';
  targetId: string;
  reason: string;
  description?: string;
}) {
  const { reporterId, targetType, targetId, reason, description } = params;

  const validReasons = [
    'Spam',
    'Harassment or bullying',
    'Hate speech',
    'Inappropriate content',
    'Violence or threats',
    'Fake or misleading information',
    'Other',
  ];

  if (!validReasons.includes(reason)) {
    throw new Error('INVALID_REPORT_REASON');
  }

  const res = await query(
    `INSERT INTO popolive.square_reports (reporter_id, target_type, target_id, reason, description)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (reporter_id, target_type, target_id) DO UPDATE SET
       reason = EXCLUDED.reason,
       description = EXCLUDED.description,
       status = 'pending'
     RETURNING id, status, created_at`,
    [reporterId, targetType, targetId, reason, description || null]
  );

  return res[0];
}

/**
 * Get Fan Clubs
 */
export async function getFanClubs(currentUserId?: string, search?: string): Promise<FanClubItem[]> {
  const conditions: string[] = ['1=1'];
  const values: any[] = [];
  let idx = 1;

  if (search && search.trim()) {
    values.push(`%${search.trim().toLowerCase()}%`);
    conditions.push(`(LOWER(fc.name) LIKE $${idx} OR LOWER(u.nickname) LIKE $${idx})`);
    idx++;
  }

  const sql = `
    SELECT 
      fc.id,
      fc.name,
      fc.host_id,
      fc.description,
      fc.badge_label,
      fc.club_level,
      fc.member_count,
      fc.cover_image_url,
      fc.accent_tone,
      fc.is_featured,
      u.nickname as host_name,
      u.poppo_id as host_poppo_id,
      u.avatar_url as host_avatar_url,
      u.role as host_role,
      EXISTS(
        SELECT 1 FROM popolive.fan_club_members fcm
        WHERE fcm.club_id = fc.id AND fcm.user_id = ${currentUserId ? `'${currentUserId}'` : 'NULL'}
      ) as is_joined
    FROM popolive.fan_clubs fc
    JOIN popolive.users u ON fc.host_id = u.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY fc.member_count DESC, fc.created_at DESC
  `;

  const rows = await query(sql, values);

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    hostId: r.host_id,
    hostName: r.host_name || 'Host',
    hostHandle: `@${(r.host_name || 'host').toLowerCase().replace(/\s+/g, '.')}`,
    hostPoppoId: r.host_poppo_id || '104892',
    hostAvatarUrl: r.host_avatar_url || undefined,
    hostVerified: true,
    hostVip: true,
    hostRole: r.host_role || 'Live Host',
    coverImageUrl: r.cover_image_url || undefined,
    description: r.description || '',
    memberCount: parseInt(r.member_count || '0', 10),
    clubLevel: parseInt(r.club_level || '1', 10),
    badgeLabel: r.badge_label,
    accentTone: r.accent_tone || 'gold',
    isFeatured: !!r.is_featured,
    isJoined: !!r.is_joined,
  }));
}

/**
 * Join Fan Club
 */
export async function joinFanClub(clubId: string, userId: string) {
  return await withTransaction(async (client) => {
    // Check club exists
    const clubRes = await client.query('SELECT host_id, member_count FROM popolive.fan_clubs WHERE id = $1', [clubId]);
    if (clubRes.rows.length === 0) throw new Error('FAN_CLUB_NOT_FOUND');
    const club = clubRes.rows[0];

    // Insert member
    const memRes = await client.query(
      `INSERT INTO popolive.fan_club_members (club_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (club_id, user_id) DO NOTHING
       RETURNING id`,
      [clubId, userId]
    );

    const inserted = memRes.rows.length > 0;
    if (inserted) {
      await client.query('UPDATE popolive.fan_clubs SET member_count = member_count + 1 WHERE id = $1', [clubId]);

      // Push notification to host
      if (club.host_id !== userId) {
        dispatchPushNotification({
          userId: club.host_id,
          payload: {
            type: 'system_notice',
            title: 'New Fan Club Member!',
            body: 'A new supporter has joined your Official Fan Club!',
            data: { clubId, action: 'fan_club_join' },
            senderId: userId,
          },
        }).catch(() => null);
      }
    }

    const updated = await client.query('SELECT member_count FROM popolive.fan_clubs WHERE id = $1', [clubId]);
    return { success: true, isJoined: true, memberCount: parseInt(updated.rows[0].member_count, 10) };
  });
}

/**
 * Leave Fan Club
 */
export async function leaveFanClub(clubId: string, userId: string) {
  return await withTransaction(async (client) => {
    const delRes = await client.query(
      'DELETE FROM popolive.fan_club_members WHERE club_id = $1 AND user_id = $2 RETURNING id',
      [clubId, userId]
    );

    if (delRes.rows.length > 0) {
      await client.query('UPDATE popolive.fan_clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = $1', [clubId]);
    }

    const updated = await client.query('SELECT member_count FROM popolive.fan_clubs WHERE id = $1', [clubId]);
    return { success: true, isJoined: false, memberCount: parseInt(updated.rows[0].member_count, 10) };
  });
}

/**
 * Get User Fan Club Invites
 */
export async function getUserFanClubInvites(userId: string): Promise<FanClubInviteItem[]> {
  const sql = `
    SELECT 
      fci.id,
      fci.club_id,
      fci.inviter_id,
      fci.invitee_id,
      fci.invite_code,
      fci.status,
      fci.created_at,
      fci.expires_at,
      fc.name as club_name,
      fc.badge_label,
      u.nickname as inviter_name,
      u.avatar_url as inviter_avatar_url
    FROM popolive.fan_club_invites fci
    JOIN popolive.fan_clubs fc ON fci.club_id = fc.id
    JOIN popolive.users u ON fci.inviter_id = u.id
    WHERE fci.invitee_id = $1
    ORDER BY fci.created_at DESC
  `;

  const rows = await query(sql, [userId]);
  return rows.map((r: any) => ({
    id: r.id,
    clubId: r.club_id,
    clubName: r.club_name,
    badgeLabel: r.badge_label,
    inviterId: r.inviter_id,
    inviterName: r.inviter_name || 'Host',
    inviterAvatarUrl: r.inviter_avatar_url || undefined,
    inviteeId: r.invitee_id,
    inviteCode: r.invite_code || '',
    status: r.status,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  }));
}

/**
 * Send Fan Club Invite
 */
export async function sendFanClubInvite(params: {
  clubId: string;
  inviterId: string;
  inviteeId: string;
  inviteCode?: string;
}) {
  const { clubId, inviterId, inviteeId, inviteCode = 'POPO77' } = params;

  if (inviterId === inviteeId) {
    throw new Error('CANNOT_INVITE_SELF');
  }

  const res = await query(
    `INSERT INTO popolive.fan_club_invites (club_id, inviter_id, invitee_id, invite_code, status)
     VALUES ($1, $2, $3, $4, 'pending')
     ON CONFLICT (club_id, invitee_id) DO UPDATE SET
       inviter_id = EXCLUDED.inviter_id,
       invite_code = EXCLUDED.invite_code,
       status = 'pending',
       expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days'
     RETURNING id, club_id, invitee_id, status`,
    [clubId, inviterId, inviteeId, inviteCode]
  );

  // Push notification to invitee
  dispatchPushNotification({
    userId: inviteeId,
    payload: {
      type: 'system_notice',
      title: 'Fan Club Invitation',
      body: 'You have been invited to join an exclusive Fan Club on Popo Live!',
      data: { clubId, inviteId: res[0].id, action: 'fan_club_invite' },
      senderId: inviterId,
    },
  }).catch(() => null);

  return res[0];
}

/**
 * Respond to Fan Club Invite (accept/reject)
 */
export async function respondToFanClubInvite(params: {
  inviteId: string;
  userId: string;
  action: 'accept' | 'reject';
}) {
  const { inviteId, userId, action } = params;

  return await withTransaction(async (client) => {
    const invRes = await client.query(
      'SELECT id, club_id, invitee_id, status FROM popolive.fan_club_invites WHERE id = $1',
      [inviteId]
    );

    if (invRes.rows.length === 0) throw new Error('INVITE_NOT_FOUND');
    const invite = invRes.rows[0];

    if (invite.invitee_id !== userId) throw new Error('FORBIDDEN_NOT_INVITEE');

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await client.query('UPDATE popolive.fan_club_invites SET status = $1 WHERE id = $2', [newStatus, inviteId]);

    if (action === 'accept') {
      // Add as member
      await client.query(
        `INSERT INTO popolive.fan_club_members (club_id, user_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (club_id, user_id) DO NOTHING`,
        [invite.club_id, userId]
      );
      await client.query('UPDATE popolive.fan_clubs SET member_count = member_count + 1 WHERE id = $1', [invite.club_id]);
    }

    return { success: true, status: newStatus, clubId: invite.club_id };
  });
}
