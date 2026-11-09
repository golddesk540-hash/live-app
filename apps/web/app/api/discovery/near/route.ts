import { NextRequest, NextResponse } from 'next/server';
import { NEAR_FEATURE_ENABLED, isNearFeatureEnabled } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

/**
 * GET /api/discovery/near
 *
 * Strict Requirement (Prompt 03.9):
 * Near must remain OFF by default.
 * Do not return nearby hosts or users.
 * Do not request GPS or store location data.
 */
export async function GET(req: NextRequest) {
  // Feature flag enforcement
  if (!isNearFeatureEnabled()) {
    return NextResponse.json(
      {
        success: true,
        enabled: false,
        status: 'OFF',
        heading: 'Near (Location)',
        message: 'This feature is currently turned OFF.',
        hosts: [],
        users: [],
        gpsRequested: false,
        locationCollection: false,
        requiresClientApproval: true,
      },
      { status: 200 }
    );
  }

  // Future implementation placeholder (Only active after authorized client approval)
  return NextResponse.json(
    {
      success: true,
      enabled: true,
      hosts: [],
      users: [],
    },
    { status: 200 }
  );
}

/**
 * POST /api/discovery/near
 *
 * Strict Privacy & Security:
 * Strictly reject any location data submission while Near is OFF.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      enabled: false,
      error: 'The Near feature is currently turned OFF. Location submission is strictly disabled.',
    },
    { status: 403 }
  );
}
