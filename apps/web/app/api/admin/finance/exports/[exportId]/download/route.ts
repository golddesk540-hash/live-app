import { NextRequest, NextResponse } from 'next/server';
import { resolveWalletActor } from '@/lib/walletAuth';
import { authorizeAndReadExportFile } from '@/lib/financeExport';
import { financeErrorJson } from '@/lib/financeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ exportId: string }> | { exportId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const actor = await resolveWalletActor(req);
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    const { buffer, fileName, contentType, sha256Checksum } = await authorizeAndReadExportFile({
      exportId: resolvedParams.exportId,
      actor,
      token,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Export-SHA256': sha256Checksum,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    return financeErrorJson(err, 'Failed to download finance export.');
  }
}
