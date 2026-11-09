import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_QUALITIES = ['auto', '1080p', '720p', '480p'];

// Quality profile specifications (Agora encoder configs)
const QUALITY_PROFILES: Record<string, { width: number; height: number; fps: number; bitrateKbps: number; hourlyMb: number }> = {
  '1080p': { width: 1920, height: 1080, fps: 30, bitrateKbps: 3000, hourlyMb: 1350 },
  '720p': { width: 1280, height: 720, fps: 30, bitrateKbps: 1800, hourlyMb: 810 },
  '480p': { width: 854, height: 480, fps: 24, bitrateKbps: 800, hourlyMb: 360 },
  'auto': { width: 1280, height: 720, fps: 30, bitrateKbps: 2000, hourlyMb: 900 },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId') || '880219';
    const isDemo = searchParams.get('preview') === 'demo' || roomId === '880219' || roomId === 'demo';

    const authUser = await getAuthenticatedUser(req).catch(() => null);

    // Default reference settings strictly matching 04_09_quality_cost_guard.png:
    // Auto (Recommended) active, Data Cost Guard switch ON
    let settings = {
      preferredQuality: 'auto',
      costGuardEnabled: true,
      lowDataMode: false,
      autoAdjustWeakNetwork: true,
      activeProfile: QUALITY_PROFILES['auto'],
      estimatedHourlyUsageFormatted: '900 MB/hr',
    };

    // If authenticated, check DB for stored preferences
    if (authUser) {
      try {
        const rows = await query(
          `SELECT preferred_quality, cost_guard_enabled, low_data_mode, auto_adjust_weak_network
           FROM popolive.user_quality_settings
           WHERE user_id = $1
           LIMIT 1`,
          [authUser.id]
        );
        if (rows && rows[0]) {
          const r = rows[0];
          const pref = r.preferred_quality || 'auto';
          settings = {
            preferredQuality: pref,
            costGuardEnabled: Boolean(r.cost_guard_enabled),
            lowDataMode: Boolean(r.low_data_mode),
            autoAdjustWeakNetwork: Boolean(r.auto_adjust_weak_network),
            activeProfile: QUALITY_PROFILES[pref] || QUALITY_PROFILES['auto'],
            estimatedHourlyUsageFormatted: `${(QUALITY_PROFILES[pref] || QUALITY_PROFILES['auto']).hourlyMb} MB/hr`,
          };
        }
      } catch (err) {
        console.warn('DB quality settings lookup notice:', err);
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      qualityProfiles: QUALITY_PROFILES,
      roomId,
      isDemo,
    });
  } catch (error: any) {
    console.error('Error in GET /api/live/quality/settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve quality settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const {
      preferredQuality = 'auto',
      costGuardEnabled = true,
      lowDataMode = false,
      roomId = '880219',
    } = body;

    // Validate preferred quality option
    if (!VALID_QUALITIES.includes(preferredQuality)) {
      return NextResponse.json(
        { success: false, error: `Invalid quality option. Allowed: ${VALID_QUALITIES.join(', ')}` },
        { status: 400 }
      );
    }

    const authUser = await getAuthenticatedUser(req).catch(() => null);

    // Save to PostgreSQL if authenticated
    if (authUser) {
      try {
        await query(
          `INSERT INTO popolive.user_quality_settings
             (user_id, preferred_quality, cost_guard_enabled, low_data_mode, auto_adjust_weak_network, updated_at)
           VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id)
           DO UPDATE SET
             preferred_quality = $2,
             cost_guard_enabled = $3,
             low_data_mode = $4,
             updated_at = CURRENT_TIMESTAMP`,
          [authUser.id, preferredQuality, costGuardEnabled, lowDataMode]
        );
      } catch (err) {
        console.warn('DB user quality settings upsert notice:', err);
      }
    }

    // Update active room's current quality status if roomId provided
    if (roomId) {
      try {
        await query(
          `UPDATE popolive.live_rooms
           SET current_stream_quality = $1,
               is_cost_guard_active = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE room_number = $3 OR id::text = $3`,
          [preferredQuality, costGuardEnabled, roomId]
        );
      } catch (err) {
        console.warn('DB live room quality update notice:', err);
      }
    }

    const profile = QUALITY_PROFILES[preferredQuality] || QUALITY_PROFILES['auto'];

    return NextResponse.json({
      success: true,
      message: 'Live quality and cost guard settings saved successfully.',
      settings: {
        preferredQuality,
        costGuardEnabled,
        lowDataMode,
        autoAdjustWeakNetwork: true,
        activeProfile: profile,
        estimatedHourlyUsageFormatted: `${profile.hourlyMb} MB/hr`,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/live/quality/settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save quality settings' },
      { status: 500 }
    );
  }
}
