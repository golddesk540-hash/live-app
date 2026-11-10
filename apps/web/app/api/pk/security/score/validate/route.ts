import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKScoreValidationDto } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: PKScoreValidationDto = await req.json().catch(() => ({}));
    const {
      battleId,
      userId = 'unknown_client',
      source = 'client',
      attemptedScoreA,
      attemptedScoreB,
      idempotencyKey,
    } = body;

    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    // 1. RULE: Direct client-side score modification is strictly forbidden!
    if (source === 'client' || source !== 'backend_service') {
      // Log critical security tampering event
      await query(
        `INSERT INTO popolive.pk_security_events (
           user_id, battle_id, event_type, severity, reason, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          battleId,
          'client_score_tampering_rejected',
          'high',
          'Direct client score update was rejected: only backend authorized transactions are accepted.',
          JSON.stringify({
            attemptedScoreA,
            attemptedScoreB,
            source,
            headers: Object.fromEntries(req.headers.entries()),
          }),
        ]
      ).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          error:
            'Direct client score modification is strictly forbidden. Official PK scores are authoritatively controlled by verified backend services only.',
          code: 'CLIENT_SCORE_MUTATION_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 2. Validate Battle Existence
    const battleRows = await query<any>(
      `SELECT id, status, host_a_score, host_b_score, expires_at 
       FROM popolive.pk_battles 
       WHERE id = $1`,
      [battleId]
    );

    if (!battleRows || battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];

    // 3. RULE: Prevent score changes after battle completion
    if (battle.status !== 'active') {
      await query(
        `INSERT INTO popolive.pk_security_events (
           user_id, battle_id, event_type, severity, reason, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          battleId,
          'post_battle_score_tampering_prevented',
          'medium',
          `Score modification rejected because battle is already ${battle.status}.`,
          JSON.stringify({ battleStatus: battle.status }),
        ]
      ).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          error: `Score modification rejected: PK Battle is already ${battle.status}.`,
          code: 'BATTLE_ALREADY_ENDED',
        },
        { status: 400 }
      );
    }

    // 4. RULE: Prevent duplicate score transactions (Idempotency Key Check)
    if (idempotencyKey) {
      const existingTx = await query<any>(
        `SELECT id FROM popolive.pk_score_events 
         WHERE battle_id = $1 AND transaction_id = $2`,
        [battleId, idempotencyKey]
      ).catch(() => []);

      if (existingTx && existingTx.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate score transaction detected. Transaction already processed.',
            code: 'DUPLICATE_SCORE_TRANSACTION',
          },
          { status: 409 }
        );
      }
    }

    // Valid Backend Score Event
    return NextResponse.json({
      success: true,
      battleId,
      status: 'score_validated',
      currentScoreA: parseInt(battle.host_a_score || '0', 10),
      currentScoreB: parseInt(battle.host_b_score || '0', 10),
      isSecure: true,
      message: 'Official score verification passed.',
    });
  } catch (err: any) {
    console.error('API /api/pk/security/score/validate error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal score validation error' },
      { status: 500 }
    );
  }
}
