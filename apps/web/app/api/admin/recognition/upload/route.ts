import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateAndStoreGiftAsset } from '@/lib/giftAssets';
import { generateRecId } from '@/lib/recognition';
import { recognitionErrorJson, requireRecognitionFinanceAdmin } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRecognitionFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let originalName = 'recognition_badge.png';
    let mimeHint = '';
    let category = 'wealth';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => null);
      const file = formData ? (formData.get('file') as File | null) : null;
      category = String(formData?.get('category') || 'wealth');
      if (!file) {
        return NextResponse.json(
          { success: false, errorCode: 'FILE_REQUIRED', error: 'No badge image file provided.' },
          { status: 400 }
        );
      }
      originalName = file.name || 'recognition_badge';
      mimeHint = file.type || '';
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body || !body.fileBase64) {
        return NextResponse.json(
          { success: false, errorCode: 'FILE_REQUIRED', error: 'Missing fileBase64 payload.' },
          { status: 400 }
        );
      }
      category = String(body.category || 'wealth');
      originalName = body.fileName || 'recognition_badge';
      mimeHint = body.mimeType || '';
      const raw = String(body.fileBase64).replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(raw, 'base64');
    } else {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'UNSUPPORTED_CONTENT_TYPE',
          error: 'Use multipart/form-data or JSON base64 for recognition badge upload.',
        },
        { status: 415 }
      );
    }

    const uploaded = validateAndStoreGiftAsset({
      buffer,
      originalName,
      mimeTypeHint: mimeHint,
    });

    await query(
      `INSERT INTO popolive.recognition_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, after_data, ip_address
       ) VALUES ($1, $2, $3, 'upload_recognition_badge', $4, $5, $6, $7::jsonb, $8)`,
      [
        generateRecId('RECAUD'),
        `recognition_badge_${category}`,
        uploaded.fileName,
        auth.actor.actorId,
        auth.actor.actorRole,
        `Uploaded ${category} badge image (${uploaded.byteSize} bytes)`,
        JSON.stringify(uploaded),
        auth.actor.ipAddress,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        module: '7.8',
        asset: { ...uploaded, url: uploaded.fileUrl },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to upload level badge image.');
  }
}
