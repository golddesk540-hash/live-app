import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateAndStoreGiftAsset } from '@/lib/giftAssets';
import { generateStoreId } from '@/lib/store';
import { requireStoreFinanceAdmin, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireStoreFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let originalName = 'store_item.png';
    let mimeHint = '';
    let kind = 'thumbnail';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => null);
      const file = formData ? (formData.get('file') as File | null) : null;
      kind = String(formData?.get('kind') || 'thumbnail');
      if (!file) {
        return NextResponse.json(
          { success: false, errorCode: 'FILE_REQUIRED', error: 'No image or animation asset provided.' },
          { status: 400 }
        );
      }
      originalName = file.name || 'store_item.png';
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
      kind = String(body.kind || 'thumbnail');
      originalName = body.fileName || 'store_item.png';
      mimeHint = body.mimeType || '';
      const raw = String(body.fileBase64).replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(raw, 'base64');
    } else {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'UNSUPPORTED_CONTENT_TYPE',
          error: 'Use multipart/form-data or JSON base64 for store asset upload.',
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
      `INSERT INTO popolive.store_admin_audit_logs (
         audit_id, admin_id, actor_role, action_type, target_id, reason, details
       ) VALUES ($1, $2, $3, 'upload_asset', $4, $5, $6::jsonb)`,
      [
        generateStoreId('STR_AUD'),
        auth.actor.actorId,
        auth.actor.actorRole,
        uploaded.fileName,
        `Uploaded ${kind} asset`,
        JSON.stringify({ fileUrl: uploaded.fileUrl, mimeType: uploaded.mimeType, byteSize: uploaded.byteSize }),
      ]
    );

    return NextResponse.json({
      success: true,
      asset: {
        ...uploaded,
        url: uploaded.fileUrl,
      },
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to upload store item asset.');
  }
}
