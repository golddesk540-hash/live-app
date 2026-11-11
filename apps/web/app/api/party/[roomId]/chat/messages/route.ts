import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PartyMessage } from '@/lib/party';
import { getBatchEquippedStoreLoadouts } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const { searchParams } = new URL(req.url);

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const before = searchParams.get('before');

    let rows: any[] = [];
    if (before) {
      rows = await query(
        `SELECT id, room_number, sender_id, sender_name, sender_avatar, sender_role, 
                seat_number, message_text, emoji, created_at
         FROM popolive.party_messages
         WHERE room_number = $1 AND is_deleted = false AND created_at < $2
         ORDER BY created_at ASC
         LIMIT $3`,
        [roomId, before, limit]
      );
    } else {
      rows = await query(
        `SELECT id, room_number, sender_id, sender_name, sender_avatar, sender_role, 
                seat_number, message_text, emoji, created_at
         FROM popolive.party_messages
         WHERE room_number = $1 AND is_deleted = false
         ORDER BY created_at ASC
         LIMIT $2`,
        [roomId, limit]
      );
    }

    const senderIds = Array.from(
      new Set((rows || []).map((r: any) => String(r.sender_id || '').trim()).filter(Boolean))
    );
    const vipByUser = new Map<string, { vipLevel: number; vipBadgeLabel: string; nameDecorationStyle: string }>();
    if (senderIds.length > 0) {
      const vipRows = await query<any>(
        `SELECT DISTINCT ON (user_id) user_id, vip_level, badge_label, name_decoration_style, granted_benefits
         FROM popolive.vip_membership_records
         WHERE user_id = ANY($1) AND status = 'active' AND expiry_date > NOW()
         ORDER BY user_id, vip_level DESC`,
        [senderIds]
      );
      for (const vr of vipRows) {
        const keys: string[] = Array.isArray(vr.granted_benefits)
          ? vr.granted_benefits
          : JSON.parse(vr.granted_benefits || '[]');
        if (keys.includes('special_chat_badge')) {
          vipByUser.set(String(vr.user_id), {
            vipLevel: parseInt(String(vr.vip_level), 10),
            vipBadgeLabel: vr.badge_label,
            nameDecorationStyle: vr.name_decoration_style || 'gold_shimmer',
          });
        }
      }
    }

    const storeByUser = senderIds.length > 0 ? await getBatchEquippedStoreLoadouts(senderIds).catch(() => new Map()) : new Map();

    const messages: PartyMessage[] = (rows || []).map((r) => {
      const vipInfo = vipByUser.get(String(r.sender_id || ''));
      const storeEq = storeByUser.get(String(r.sender_id || ''));
      return {
        id: r.id,
        roomNumber: r.room_number,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderAvatar: r.sender_avatar || '/assets/party/chat_avatar_ali_khan.png',
        senderRole: r.sender_role || 'audience',
        seatNumber: r.seat_number ? Number(r.seat_number) : null,
        messageText: r.message_text,
        emoji: r.emoji,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        vipLevel: vipInfo?.vipLevel || 0,
        vipBadgeLabel: vipInfo?.vipBadgeLabel || null,
        vipNameDecorationStyle: vipInfo?.nameDecorationStyle || null,
        storeChatDecoration: storeEq?.chatDecoration || null,
        storeNameDecoration: storeEq?.nameDecoration || null,
        storeSpecialBadge: storeEq?.specialBadge || null,
      } as any;
    });

    return NextResponse.json({
      success: true,
      roomNumber: roomId,
      count: messages.length,
      messages,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/chat/messages error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve party chat messages' },
      { status: 500 }
    );
  }
}
