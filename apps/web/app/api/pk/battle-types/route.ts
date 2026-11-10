import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKBattleType, CANONICAL_PK_BATTLE_TYPES } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch feature flags
    const flagsRows = await query(
      `SELECT flag_key, is_enabled FROM popolive.pk_feature_flags`
    );

    const flagsMap: Record<string, boolean> = {};
    (flagsRows || []).forEach((r) => {
      flagsMap[r.flag_key] = Boolean(r.is_enabled);
    });

    const pk1v1Enabled = flagsMap['pk_1v1_enabled'] ?? true;
    const pk4hostEnabled = flagsMap['pk_4host_enabled'] ?? false;

    // 2. Fetch battle types from database
    const typeRows = await query(
      `SELECT id, name, name_ur, description, description_ur, max_hosts, 
              is_enabled, is_locked, feature_flag, display_order, badge_text, badge_text_ur
       FROM popolive.pk_battle_types
       ORDER BY display_order ASC`
    );

    let battleTypes: PKBattleType[] = [];

    if (typeRows && typeRows.length > 0) {
      battleTypes = typeRows.map((r) => {
        const flagKey = r.feature_flag;
        const flagVal = flagKey ? flagsMap[flagKey] ?? r.is_enabled : r.is_enabled;
        const isLocked = r.is_locked || !flagVal;

        return {
          id: r.id,
          name: r.name,
          nameUr: r.name_ur,
          description: r.description,
          descriptionUr: r.description_ur,
          maxHosts: Number(r.max_hosts),
          isEnabled: Boolean(flagVal),
          isLocked: Boolean(isLocked),
          featureFlag: r.feature_flag,
          displayOrder: Number(r.display_order),
          badgeText: r.badge_text,
          badgeTextUr: r.badge_text_ur,
        };
      });
    } else {
      battleTypes = CANONICAL_PK_BATTLE_TYPES;
    }

    return NextResponse.json({
      success: true,
      battleTypes,
      defaultType: '1v1',
      featureFlags: {
        pk1v1Enabled,
        pk4hostEnabled,
      },
    });
  } catch (error: any) {
    console.error('Error fetching PK battle types:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error fetching PK battle types' },
      { status: 500 }
    );
  }
}
