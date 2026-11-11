import { NextRequest, NextResponse } from 'next/server';
import {
  adminToggleCoinPackageStatus,
  adminUpsertCoinPackage,
  listCoinPackages,
} from '@/lib/topup';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isFinanceAdmin) {
      return NextResponse.json(
        { success: false, errorCode: 'FINANCE_ADMIN_REQUIRED', error: 'Forbidden: Finance admin access required.' },
        { status: 403 }
      );
    }
    const packages = await listCoinPackages({ includeInactive: true });
    return NextResponse.json({ success: true, packages });
  } catch (err: any) {
    console.error('GET /api/admin/finance/topup/packages error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to load packages.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isFinanceAdmin) {
      return NextResponse.json(
        { success: false, errorCode: 'FINANCE_ADMIN_REQUIRED', error: 'Forbidden: Finance admin access required.' },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const pkg = await adminUpsertCoinPackage({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      packageId: String(body.packageId || ''),
      packageName: String(body.packageName || ''),
      packageNameUr: body.packageNameUr || null,
      baseCoins: Number(body.baseCoins),
      bonusCoins: body.bonusCoins !== undefined ? Number(body.bonusCoins) : 0,
      priceAmount: Number(body.priceAmount),
      currency: body.currency || 'USD',
      badgeText: body.badgeText || null,
      isPopular: Boolean(body.isPopular),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : 50,
      platformProductIdIos: body.platformProductIdIos || null,
      platformProductIdAndroid: body.platformProductIdAndroid || null,
    });
    return NextResponse.json({ success: true, package: pkg });
  } catch (err: any) {
    console.error('POST /api/admin/finance/topup/packages error:', err);
    return NextResponse.json(
      { success: false, errorCode: err?.code, error: err?.message || 'Failed to save package.' },
      { status: err?.status || 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isFinanceAdmin) {
      return NextResponse.json(
        { success: false, errorCode: 'FINANCE_ADMIN_REQUIRED', error: 'Forbidden: Finance admin access required.' },
        { status: 403 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const pkg = await adminToggleCoinPackageStatus({
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      packageId: String(body.packageId || ''),
      isActive: Boolean(body.isActive),
    });
    return NextResponse.json({ success: true, package: pkg });
  } catch (err: any) {
    console.error('PATCH /api/admin/finance/topup/packages error:', err);
    return NextResponse.json(
      { success: false, errorCode: err?.code, error: err?.message || 'Failed to toggle package.' },
      { status: err?.status || 500 }
    );
  }
}
