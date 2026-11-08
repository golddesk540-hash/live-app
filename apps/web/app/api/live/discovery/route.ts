import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawTab = (searchParams.get('tab') || 'explore').toLowerCase();
    const tab = VALID_TABS.includes(rawTab) ? rawTab : 'explore';
    const country = searchParams.get('country') || '';
    const search = searchParams.get('search') || '';

    const authUser = await getAuthenticatedUser(req).catch(() => null);

    // 1. Fetch real users from database
    let userQuery = `
      SELECT id, poppo_id, nickname, avatar_url, country, country_code,
             bio, host_level, wealth_level, status, created_at
      FROM popolive.users
      WHERE status != 'closed'
    `;
    const params: any[] = [];

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      userQuery += ` AND (nickname ILIKE $${params.length} OR poppo_id ILIKE $${params.length} OR bio ILIKE $${params.length})`;
    }

    if (country.trim() && country.toLowerCase() !== 'all') {
      params.push(country.trim());
      userQuery += ` AND country ILIKE $${params.length}`;
    }

    // Tab-specific filters
    if (tab === 'following' && authUser) {
      params.push(authUser.id);
      userQuery += ` AND id IN (SELECT following_id FROM popolive.follows WHERE follower_id = $${params.length})`;
    } else if (tab === 'new') {
      userQuery += ` ORDER BY created_at DESC LIMIT 20`;
    } else {
      userQuery += ` ORDER BY host_level DESC, wealth_level DESC LIMIT 24`;
    }

    let rows = await query(userQuery, params);

    // If following tab has 0 follows, fallback to recommended creators
    let isFallbackFollowing = false;
    if (tab === 'following' && rows.length === 0) {
      isFallbackFollowing = true;
      rows = await query(
        `SELECT id, poppo_id, nickname, avatar_url, country, country_code,
                bio, host_level, wealth_level, status, created_at
         FROM popolive.users
         ORDER BY host_level DESC LIMIT 6`
      );
    }

    // Default covers if user avatar is local/placeholder
    const defaultCovers = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516726817505-f5ed825624d8?w=600&auto=format&fit=crop&q=80',
    ];

    const categoryTitles: Record<string, string[]> = {
      explore: [
        'Late Night Talk Show & Songs 🎵',
        'VIP Party Room Open! Join Mic 🎙️',
        'Chit-Chat & Acoustic Vibes 🎸',
        'Weekend Special Stream with Friends ✨',
        'Dancing & Energy Non-Stop 🔥',
      ],
      pk: [
        '🔥 PK BATTLE ROUND 3! Need top support! 🏆',
        '⚡ Rivalry Clash! Team Islamabad vs Team Lahore!',
        '⚔️ 1v1 Battle! Send Victory Gifts to Win!',
        '👑 Crown Defender Match! Let’s Go!',
      ],
      new: [
        'First time live! Say hello 👋',
        'New creator in town! Welcome me 💖',
        'Making new friends & chatting 🌸',
        'Guitar session - testing live stream 🎸',
      ],
      following: [
        'Live now! Come say hi 🥰',
        'Streaming your favorite requests 🎶',
        'Friday Night Exclusive Hangout ✨',
      ],
    };

    const pkOpponents = ['Sana_Queen', 'Roxana', 'Zaid_Star', 'Kiko_PH', 'Bilal_Pro', 'Elena_Live'];

    // Map rows into rich live room cards
    const rooms = rows.map((u: any, idx: number) => {
      const isPk = tab === 'pk' || idx % 3 === 0;
      const titles = categoryTitles[tab] || categoryTitles.explore;
      const title = titles[idx % titles.length];
      const cover = u.avatar_url && u.avatar_url.startsWith('http')
        ? u.avatar_url
        : defaultCovers[idx % defaultCovers.length];

      // Format viewer count
      const rawCount = Math.floor(1200 + (u.host_level * 320) + (idx * 175));
      const formattedViewers = rawCount >= 1000 ? `${(rawCount / 1000).toFixed(1)}K` : `${rawCount}`;

      return {
        id: `room-${u.poppo_id}`,
        roomTitle: title,
        hostId: u.id,
        hostName: u.nickname,
        hostPoppoId: u.poppo_id,
        hostAvatar: u.avatar_url || cover,
        coverImage: cover,
        country: u.country || 'Pakistan',
        countryCode: u.country_code || 'PK',
        viewers: formattedViewers,
        viewersRaw: rawCount,
        isLive: true,
        isPk,
        pkOpponent: isPk ? pkOpponents[idx % pkOpponents.length] : null,
        category: isPk ? 'PK' : idx % 2 === 0 ? 'Live' : 'Party',
        tags: [isPk ? 'PK Battle' : 'Music', u.country || 'Global'],
      };
    });

    return NextResponse.json({
      success: true,
      tab,
      authenticated: !!authUser,
      currentUser: authUser ? {
        id: authUser.id,
        nickname: authUser.nickname,
        poppoId: authUser.poppo_id,
        avatarUrl: authUser.avatar_url,
      } : null,
      banners: DEFAULT_BANNERS,
      categories: CATEGORY_SHORTCUTS,
      rooms,
      totalRooms: rooms.length,
      isFallbackFollowing,
      tabs: [
        { id: 'explore', label_en: 'Explore', label_ur: 'دریافت کریں', count: rooms.length },
        { id: 'following', label_en: 'Following', label_ur: 'فالوئنگ', count: authUser ? (isFallbackFollowing ? 0 : rooms.length) : null },
        { id: 'new', label_en: 'New', label_ur: 'نئے', count: 24 },
        { id: 'pk', label_en: 'PK', label_ur: 'پی کے', count: 18 },
      ],
    });
  } catch (err: any) {
    console.error('Error in GET /api/live/discovery:', err);
    return NextResponse.json({ error: 'Failed to retrieve live discovery data.' }, { status: 500 });
  }
}
