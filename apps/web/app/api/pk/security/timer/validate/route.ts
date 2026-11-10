import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKTimerValidationDto } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: PKTimerValidationDto = await req.json().catch(() => ({}));
    const {
      battleId,
      userId = 'viewer',
      clientRemainingSeconds,
      source = 'client',
    } = body;

    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    const battleRows = await query<any>(
      `SELECT id, status, timer_status, started_at, duration_seconds, expires_at 
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

    // Compute authoritative remaining seconds from expires_at
    let authoritativeRemaining = 0;
    if (battle.expires_at) {
      const expiresAtMs = new Date(battle.expires_at).getTime();
      const nowMs = Date.now();
      authoritativeRemaining = Math.max(0, Math.floor((expiresAtMs - nowMs) / 1000));
    } else {
      authoritativeRemaining = 298; // Fallback
    }

    // 1. RULE: Client cannot manipulate or restart server timer
    if (source === 'client' && clientRemainingSeconds !== undefined) {
      const discrepancy = Math.abs(clientRemainingSeconds - authoritativeRemaining);
      if (discrepancy > 6) {
        // Client timer drift or tampering detected -> log security notice
        await query(
          `INSERT INTO popolive.pk_security_events (
             user_id, battle_id, event_type, severity, reason, metadata
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            battleId,
            'client_timer_drift_corrected',
            'low',
            `Client timer drifted by ${discrepancy}s from authoritative server clock. Corrected.`,
            JSON.stringify({ clientRemainingSeconds, authoritativeRemaining, discrepancy }),
          ]
        ).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      battleId,
      authoritativeRemainingSeconds: authoritativeRemaining,
      timerStatus: battle.timer_status || 'running',
      battleStatus: battle.status,
      serverTimestamp: Date.now(),
      isSynchronized: true,
      message: 'Authoritative server timer synchronized.',
    });
  } catch (err: any) {
    console.error('API /api/pk/security/timer/validate error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to validate timer' },
      { status: 500 }
    );
  }
}
