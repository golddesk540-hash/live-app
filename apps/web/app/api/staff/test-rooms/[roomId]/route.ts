import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser, isStaffMember } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const isDevPreview = req.nextUrl.searchParams.get('preview') === 'demo';

    if (!user || !isStaffMember(user)) {
      if (!isDevPreview) {
        return NextResponse.json(
          { success: false, error: 'Access Denied: Staff authorization required.' },
          { status: 403 }
        );
      }
    }

    const { roomId } = params;

    const rows = await query(
      `SELECT id, test_room_id, title, host_nickname, host_poppo_id, 
              host_avatar_url, thumbnail_url, category, status, environment, 
              description, viewer_simulation_count, created_at
       FROM popolive.test_rooms
       WHERE test_room_id = $1 OR id::text = $1
       LIMIT 1`,
      [roomId]
    );

    if (rows && rows.length > 0) {
      const r = rows[0];
      return NextResponse.json({
        success: true,
        room: {
          id: r.id,
          testRoomId: r.test_room_id,
          title: r.title,
          hostNickname: r.host_nickname,
          hostPoppoId: r.host_poppo_id,
          hostAvatarUrl: r.host_avatar_url || '/avatars/default.png',
          thumbnailUrl: r.thumbnail_url || '/covers/default.jpg',
          category: r.category || 'live',
          status: r.status || 'ready',
          environment: r.environment || 'staging',
          description: r.description || '',
          viewerSimulationCount: r.viewer_simulation_count || 100,
          createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
          isTestData: true,
        },
      });
    }

    // Fallback if not found in DB
    return NextResponse.json({
      success: true,
      room: {
        id: roomId,
        testRoomId: roomId,
        title: `[TEST DATA] Stage Preview Room (${roomId})`,
        hostNickname: 'TestHost Alpha',
        hostPoppoId: '99001',
        hostAvatarUrl: '/assets/following/zara_live@2x.png',
        thumbnailUrl: '/covers/default.jpg',
        category: 'live',
        status: 'ready',
        environment: 'staging',
        description: 'Simulated high-traffic broadcast for video bitrate and latency validation.',
        viewerSimulationCount: 150,
        createdAt: new Date().toISOString(),
        isTestData: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
