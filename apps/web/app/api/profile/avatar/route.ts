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
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer | null = null;
    let mimeType = 'image/jpeg';
    let ext = '.jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData().catch(() => null);
      if (!formData) {
        return NextResponse.json({ error: 'No form data submitted.' }, { status: 400 });
      }

      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No image file provided.' }, { status: 400 });
      }

      mimeType = file.type.toLowerCase();
      if (!ALLOWED_MIME_TYPES[mimeType]) {
        return NextResponse.json(
          { error: 'Invalid file format. Only JPG, JPEG, PNG, and WebP images are permitted.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Image file size exceeds the 5MB limit.' },
          { status: 400 }
        );
      }

      // Double-check filename against executable extensions
      const originalName = file.name.toLowerCase();
      const dangerousExtensions = ['.exe', '.sh', '.bat', '.php', '.phtml', '.js', '.vbs', '.cmd', '.py', '.pl'];
      if (dangerousExtensions.some((extItem) => originalName.endsWith(extItem))) {
        return NextResponse.json(
          { error: 'Security violation: Executable files are strictly forbidden.' },
          { status: 400 }
        );
      }

      ext = ALLOWED_MIME_TYPES[mimeType];
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      const base64Data = json.imageBase64 || json.image;

      if (!base64Data || typeof base64Data !== 'string') {
        return NextResponse.json({ error: 'No image base64 data provided.' }, { status: 400 });
      }

      const matches = base64Data.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: 'Invalid image data format.' }, { status: 400 });
      }

      mimeType = matches[1].toLowerCase();
      if (!ALLOWED_MIME_TYPES[mimeType]) {
        return NextResponse.json(
          { error: 'Invalid image format. Only JPG, JPEG, PNG, and WebP images are permitted.' },
          { status: 400 }
        );
      }

      buffer = Buffer.from(matches[2], 'base64');
      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Image file size exceeds the 5MB limit.' },
          { status: 400 }
        );
      }
      ext = ALLOWED_MIME_TYPES[mimeType];
    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type.' }, { status: 400 });
    }

    if (!buffer) {
      return NextResponse.json({ error: 'Failed to process image buffer.' }, { status: 400 });
    }

    const safeFilename = `avatar_${user.id}_${crypto.randomBytes(4).toString('hex')}_${Date.now()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeFilename);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/avatars/${safeFilename}`;

    // Update in database immediately
    await query('UPDATE popolive.users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      publicUrl,
      user.id,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Profile picture updated successfully.',
      avatarUrl: publicUrl,
    });
  } catch (err: any) {
    console.error('Error in POST /api/profile/avatar:', err);
    return NextResponse.json({ error: 'Failed to upload profile picture.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const defaultAvatar = '/avatars/default.png';
    await query('UPDATE popolive.users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
      defaultAvatar,
      user.id,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Profile picture removed and reset to default.',
      avatarUrl: defaultAvatar,
    });
  } catch (err: any) {
    console.error('Error in DELETE /api/profile/avatar:', err);
    return NextResponse.json({ error: 'Failed to reset profile picture.' }, { status: 500 });
  }
}
