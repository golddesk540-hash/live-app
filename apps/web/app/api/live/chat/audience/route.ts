import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId') || '880219';

  const audience = [
    {
      id: 'aud-1',
      nickname: 'Sana Khan',
      poppoId: '889102',
      avatarUrl: '/assets/chat/avatar_sana.png',
      wealthLevel: 15,
      isFollowing: true,
      country: 'PK',
      flag: '🇵🇰',
      badge: 'VIP',
    },
    {
      id: 'aud-2',
      nickname: 'Rizwan Ahmad',
      poppoId: '889103',
      avatarUrl: '/assets/chat/avatar_rizwan.png',
      wealthLevel: 12,
      isFollowing: false,
      country: 'AE',
      flag: '🇦🇪',
      badge: null,
    },
    {
      id: 'aud-3',
      nickname: 'Mehak Noor',
      poppoId: '889104',
      avatarUrl: '/assets/chat/avatar_mehak.png',
      wealthLevel: 9,
      isFollowing: true,
      country: 'TR',
      flag: '🇹🇷',
      badge: null,
    },
    {
      id: 'aud-4',
      nickname: 'Khan G Official',
      poppoId: '889105',
      avatarUrl: '/assets/chat/avatar_khang.png',
      wealthLevel: 18,
      isFollowing: true,
      country: 'PK',
      flag: '🇵🇰',
      badge: 'Top Fan',
    },
    {
      id: 'aud-5',
      nickname: 'Ayesha Malik',
      poppoId: '889106',
      avatarUrl: '/assets/chat/avatar_ayesha.png',
      wealthLevel: 7,
      isFollowing: false,
      country: 'SA',
      flag: '🇸🇦',
      badge: null,
    },
    {
      id: 'aud-6',
      nickname: 'Bilal Tariq',
      poppoId: '889107',
      avatarUrl: '/assets/chat/avatar_bilal.png',
      wealthLevel: 11,
      isFollowing: true,
      country: 'GB',
      flag: '🇬🇧',
      badge: null,
    },
  ];

  return NextResponse.json({
    success: true,
    roomId,
    totalCount: 7600,
    displayCount: '7.6K',
    audience,
  });
}
