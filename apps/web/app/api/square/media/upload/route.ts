import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { resolveSquareActor } from '@/lib/squareCommunity';

export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES: { [key: string]: string } = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALLOWED_VIDEO_TYPES: { [key: string]: string } = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let ext = '.jpg';
    let mediaType: 'image' | 'video' = 'image';

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'square');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json({ success: false, error: 'No form data submitted.' }, { status: 400 });
      }

      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided in form data.' }, { status: 400 });
      }

      mimeType = file.type.toLowerCase();
      const isImage = !!ALLOWED_IMAGE_TYPES[mimeType];
      const isVideo = !!ALLOWED_VIDEO_TYPES[mimeType];

      if (!isImage && !isVideo) {
        return NextResponse.json(
          { success: false, error: 'Invalid file format. Supported: JPG, PNG, WebP images or MP4, WebM videos.' },
          { status: 400 }
        );
      }

      mediaType = isVideo ? 'video' : 'image';
      const maxLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

      if (file.size > maxLimit) {
        return NextResponse.json(
          { success: false, error: `File size exceeds the ${isVideo ? '50MB' : '10MB'} limit.` },
          { status: 400 }
        );
      }

      const originalName = file.name.toLowerCase();
      const dangerousExtensions = ['.exe', '.sh', '.bat', '.php', '.phtml', '.js', '.vbs', '.cmd', '.py', '.pl'];
      if (dangerousExtensions.some((extItem) => originalName.endsWith(extItem))) {
        return NextResponse.json({ success: false, error: 'Prohibited file type.' }, { status: 400 });
      }

      ext = isImage ? ALLOWED_IMAGE_TYPES[mimeType] : ALLOWED_VIDEO_TYPES[mimeType];
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body || (!body.imageBase64 && !body.videoBase64)) {
        return NextResponse.json({ success: false, error: 'Missing imageBase64 or videoBase64 in request body.' }, { status: 400 });
      }

      const rawBase64 = body.imageBase64 || body.videoBase64;
      const matches = rawBase64.match(/^data:([a-zA-Z0-9+/.-]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ success: false, error: 'Invalid base64 media format.' }, { status: 400 });
      }

      mimeType = matches[1].toLowerCase();
      const isImage = !!ALLOWED_IMAGE_TYPES[mimeType];
      const isVideo = !!ALLOWED_VIDEO_TYPES[mimeType];

      if (!isImage && !isVideo) {
        return NextResponse.json(
          { success: false, error: 'Invalid file format. Supported: JPG, PNG, WebP or MP4.' },
          { status: 400 }
        );
      }

      mediaType = isVideo ? 'video' : 'image';
      ext = isImage ? ALLOWED_IMAGE_TYPES[mimeType] : ALLOWED_VIDEO_TYPES[mimeType];
      buffer = Buffer.from(matches[2], 'base64');

      const maxLimit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (buffer.length > maxLimit) {
        return NextResponse.json(
          { success: false, error: `File size exceeds the ${isVideo ? '50MB' : '10MB'} limit.` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported Content-Type.' }, { status: 400 });
    }

    if (!buffer) {
      return NextResponse.json({ success: false, error: 'Failed to process media buffer.' }, { status: 400 });
    }

    const uniqueId = crypto.randomUUID();
    const fileName = `${mediaType}_${uniqueId}${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/square/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      mediaType,
      fileName,
      fileSize: buffer.length,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error uploading square media:', error);
    return NextResponse.json({ success: false, error: error.message || 'UPLOAD_FAILED' }, { status: 500 });
  }
}
