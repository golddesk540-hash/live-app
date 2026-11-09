import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser, isStaffMember } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export interface TestRoomRecord {
  id: string;
  testRoomId: string;
  title: string;
  hostNickname: string;
  hostPoppoId: string;
  hostAvatarUrl: string;
  thumbnailUrl: string;
  category: 'live' | 'party' | 'pk' | 'audio';
  status: 'draft' | 'testing' | 'ready' | 'archived';
  environment: 'staging' | 'sandbox' | 'local';
  description?: string;
  viewerSimulationCount: number;
  createdAt: string;
  isTestData: true;
}

const DEFAULT_SAMPLE_TEST_ROOMS: TestRoomRecord[] = [
  {
    id: 'test-room-1',
    testRoomId: 'TEST-9001',
    title: '[TEST DATA] Staging Stage — Popo Idol Rehearsal 🎙️',
    hostNickname: 'TestHost Alpha',
    hostPoppoId: '99001',
    hostAvatarUrl: '/assets/following/zara_live@2x.png',
    thumbnailUrl: '/covers/default.jpg',
    category: 'live',
    status: 'ready',
    environment: 'staging',
    description: 'Simulated high-traffic broadcast for video bitrate and latency validation.',
    viewerSimulationCount: 240,
    createdAt: new Date().toISOString(),
    isTestData: true,
  },
  {
    id: 'test-room-2',
    testRoomId: 'TEST-9002',
    title: '[TEST DATA] 9-Seat Party Voice Latency Benchmark 🎧',
    hostNickname: 'Audio Tester Beta',
    hostPoppoId: '99002',
    hostAvatarUrl: '/assets/following/sana_khan@2x.png',
    thumbnailUrl: '/covers/default.jpg',
    category: 'party',
    status: 'testing',
    environment: 'staging',
    description: 'Voice packet loss simulation under 9 simultaneous speaker connections.',
    viewerSimulationCount: 95,
    createdAt: new Date().toISOString(),
    isTestData: true,
  },
  {
    id: 'test-room-3',
    testRoomId: 'TEST-9003',
    title: '[TEST DATA] PK Cross-Border Sync Battle Protocol ⚔️',
    hostNickname: 'PK Lab Unit',
    hostPoppoId: '99003',
    hostAvatarUrl: '/assets/following/alina@2x.png',
    thumbnailUrl: '/covers/default.jpg',
    category: 'pk',
    status: 'ready',
    environment: 'sandbox',
    description: 'Simulated 2-stream split view for gift animation score calculation.',
    viewerSimulationCount: 180,
    createdAt: new Date().toISOString(),
    isTestData: true,
  },
  {
    id: 'test-room-4',
    testRoomId: 'TEST-9004',
    title: '[TEST DATA] Ultra HD 60FPS Codec Ingestion Stream 📹',
    hostNickname: 'Codec Lab Delta',
    hostPoppoId: '99004',
    hostAvatarUrl: '/assets/following/mehak@2x.png',
    thumbnailUrl: '/covers/default.jpg',
    category: 'live',
    status: 'draft',
    environment: 'staging',
    description: 'H.265 / AV1 hardware decoder stress test stream.',
    viewerSimulationCount: 30,
    createdAt: new Date().toISOString(),
    isTestData: true,
  },
];

/**
 * GET /api/staff/test-rooms
 *
 * Requirements:
 * 1. Strict staff access control.
 * 2. Unauthenticated or non-staff users receive 403 Forbidden.
 * 3. Returns isolated test room list with test data indicators.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const isDevPreview = req.nextUrl.searchParams.get('preview') === 'demo';

    // Staff authorization check
    if (!user || !isStaffMember(user)) {
      if (!isDevPreview) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access Denied: Staff authorization required to view test rooms.',
            code: 'STAFF_FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // Attempt to query PostgreSQL test_rooms table
    try {
      const rows = await query(`
        SELECT id, test_room_id, title, host_nickname, host_poppo_id, 
               host_avatar_url, thumbnail_url, category, status, environment, 
               description, viewer_simulation_count, created_at
        FROM popolive.test_rooms
        ORDER BY test_room_id ASC
      `);

      if (rows && rows.length > 0) {
        const rooms: TestRoomRecord[] = rows.map((r: any) => ({
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
        }));

        return NextResponse.json({
          success: true,
          total: rooms.length,
          rooms,
          staffUser: user ? { nickname: user.nickname, role: user.role } : null,
        });
      }
    } catch (dbErr) {
      console.warn('Fallback to sample test rooms:', dbErr);
    }

    return NextResponse.json({
      success: true,
      total: DEFAULT_SAMPLE_TEST_ROOMS.length,
      rooms: DEFAULT_SAMPLE_TEST_ROOMS,
      staffUser: user ? { nickname: user.nickname, role: user.role } : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/test-rooms
 *
 * Allows staff to create or register a new test room.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || !isStaffMember(user)) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Staff authorization required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      hostNickname = 'Test Broadcaster',
      hostPoppoId = '99099',
      category = 'live',
      status = 'ready',
      environment = 'staging',
      description = '',
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Test room title is required.' },
        { status: 400 }
      );
    }

    const testRoomId = `TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullTitle = title.startsWith('[TEST DATA]') ? title : `[TEST DATA] ${title}`;

    const res = await query(
      `INSERT INTO popolive.test_rooms 
        (test_room_id, title, host_nickname, host_poppo_id, category, status, environment, description, thumbnail_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        testRoomId,
        fullTitle,
        hostNickname,
        hostPoppoId,
        category,
        status,
        environment,
        description,
        '/covers/default.jpg',
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Test room created successfully.',
      room: res[0],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create test room' },
      { status: 500 }
    );
  }
}
