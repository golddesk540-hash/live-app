import { NextRequest, NextResponse } from 'next/server';
import { adminUpsertRecognitionLevel } from '@/lib/recognition';
import { recognitionErrorJson, requireRecognitionFinanceAdmin } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

async function handleUpsert(req: NextRequest) {
  try {
    const auth = await requireRecognitionFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, errorCode: 'INVALID_BODY', error: 'JSON body required.' }, { status: 400 });
    }

    const level = await adminUpsertRecognitionLevel({
      levelId: String(body.levelId || ''),
      category: String(body.category || ''),
      levelNumber: Number(body.levelNumber),
      levelName: String(body.levelName || ''),
      levelNameUr: body.levelNameUr ? String(body.levelNameUr) : undefined,
      requiredThreshold: Number(body.requiredThreshold),
      badgeImageUrl: body.badgeImageUrl ? String(body.badgeImageUrl) : undefined,
      iconKey: body.iconKey ? String(body.iconKey) : undefined,
      wingStyle: body.wingStyle ? String(body.wingStyle) : undefined,
      borderColor: body.borderColor ? String(body.borderColor) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      descriptionUr: body.descriptionUr !== undefined ? String(body.descriptionUr) : undefined,
      benefitKeys: Array.isArray(body.benefitKeys) ? body.benefitKeys.map((k: any) => String(k)) : undefined,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      actorId: auth.actor.actorId,
      actorRole: auth.actor.actorRole,
      reason: body.reason ? String(body.reason) : undefined,
      ipAddress: auth.actor.ipAddress,
    });

    return NextResponse.json({ success: true, module: '7.8', level });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to save recognition level configuration.');
  }
}

export async function POST(req: NextRequest) {
  return handleUpsert(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpsert(req);
}
