import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { requireGiftAdmin } from '@/lib/giftAdminAuth';
import { validateAndStoreGiftAsset } from '@/lib/giftAssets';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireGiftAdmin(req);
    if (!auth.ok) return auth.response;

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let originalName = 'animation_asset.png';
    let mimeHint = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => null);
      const file = formData ? (formData.get('file') as File | null) : null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No animation or sound asset supplied.' }, { status: 400 });
      }
      originalName = file.name || 'animation_asset';
      mimeHint = file.type || '';
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body || !body.fileBase64) {
        return NextResponse.json({ success: false, error: 'Missing fileBase64 payload.' }, { status: 400 });
      }
      originalName = body.fileName || 'animation_asset';
      mimeHint = body.mimeType || '';
      const raw = String(body.fileBase64).replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(raw, 'base64');
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type. Use multipart/form-data or JSON base64.' },
        { status: 415 }
      );
    }

    const uploaded = validateAndStoreGiftAsset({
      buffer,
      originalName,
      mimeTypeHint: mimeHint,
    });

    await query(
      `INSERT INTO popolive.animation_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, after_data, ip_address
       ) VALUES ($1, 'animation_asset', $2, 'upload_animation_asset', $3, $4, $5, $6::jsonb, $7)`,
      [
        `AAUD_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        uploaded.fileName,
        auth.actor.actorId,
        auth.actor.actorRole,
        `Uploaded ${uploaded.assetType} asset (${uploaded.byteSize} bytes)`,
        JSON.stringify(uploaded),
        auth.actor.ipAddress,
      ]
    );

    return NextResponse.json({ success: true, asset: uploaded }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/animations/upload error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to upload animation or sound asset.',
        code: err?.code || 'UPLOAD_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
