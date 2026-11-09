import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CURRENT_POLICY_VERSION, POLICY_EFFECTIVE_DATE, CANONICAL_HOST_RULES } from '@/lib/rules';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let rules = CANONICAL_HOST_RULES;
    let activeVersion = CURRENT_POLICY_VERSION;

    try {
      const rows = await query(
        `SELECT id, title, description, category, icon, display_order, is_active, policy_version
         FROM popolive.host_rules
         WHERE is_active = TRUE
         ORDER BY display_order ASC`
      );

      if (rows && rows.length > 0) {
        rules = rows.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          category: r.category,
          icon: r.icon,
          displayOrder: r.display_order,
          isActive: r.is_active,
          policyVersion: r.policy_version,
        }));
        activeVersion = rows[0].policy_version || CURRENT_POLICY_VERSION;
      }
    } catch (dbErr) {
      console.warn('DB read warning, using seeded defaults:', dbErr);
    }

    return NextResponse.json({
      success: true,
      policyVersion: activeVersion,
      effectiveDate: POLICY_EFFECTIVE_DATE,
      rules,
      totalRules: rules.length,
      branding: 'poppo Live',
      module: '4.10 Host Rules on Screen',
    });
  } catch (error: any) {
    console.error('API /live/rules GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve host safety rules' },
      { status: 500 }
    );
  }
}
