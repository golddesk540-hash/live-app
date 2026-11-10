import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    const comments = await query(
      `SELECT id, battle_id as "battleId", user_id as "userId", user_name as "userName",
              user_avatar as "userAvatar", content, created_at as "createdAt"
       FROM popolive.pk_comments
       WHERE battle_id = $1
       ORDER BY created_at ASC
       LIMIT 50`,
      [battleId]
    );

    return NextResponse.json({ success: true, comments });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/comment GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    const body = await req.json();
    const { userId, userName, userAvatar, content } = body;

    if (!userId || !userName || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'User ID, User Name, and comment content are required.' },
        { status: 400 }
      );
    }

    const rows = await query(
      `INSERT INTO popolive.pk_comments (battle_id, user_id, user_name, user_avatar, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, battle_id as "battleId", user_id as "userId", user_name as "userName",
                 user_avatar as "userAvatar", content, created_at as "createdAt"`,
      [battleId, userId, userName, userAvatar || null, content.trim()]
    );

    return NextResponse.json({ success: true, comment: rows[0] });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/comment POST error:', err);
    return NextResponse.json({ success: false, error: 'Failed to post comment' }, { status: 500 });
  }
}
