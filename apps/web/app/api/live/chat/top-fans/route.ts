import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId') || '880219';

  const topFans = [
    {
      rank: 1,
      id: 'fan-1',
      nickname: 'Khan G Official',
      avatarUrl: '/assets/chat/avatar_khang.png',
      coinsContributed: 45000,
      badge: '👑',
      crownColor: '#ffd700',
    },
    {
      rank: 2,
      id: 'fan-2',
      nickname: 'Sana Khan',
      avatarUrl: '/assets/chat/avatar_sana.png',
      coinsContributed: 28500,
      badge: '🥈',
      crownColor: '#c0c0c0',
    },
    {
      rank: 3,
      id: 'fan-3',
      nickname: 'Rizwan Ahmad',
      avatarUrl: '/assets/chat/avatar_rizwan.png',
      coinsContributed: 14200,
      badge: '🥉',
      crownColor: '#cd7f32',
    },
    {
      rank: 4,
      id: 'fan-4',
      nickname: 'Bilal Tariq',
      avatarUrl: '/assets/chat/avatar_bilal.png',
      coinsContributed: 8900,
      badge: null,
      crownColor: null,
    },
    {
      rank: 5,
      id: 'fan-5',
      nickname: 'Mehak Noor',
      avatarUrl: '/assets/chat/avatar_mehak.png',
      coinsContributed: 5600,
      badge: null,
      crownColor: null,
    },
  ];

  return NextResponse.json({
    success: true,
    roomId,
    topFans,
  });
}
