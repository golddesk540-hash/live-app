/**
 * POPO LIVE — REAL-TIME WEBSOCKET AUTHENTICATION
 * 
 * Verifies JWT / session tokens, loads user sessions,
 * and tracks token expiration to trigger automatic disconnect.
 */

import crypto from 'crypto';
import { Pool } from 'pg';
import { WsUserSession } from './wsTypes';

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';

let pgPool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000,
    });
  }
  return pgPool;
}

export class WsAuthService {
  /**
   * Generates a signed stateless token for testing and direct WS authentication
   */
  public static createSignedToken(session: Partial<WsUserSession>, ttlSeconds = 86400): string {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload = {
      userId: session.userId || 'user-default',
      poppoId: session.poppoId || '1234567',
      nickname: session.nickname || 'PopoUser',
      avatarUrl: session.avatarUrl || '/avatars/default.png',
      role: session.role || 'user',
      expiresAt,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Validates a token against HMAC signature or database sessions.
   * Returns WsUserSession if valid, or null if invalid or expired.
   */
  public static async validateToken(token: string): Promise<WsUserSession | null> {
    if (!token || typeof token !== 'string') return null;

    // 1. Check for HMAC-signed token structure
    const dotIndex = token.lastIndexOf('.');
    if (dotIndex > 0) {
      const payloadPart = token.substring(0, dotIndex);
      const signaturePart = token.substring(dotIndex + 1);

      const expectedSig = crypto
        .createHmac('sha256', AUTH_SECRET)
        .update(payloadPart)
        .digest('base64url');

      if (signaturePart === expectedSig) {
        try {
          const payloadJson = Buffer.from(payloadPart, 'base64url').toString('utf-8');
          const payload = JSON.parse(payloadJson);
          const nowSeconds = Math.floor(Date.now() / 1000);

          if (payload.expiresAt && nowSeconds > payload.expiresAt) {
            return null; // Expired
          }

          return {
            userId: payload.userId,
            poppoId: payload.poppoId || '1000000',
            nickname: payload.nickname || 'User',
            avatarUrl: payload.avatarUrl || '/avatars/default.png',
            role: payload.role || 'user',
            expiresAt: payload.expiresAt,
          };
        } catch (_) {
          return null;
        }
      }
    }

    // 2. Check database session token
    try {
      const pool = getDatabasePool();
      const res = await pool.query(
        `SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.role, s.expires_at, s.is_revoked
         FROM popolive.sessions s
         JOIN popolive.users u ON s.user_id = u.id
         WHERE s.session_token = $1 AND s.is_revoked = false AND s.expires_at > CURRENT_TIMESTAMP
         LIMIT 1`,
        [token]
      );

      if (res.rows.length === 0) return null;

      const r = res.rows[0];
      const expiresAtSeconds = Math.floor(new Date(r.expires_at).getTime() / 1000);

      return {
        userId: r.id,
        poppoId: r.poppo_id,
        nickname: r.nickname,
        avatarUrl: r.avatar_url || '/avatars/default.png',
        role: r.role || 'user',
        expiresAt: expiresAtSeconds,
      };
    } catch (err) {
      return null;
    }
  }
}
