import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// =============================================================================
// Popo Live Phase 7 Module 7.2 / 7.4 — Gift & Animation Asset Validation & Storage
// Supports PNG, WebP, GIF, Lottie JSON, MP4/WebM animations, and WAV/MP3/OGG SFX
// =============================================================================

export type SupportedGiftAssetType = 'png' | 'webp' | 'gif' | 'lottie' | 'video';
export type SupportedUploadAssetType = SupportedGiftAssetType | 'audio';

export const FALLBACK_GIFT_IMAGE_URL = '/assets/gifts/fallback_gift.png';
export const FALLBACK_GIFT_THUMBNAIL_URL = '/assets/gifts/thumbs/fallback_gift.png';

const MAX_STATIC_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ANIMATION_BYTES = 12 * 1024 * 1024; // 12 MB
const MAX_AUDIO_BYTES = 4 * 1024 * 1024; // 4 MB

const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.php',
  '.phtml',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.vbs',
  '.py',
  '.pl',
  '.html',
  '.htm',
  '.svg', // Reject uploaded raw SVG to avoid script injection risks
];

export interface ValidatedGiftUploadResult {
  assetType: SupportedUploadAssetType;
  fileUrl: string;
  thumbnailUrl: string;
  fallbackUrl: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  optimized: boolean;
}

function hasDangerousExtension(filename: string): boolean {
  const lower = filename.toLowerCase().trim();
  return DANGEROUS_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function detectBinaryFormat(buffer: Buffer, mimeHint: string, originalName: string): {
  assetType: SupportedUploadAssetType | 'jpeg';
  ext: string;
  mimeType: string;
} | null {
  if (buffer.length < 8) return null;

  // PNG magic: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { assetType: 'png', ext: '.png', mimeType: 'image/png' };
  }

  // WebP magic: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { assetType: 'webp', ext: '.webp', mimeType: 'image/webp' };
  }

  // JPEG magic: FF D8 FF (convert/accept cleanly for static image optimization)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { assetType: 'jpeg', ext: '.jpg', mimeType: 'image/jpeg' };
  }

  // GIF magic: GIF87a or GIF89a
  const gifSig = buffer.subarray(0, 6).toString('ascii');
  if (gifSig === 'GIF87a' || gifSig === 'GIF89a') {
    return { assetType: 'gif', ext: '.gif', mimeType: 'image/gif' };
  }

  // WebM magic: 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { assetType: 'video', ext: '.webm', mimeType: 'video/webm' };
  }

  // MP4 magic: ....ftyp
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return { assetType: 'video', ext: '.mp4', mimeType: 'video/mp4' };
  }

  // WAV magic: RIFF....WAVE
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  ) {
    return { assetType: 'audio', ext: '.wav', mimeType: 'audio/wav' };
  }

  // OGG magic: OggS
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString('ascii') === 'OggS') {
    return { assetType: 'audio', ext: '.ogg', mimeType: 'audio/ogg' };
  }

  // MP3 magic: ID3 tag or MPEG audio sync frame (FF FB / FF F3 / FF F2)
  if (
    buffer.subarray(0, 3).toString('ascii') === 'ID3' ||
    (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2))
  ) {
    return { assetType: 'audio', ext: '.mp3', mimeType: 'audio/mpeg' };
  }

  // Lottie JSON check (must parse as JSON with "layers" Array + "v" or "fr")
  if (
    mimeHint.includes('json') ||
    originalName.toLowerCase().endsWith('.json') ||
    buffer.subarray(0, 64).toString('utf8').trimStart().startsWith('{')
  ) {
    try {
      const parsed = JSON.parse(buffer.toString('utf8'));
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.layers) &&
        (typeof parsed.fr === 'number' || typeof parsed.v === 'string')
      ) {
        return { assetType: 'lottie', ext: '.json', mimeType: 'application/json' };
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Validates and persists uploaded gift artwork or animation asset into public storage
 * (`public/uploads/gifts/{images,thumbnails,animations}`).
 */
export function validateAndStoreGiftAsset(params: {
  buffer: Buffer;
  originalName: string;
  mimeTypeHint?: string;
}): ValidatedGiftUploadResult {
  const { buffer, originalName, mimeTypeHint = '' } = params;

  if (!buffer || buffer.length === 0) {
    throw Object.assign(new Error('Uploaded gift asset file is empty.'), {
      code: 'EMPTY_FILE',
      status: 400,
    });
  }

  if (hasDangerousExtension(originalName)) {
    throw Object.assign(new Error('Prohibited or potentially unsafe file extension rejected.'), {
      code: 'PROHIBITED_EXTENSION',
      status: 400,
    });
  }

  const detected = detectBinaryFormat(buffer, mimeTypeHint.toLowerCase(), originalName);
  if (!detected) {
    throw Object.assign(
      new Error(
        'Unsupported or invalid asset format. Allowed formats: PNG, WebP, GIF, Lottie JSON (.json), MP4/WebM video, and WAV/MP3/OGG audio.'
      ),
      { code: 'INVALID_ASSET_FORMAT', status: 400 }
    );
  }

  const isAnimation = detected.assetType === 'gif' || detected.assetType === 'lottie' || detected.assetType === 'video';
  const isAudio = detected.assetType === 'audio';
  const maxBytes = isAudio ? MAX_AUDIO_BYTES : isAnimation ? MAX_ANIMATION_BYTES : MAX_STATIC_IMAGE_BYTES;
  if (buffer.length > maxBytes) {
    throw Object.assign(
      new Error(
        `Asset exceeds maximum allowed size (${Math.round(maxBytes / (1024 * 1024))} MB limit).`
      ),
      { code: 'FILE_TOO_LARGE', status: 400 }
    );
  }

  const baseUploadDir = path.join(process.cwd(), 'public', 'uploads', 'gifts');
  const folder = isAudio ? 'sfx' : isAnimation ? 'animations' : 'images';
  const targetDir = path.join(baseUploadDir, folder);
  const thumbDir = path.join(baseUploadDir, 'thumbnails');

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const idToken = `${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
  const storedFileName = `gift_${idToken}${detected.ext}`;
  const fullPath = path.join(targetDir, storedFileName);
  fs.writeFileSync(fullPath, buffer);

  const fileUrl = `/api/gifts/media/${folder}/${storedFileName}`;

  // Generate/persist thumbnail for static/GIF image assets; fallback companion thumbnail for vector/video assets
  let thumbnailUrl = FALLBACK_GIFT_THUMBNAIL_URL;
  if (detected.assetType === 'png' || detected.assetType === 'webp' || detected.assetType === 'jpeg' || detected.assetType === 'gif') {
    const thumbFileName = `thumb_${idToken}${detected.ext}`;
    fs.writeFileSync(path.join(thumbDir, thumbFileName), buffer);
    thumbnailUrl = `/api/gifts/media/thumbnails/${thumbFileName}`;
  }

  const normalizedType: SupportedUploadAssetType =
    detected.assetType === 'jpeg' ? 'png' : detected.assetType;

  return {
    assetType: normalizedType,
    fileUrl,
    thumbnailUrl,
    fallbackUrl: FALLBACK_GIFT_IMAGE_URL,
    fileName: storedFileName,
    mimeType: detected.mimeType,
    byteSize: buffer.length,
    optimized: buffer.length <= 2 * 1024 * 1024,
  };
}
