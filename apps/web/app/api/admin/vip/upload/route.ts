import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { validateAndStoreGiftAsset } from '@/lib/giftAssets';
import { requireVipFinanceAdmin, vipErrorJson } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVipFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let originalName = 'vip_asset.png';
    let mimeHint = '';
    let assetKind = 'badge';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => null);
      const file = formData ? (formData.get('file') as File | null) : null;
      assetKind = String(formData?.get('assetKind') || 'badge');
      if (!file) {
        return NextResponse.json(
          { success: false, errorCode: 'FILE_REQUIRED', error: 'No VIP badge or frame file supplied.' },
          { status: 400 }
        );
      }
      originalName = file.name || 'vip_asset';
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
      assetKind = String(body.assetKind || 'badge');
      originalName = body.fileName || 'vip_asset';
      mimeHint = body.mimeType || '';
      const raw = String(body.fileBase64).replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(raw, 'base64');
    } else {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'UNSUPPORTED_CONTENT_TYPE',
          error: 'Use multipart/form-data or JSON base64 for VIP asset upload.',
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
      `INSERT INTO popolive.vip_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, after_data, ip_address
       ) VALUES ($1, $2, $3, 'upload_vip_asset', $4, $5, $6, $7::jsonb, $8)`,
      [
        `VIPAUD_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        `vip_${assetKind}_asset`,
        uploaded.fileName,
        auth.actor.actorId,
        auth.actor.actorRole,
        `Uploaded VIP ${assetKind} asset (${uploaded.byteSize} bytes)`,
        JSON.stringify(uploaded),
        auth.actor.ipAddress,
      ]
    );

    return NextResponse.json({ success: true, module: '7.7', asset: uploaded }, { status: 201 });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to upload VIP badge or frame asset.');
  }
}
