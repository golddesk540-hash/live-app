import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/storageService';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileKey = decodeURIComponent(params.id);
    const searchParams = req.nextUrl.searchParams;
    const expires = searchParams.get('expires');
    const signature = searchParams.get('signature');

    if (!expires || !signature) {
      return NextResponse.json(
        { success: false, error: 'Signed URL parameters (expires, signature) required.', code: 'SIGNATURE_REQUIRED' },
        { status: 403 }
      );
    }

    const verification = storageService.verifySignedUrl(fileKey, expires, signature);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.reason === 'URL_EXPIRED' ? 'This signed media link has expired.' : 'Invalid signature.', code: verification.reason },
        { status: 403 }
      );
    }

    // If local file exists, stream it
    const storageDir = path.resolve(process.cwd(), 'public', 'uploads');
    const localPath = path.join(storageDir, fileKey.replace(/^[^\/]+\//, ''));

    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      let contentType = 'image/jpeg';
      if (fileKey.endsWith('.png')) contentType = 'image/png';
      if (fileKey.endsWith('.webp')) contentType = 'image/webp';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=900',
        },
      });
    }

    // In cloud storage mode, redirect to pre-authenticated cloud URL or CDN
    return NextResponse.json({
      success: true,
      fileKey,
      accessGranted: true,
      url: storageService.getPublicCdnUrl(fileKey),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error accessing media.' },
      { status: 500 }
    );
  }
}
