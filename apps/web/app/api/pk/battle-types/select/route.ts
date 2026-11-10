import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { SelectPKBattleTypeDto } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: SelectPKBattleTypeDto = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const { roomNumber, battleType, language = 'en' } = body;
    const hostId = body.hostId || authUser?.id || 'host_maria_7001';

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!roomNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room number is required to configure a PK battle.',
          errorUr: 'پی کے جنگ ترتیب دینے کے لیے کمرے کا نمبر درکار ہے۔',
        },
        { status: 400 }
      );
    }

    if (!battleType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Battle type is required (e.g. 1v1).',
          errorUr: 'جنگ کی قسم کا انتخاب ضروری ہے (جیسے 1 بمقابلہ 1)۔',
        },
        { status: 400 }
      );
    }

    // 1. Fetch battle type config and active feature flag
    const typeRows = await query(
      `SELECT t.id, t.name, t.name_ur, t.is_enabled, t.is_locked, t.feature_flag,
              f.is_enabled as flag_enabled
       FROM popolive.pk_battle_types t
       LEFT JOIN popolive.pk_feature_flags f ON t.feature_flag = f.flag_key
       WHERE t.id = $1`,
      [battleType]
    );

    if (!typeRows || typeRows.length === 0) {
      // Log invalid selection attempt
      await query(
        `INSERT INTO popolive.pk_selection_logs
          (room_number, user_id, attempted_type, was_accepted, rejection_reason, ip_address)
         VALUES ($1, $2, $3, FALSE, $4, $5)`,
        [roomNumber, hostId, String(battleType), 'Unsupported or unknown battle type', ipAddress]
      );

      return NextResponse.json(
        {
          success: false,
          code: 'UNSUPPORTED_BATTLE_TYPE',
          error: `Unsupported battle type "${battleType}". Currently only 1v1 is supported.`,
          errorUr: `غیر تعاون یافتہ جنگ کی قسم۔ فی الحال صرف 1 بمقابلہ 1 تعاون یافتہ ہے۔`,
        },
        { status: 400 }
      );
    }

    const typeConfig = typeRows[0];
    const isFlagActive = typeConfig.feature_flag ? Boolean(typeConfig.flag_enabled) : Boolean(typeConfig.is_enabled);
    const isLocked = Boolean(typeConfig.is_locked) || !isFlagActive;

    // 2. Strict Protection: 4-Host or Locked Battle Types Rejection
    if (isLocked || !isFlagActive) {
      await query(
        `INSERT INTO popolive.pk_selection_logs
          (room_number, user_id, attempted_type, was_accepted, rejection_reason, ip_address)
         VALUES ($1, $2, $3, FALSE, $4, $5)`,
        [roomNumber, hostId, battleType, 'Battle type is currently locked by feature flag', ipAddress]
      );

      return NextResponse.json(
        {
          success: false,
          code: 'BATTLE_TYPE_LOCKED',
          error: '4-Host PK Battle is currently locked. Available in a future release.',
          errorUr: '4 میزبان جنگ فی الوقت مقفل ہے۔ آئندہ ریلیز میں دستیاب ہوگی۔',
          lockedType: battleType,
          featureFlag: typeConfig.feature_flag,
        },
        { status: 403 }
      );
    }

    // 3. Record selected battle type in pk_battle_sessions
    const sessionRes = await query(
      `INSERT INTO popolive.pk_battle_sessions
        (room_number, host_id, battle_type, language, status, configured_at, updated_at)
       VALUES ($1, $2, $3, $4, 'configured', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, room_number, host_id, battle_type, language, status, configured_at`,
      [roomNumber, hostId, battleType, language]
    );

    const session = sessionRes?.[0];

    // 4. Log successful selection audit
    await query(
      `INSERT INTO popolive.pk_selection_logs
        (room_number, user_id, attempted_type, was_accepted, rejection_reason, ip_address)
       VALUES ($1, $2, $3, TRUE, NULL, $4)`,
      [roomNumber, hostId, battleType, ipAddress]
    );

    return NextResponse.json({
      success: true,
      message: `${typeConfig.name} PK Battle selected successfully!`,
      messageUr: `${typeConfig.name_ur} پی کے جنگ کامیابی سے منتخب کر لی گئی!`,
      sessionId: session?.id,
      roomNumber,
      battleType: session?.battle_type || battleType,
      language: session?.language || language,
      status: session?.status || 'configured',
      configuredAt: session?.configured_at,
    });
  } catch (error: any) {
    console.error('Error selecting PK battle type:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error selecting PK battle type' },
      { status: 500 }
    );
  }
}
