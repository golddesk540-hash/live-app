import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

const ALLOWED_FOLDERS = new Set(['images', 'animations', 'thumbnails']);

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const segments = Array.isArray(params.path) ? params.path : [];
    if (segments.length !== 2) {
      return NextResponse.json({ success: false, error: 'Invalid media path.' }, { status: 400 });
    }

    const [folder, fileName] = segments;
    if (
      !ALLOWED_FOLDERS.has(folder) ||
      !fileName ||
      fileName.includes('..') ||
      fileName.includes('/') ||
      fileName.includes('\\')
    ) {
      return NextResponse.json({ success: false, error: 'Forbidden media path.' }, { status: 403 });
    }

    const absPath = path.join(process.cwd(), 'public', 'uploads', 'gifts', folder, fileName);
    if (!fs.existsSync(absPath)) {
      return NextResponse.json({ success: false, error: 'Media asset not found.' }, { status: 404 });
    }

    const ext = path.extname(fileName).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
    const fileBuf = fs.readFileSync(absPath);

    return new NextResponse(fileBuf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuf.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('GET /api/gifts/media error:', err);
    return NextResponse.json({ success: false, error: 'Failed to serve gift asset.' }, { status: 500 });
  }
}
