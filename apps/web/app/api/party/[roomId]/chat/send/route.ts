import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SendPartyMessageDto, PartyMessage } from '@/lib/party';
import { getUserRecognitionSummary } from '@/lib/recognition';
import { getUserEquippedStoreLoadout } from '@/lib/store';

export const dynamic = 'force-dynamic';

function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body: SendPartyMessageDto = await req.json();

    const {
      senderId,
      senderName,
      senderAvatar,
      senderRole = 'audience',
      seatNumber,
      messageText,
      emoji,
    } = body;

    // 1. Validation
    if (!senderId || !senderName) {
      return NextResponse.json(
        { success: false, error: 'Sender ID and Sender Name are required.' },
        { status: 400 }
      );
    }

    const trimmed = (messageText || '').trim();
    if (!trimmed) {
      return NextResponse.json(
        { success: false, error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    if (trimmed.length > 300) {
      return NextResponse.json(
        { success: false, error: 'Message exceeds maximum length of 300 characters.' },
        { status: 400 }
      );
    }

    // 2. Chat Safety Integration (Module 4.6 Safety Tools)
    // Check if sender is muted
    try {
      const muteRecords = await query(
        `SELECT id FROM popolive.live_room_mutes
         WHERE (room_id = $1 OR room_id = 'global') AND muted_user_id = $2 AND is_active = true
         LIMIT 1`,
        [roomId, senderId]
      );
      if (muteRecords && muteRecords.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'You are muted in this room by the host or a moderator.',
            code: 'USER_MUTED',
          },
          { status: 403 }
        );
      }
    } catch (muteCheckErr) {
      console.warn('Mute check warning:', muteCheckErr);
    }

    // 3. Sanitize message text
    const cleanText = sanitizeHtml(trimmed);

    // Extract first emoji if present or provided
    const emojiMatch = cleanText.match(
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/
    );
    const resolvedEmoji = emoji || (emojiMatch ? emojiMatch[0] : null);

    const avatar = senderAvatar || '/assets/party/chat_avatar_ali_khan.png';

    // 4. Insert into database
    const res = await query(
      `INSERT INTO popolive.party_messages (room_number, sender_id, sender_name, sender_avatar, sender_role, seat_number, message_text, emoji, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id, room_number, sender_id, sender_name, sender_avatar, sender_role, seat_number, message_text, emoji, created_at`,
      [roomId, senderId, senderName, avatar, senderRole, seatNumber || null, cleanText, resolvedEmoji]
    );

    const row = res[0];
    const createdMessage: PartyMessage = {
      id: row.id,
      roomNumber: row.room_number,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar,
      senderRole: row.sender_role,
      seatNumber: row.seat_number ? Number(row.seat_number) : null,
      messageText: row.message_text,
      emoji: row.emoji,
      createdAt: new Date(row.created_at).toISOString(),
    };

    let recBadges: any = null;
    try {
      const rec = await getUserRecognitionSummary(senderId, { includePrivate: false });
      const hasChatDeco =
        rec.wealth.activeBenefitKeys.includes('rec_chat_decoration') ||
        rec.shining.activeBenefitKeys.includes('rec_chat_decoration') ||
        rec.honor.activeBenefitKeys.includes('rec_chat_decoration');
      recBadges = {
        wealthLevel: rec.wealth.currentLevelNumber,
        shiningLevel: rec.shining.currentLevelNumber,
        honorLevel: rec.honor.currentLevelNumber,
        chatDecoration: hasChatDeco ? `W${rec.wealth.currentLevelNumber}|S${rec.shining.currentLevelNumber}|H${rec.honor.currentLevelNumber}` : null,
      };
    } catch {
      recBadges = null;
    }

    let storeEquipment: any = null;
    try {
      storeEquipment = await getUserEquippedStoreLoadout(senderId);
    } catch {
      storeEquipment = null;
    }

    return NextResponse.json({
      success: true,
      message: createdMessage,
      recognitionBadges: recBadges,
      storeEquipment,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/chat/send error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send party message' },
      { status: 500 }
    );
  }
}
