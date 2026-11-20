import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { storageService } from '@/lib/storageService';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { conversationId } = params;

    // Check conversation participation
    const convRows = await query<any>(
      `SELECT id, participant_one_id, participant_two_id
       FROM popolive.chat_conversations
       WHERE id = $1
       LIMIT 1`,
      [conversationId]
    );

    if (convRows.length > 0) {
      const conv = convRows[0];
      if (conv.participant_one_id !== user.id && conv.participant_two_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'You are not a participant in this conversation.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    }

    const body = await req.json().catch(() => ({}));
    const imageBase64 = body.imageBase64 || body.image;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Image data (imageBase64) is required.', code: 'IMAGE_REQUIRED' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, ''), 'base64');
    const result = await storageService.uploadChatMedia(user.id, conversationId, buffer);

    return NextResponse.json({
      success: true,
      fileKey: result.fileKey,
      signedUrl: result.signedUrl,
      expiresInSeconds: 900,
    });
  } catch (err: any) {
    console.error('Error uploading chat media:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to upload chat image.' },
      { status: err.status || 500 }
    );
  }
}
