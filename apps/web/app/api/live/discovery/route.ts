import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getCountryFlag } from '@/lib/countries';

export const dynamic = 'force-dynamic';

const VALID_TABS = ['explore', 'following', 'new', 'pk'];

const DEFAULT_BANNERS = [
  {
    id: 'banner-hero-1',
    title: 'Popo Live',
    subtitle: 'Live • Party • PK • Chat',
    tagline: 'Join millions of creators streaming live 24/7',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    link: '/live/explore',
    gradient: 'from-purple-900 via-indigo-900 to-pink-600',
  },
  {
    id: 'banner-pk-world-cup',
    title: 'PK Battle Championship 2026',
    subtitle: 'Daily Top Creators Battle for $10,000 Prizes',
    tagline: 'Cheer for your favorite streamer with special victory gifts',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    link: '/live/pk',
    gradient: 'from-rose-900 via-purple-900 to-amber-600',
  },
];

const CATEGORY_SHORTCUTS = [
  { id: 'live', name_en: 'Live', name_ur: 'لائیو', icon: 'camera', color: 'from-pink-500 to-rose-600', href: '/live/explore' },
  { id: 'party', name_en: 'Party', name_ur: 'پارٹی', icon: 'video', color: 'from-blue-500 to-cyan-600', href: '/live/explore?category=party' },
  { id: 'pk', name_en: 'PK', name_ur: 'پی کے', icon: 'swords', color: 'from-purple-600 to-pink-600', href: '/live/pk' },
  { id: 'rank', name_en: 'Rank', name_ur: 'رینک', icon: 'trophy', color: 'from-amber-500 to-yellow-600', href: '/agency' },
];

function formatMetric(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTab = (searchParams.get('tab') || 'explore').toLowerCase();
    const tab = VALID_TABS.includes(rawTab) ? rawTab : 'explore';
    const country = searchParams.get('country') || '';
    const search = searchParams.get('search') || '';

    const authUser = await getAuthenticatedUser(req).catch(() => null);

    let whereClause = ["lr.is_live = true", "lr.status = 'live'"];
    let params: any[] = [];

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      whereClause.push(`(lr.title ILIKE $${params.length} OR u.nickname ILIKE $${params.length} OR u.poppo_id ILIKE $${params.length})`);
    }

    if (country.trim() && country.toLowerCase() !== 'all') {
      params.push(country.trim().toUpperCase());
      whereClause.push(`lr.country_code = $${params.length}`);
    }

    if (tab === 'pk') {
      whereClause.push('lr.is_pk = true');
    }

    let isFallbackFollowing = false;

    if (tab === 'following') {
      if (authUser) {
        params.push(authUser.id);
        whereClause.push(`lr.host_id IN (SELECT following_id FROM popolive.user_follows WHERE follower_id = $${params.length})`);
      } else {
        // Guest user on following tab has 0 follows -> trigger fallback
        isFallbackFollowing = true;
      }
    }

    let sql = `
      SELECT 
        lr.id,
        lr.room_number,
        lr.host_id,
        lr.title,
        lr.cover_url,
        lr.category,
        lr.is_live,
        lr.is_pk,
        lr.current_pk_id,
        lr.viewer_count,
        lr.coins_earned,
        lr.country,
        lr.country_code,
        lr.tags,
        u.id AS user_id,
        u.nickname AS host_nickname,
        u.poppo_id AS host_poppo_id,
        u.avatar_url AS host_avatar_url,
        u_opp.nickname AS opp_nickname
      FROM popolive.live_rooms lr
      JOIN popolive.users u ON lr.host_id = u.id
      LEFT JOIN popolive.pk_activities pk ON lr.current_pk_id = pk.id
      LEFT JOIN popolive.users u_opp ON (
        pk.id IS NOT NULL AND (
          CASE WHEN pk.host_a_id = u.id THEN pk.host_b_id ELSE pk.host_a_id END = u_opp.id
        )
      )
      WHERE ${whereClause.join(' AND ')}
      ${tab === 'new' ? 'ORDER BY lr.created_at DESC' : 'ORDER BY lr.viewer_count DESC'}
      LIMIT 24
    `;

    let rows = await query<any>(sql, params);

    // If following tab had 0 live followed rooms, fallback to recommended
    if (tab === 'following' && rows.length === 0) {
      isFallbackFollowing = true;
      const recSql = `
        SELECT 
          lr.id,
          lr.room_number,
          lr.host_id,
          lr.title,
          lr.cover_url,
          lr.category,
          lr.is_live,
          lr.is_pk,
          lr.current_pk_id,
          lr.viewer_count,
          lr.coins_earned,
          lr.country,
          lr.country_code,
          lr.tags,
          u.id AS user_id,
          u.nickname AS host_nickname,
          u.poppo_id AS host_poppo_id,
          u.avatar_url AS host_avatar_url,
          NULL AS opp_nickname
        FROM popolive.live_rooms lr
        JOIN popolive.users u ON lr.host_id = u.id
        WHERE lr.is_live = true AND lr.status = 'live'
        ORDER BY lr.viewer_count DESC
        LIMIT 6
      `;
      rows = await query<any>(recSql);
    }

    const rooms = rows.map((r: any) => ({
      id: r.id,
      roomNumber: r.room_number,
      roomTitle: r.title,
      hostId: r.host_id,
      hostName: r.host_nickname || 'Streamer',
      hostPoppoId: r.host_poppo_id || '---',
      hostAvatar: r.host_avatar_url || '/avatars/default.png',
      coverImage: r.cover_url || r.host_avatar_url || '/avatars/default.png',
      country: r.country || 'Pakistan',
      countryCode: r.country_code || 'PK',
      flagEmoji: getCountryFlag(r.country_code),
      viewers: formatMetric(r.viewer_count || 0),
      viewersRaw: r.viewer_count || 0,
      coinsEarned: parseInt(r.coins_earned || '0', 10),
      coinsFormatted: formatMetric(parseInt(r.coins_earned || '0', 10)),
      isLive: Boolean(r.is_live),
      isPk: Boolean(r.is_pk),
      pkOpponent: r.opp_nickname || null,
      category: r.category === 'party' ? 'Party' : (r.is_pk ? 'PK' : 'Live'),
      tags: r.tags || ['Live', r.country || 'Pakistan'],
    }));

    // Real tab counts
    const tabCounts = await query<any>(`
      SELECT 
        (SELECT COUNT(*)::int FROM popolive.live_rooms WHERE is_live = true AND status = 'live') AS explore_count,
        (SELECT COUNT(*)::int FROM popolive.pk_activities WHERE status = 'active') AS pk_count,
        (SELECT COUNT(*)::int FROM popolive.users WHERE status = 'active') AS new_count
    `);
    const counts = tabCounts[0] || { explore_count: 0, pk_count: 0, new_count: 0 };

    return NextResponse.json({
      success: true,
      tab,
      authenticated: Boolean(authUser),
      currentUser: authUser ? {
        id: authUser.id,
        poppoId: authUser.poppo_id,
        nickname: authUser.nickname,
        avatarUrl: authUser.avatar_url,
      } : null,
      banners: DEFAULT_BANNERS,
      categories: CATEGORY_SHORTCUTS,
      rooms,
      totalRooms: rooms.length,
      isFallbackFollowing,
      tabs: [
        { id: 'explore', label_en: 'Explore', label_ur: 'دریافت کریں', count: counts.explore_count },
        { id: 'following', label_en: 'Following', label_ur: 'فالوئنگ', count: authUser ? null : 0 },
        { id: 'new', label_en: 'New', label_ur: 'نئے', count: counts.new_count },
        { id: 'pk', label_en: 'PK', label_ur: 'پی کے', count: counts.pk_count },
      ],
    });
  } catch (error: any) {
    console.error('Error fetching discovery feed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load discovery feed', details: error.message },
      { status: 500 }
    );
  }
}
