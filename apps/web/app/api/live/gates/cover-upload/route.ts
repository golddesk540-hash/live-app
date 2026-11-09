import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES: { [key: string]: string } = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let ext = '.jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json({ success: false, error: 'No form data submitted.' }, { status: 400 });
      }

      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: 'No image file provided in form data.' }, { status: 400 });
      }

      mimeType = file.type.toLowerCase();
      if (!ALLOWED_MIME_TYPES[mimeType]) {
        return NextResponse.json(
          { success: false, error: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Cover image file size exceeds the 5MB limit.' },
          { status: 400 }
        );
      }

      const originalName = file.name.toLowerCase();
      const dangerousExtensions = ['.exe', '.sh', '.bat', '.php', '.phtml', '.js', '.vbs', '.cmd', '.py', '.pl'];
      if (dangerousExtensions.some((extItem) => originalName.endsWith(extItem))) {
        return NextResponse.json({ success: false, error: 'Prohibited file type.' }, { status: 400 });
      }

      ext = ALLOWED_MIME_TYPES[mimeType];
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);
      if (!body || !body.imageBase64) {
        return NextResponse.json({ success: false, error: 'Missing imageBase64 in request body.' }, { status: 400 });
      }

      const base64Data = body.imageBase64;
      const matches = base64Data.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ success: false, error: 'Invalid base64 image format.' }, { status: 400 });
      }

      mimeType = matches[1].toLowerCase();
      if (!ALLOWED_MIME_TYPES[mimeType]) {
        return NextResponse.json(
          { success: false, error: 'Invalid image type in base64. Only JPG, PNG, and WebP are allowed.' },
          { status: 400 }
        );
      }

      ext = ALLOWED_MIME_TYPES[mimeType];
      buffer = Buffer.from(matches[2], 'base64');

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Cover image file size exceeds the 5MB limit.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' },
        { status: 400 }
      );
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json({ success: false, error: 'Empty file payload.' }, { status: 400 });
    }

    // Save to disk in public/uploads/covers/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const filename = `cover_${user.id.substring(0, 8)}_${Date.now()}_${uniqueId}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const coverUrl = `/uploads/covers/${filename}`;

    // Update PostgreSQL
    await query(
      `UPDATE popolive.users
       SET live_cover_url = $1,
           live_cover_updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [coverUrl, user.id]
    );

    return NextResponse.json({
      success: true,
      coverUrl,
      message: 'Cover image uploaded and verified successfully.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/live/gates/cover-upload:', err);
    return NextResponse.json({ success: false, error: 'Failed to upload cover image' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await query(
      `UPDATE popolive.users
       SET live_cover_url = NULL,
           live_cover_updated_at = CURRENT_TIMESTAMP,
           go_live_eligible = false
       WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Live cover image removed successfully.',
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/live/gates/cover-upload:', err);
    return NextResponse.json({ success: false, error: 'Failed to delete cover image' }, { status: 500 });
  }
}
