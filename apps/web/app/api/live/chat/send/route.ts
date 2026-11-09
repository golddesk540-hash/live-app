import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Rate limiting in-memory store (sliding window: max 5 messages in 3 seconds)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 3000;
const RATE_LIMIT_MAX_REQUESTS = 5;

// Helper to escape HTML against XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
      roomId = '880219',
      senderNickname,
      senderAvatarUrl,
      senderRole = 'viewer',
      emoji,
    } = body;
    const text = body.text || body.messageText;

    // 1. Validation: Empty message rejection
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message text cannot be empty' },
        { status: 400 }
      );
    }

    const trimmedText = text.trim();

    // 2. Validation: Maximum 300 characters
    if (trimmedText.length > 300) {
      return NextResponse.json(
        { success: false, error: 'Message exceeds maximum limit of 300 characters' },
        { status: 400 }
      );
    }

    // 3. User identification & Auth check
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const senderId = authUser?.id || body.senderId || 'guest-' + Math.floor(1000 + Math.random() * 9000);
    const finalNickname = escapeHtml(
      authUser?.nickname || senderNickname || `User_${senderId.slice(-4)}`
    );
    const finalAvatar = authUser?.avatar_url || senderAvatarUrl || '/assets/studio/host_zara_avatar.png';
    const finalRole = body.senderRole === 'host' ? 'host' : (authUser?.role === 'admin' ? 'admin' : 'viewer');

    // 4. Rate Limiting: max 5 messages per 3s
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `${clientIp}_${senderId}`;
    const now = Date.now();
    const timestamps = rateLimitMap.get(rateLimitKey) || [];
    const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        { success: false, error: 'Too many messages sent. Please slow down.' },
        { status: 429 }
      );
    }

    validTimestamps.push(now);
    rateLimitMap.set(rateLimitKey, validTimestamps);

    // 5. HTML escaping/sanitization
    const sanitizedText = escapeHtml(trimmedText);
    const sanitizedEmoji = emoji ? escapeHtml(emoji.trim()) : '';

    // 6. Persist to PostgreSQL database
    let createdMessage: any = null;
    try {
      const insertSql = `
        INSERT INTO popolive.live_room_messages 
          (room_id, sender_id, sender_nickname, sender_avatar_url, sender_role, message_text, emoji)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, room_id, sender_id, sender_nickname, sender_avatar_url, sender_role, 
                  message_text, emoji, is_pinned, created_at
      `;
      const rows = await query(insertSql, [
        String(roomId),
        String(senderId),
        finalNickname,
        finalAvatar,
        finalRole,
        sanitizedText,
        sanitizedEmoji || null,
      ]);

      if (rows && rows[0]) {
        const row = rows[0];
        createdMessage = {
          id: row.id,
          roomId: row.room_id,
          senderId: row.sender_id,
          senderNickname: row.sender_nickname,
          senderAvatarUrl: row.sender_avatar_url,
          senderRole: row.sender_role,
          messageText: row.message_text,
          emoji: row.emoji || '',
          fullText: row.emoji ? `${row.message_text} ${row.emoji}` : row.message_text,
          isPinned: !!row.is_pinned,
          createdAt: new Date(row.created_at).toISOString(),
        };
      }
    } catch (dbErr) {
      console.warn('DB chat insert fallback to in-memory response:', dbErr);
    }

    if (!createdMessage) {
      // In-memory fallback
      createdMessage = {
        id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        roomId: String(roomId),
        senderId: String(senderId),
        senderNickname: finalNickname,
        senderAvatarUrl: finalAvatar,
        senderRole: finalRole,
        messageText: sanitizedText,
        emoji: sanitizedEmoji,
        fullText: sanitizedEmoji ? `${sanitizedText} ${sanitizedEmoji}` : sanitizedText,
        isPinned: false,
        createdAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: createdMessage,
    });
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send chat message' },
      { status: 500 }
    );
  }
}
