import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rankDoors = [
      {
        id: 'event',
        title: 'Event',
        titleUrdu: 'ایونٹ',
        icon: 'calendar',
        iconType: 'event',
        gradient: 'from-[#a855f7] to-[#ec4899]',
        destination: '/news',
        hasNotificationDot: true,
        description: 'Special Live Campaigns & Carnivals',
        order: 1,
      },
      {
        id: 'rank',
        title: 'Rank',
        titleUrdu: 'رینکنگ',
        icon: 'trophy',
        iconType: 'rank',
        gradient: 'from-[#f59e0b] to-[#ea580c]',
        destination: '/ranking',
        hasNotificationDot: false,
        description: 'Host, Wealth & Popularity Leaderboards',
        order: 2,
      },
      {
        id: 'agency',
        title: 'Agency',
        titleUrdu: 'ایجنسی',
        icon: 'award',
        iconType: 'agency',
        gradient: 'from-[#0ea5e9] to-[#3b82f6]',
        destination: '/agency',
        hasNotificationDot: false,
        description: 'Guilds & Creator Agency Services',
        order: 3,
      },
      {
        id: 'notice',
        title: 'Notice',
        titleUrdu: 'اطلاعات',
        icon: 'bell',
        iconType: 'notice',
        gradient: 'from-[#ec4899] to-[#f43f5e]',
        destination: '/news',
        hasNotificationDot: false,
        description: 'Official Platform News & Policy Updates',
        order: 4,
      },
    ];

    return NextResponse.json({
      success: true,
      doors: rankDoors,
    });
  } catch (error: any) {
    console.error('Error fetching rank doors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rank doors', details: error.message },
      { status: 500 }
    );
  }
}
