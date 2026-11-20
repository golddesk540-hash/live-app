/**
 * POPO LIVE — FILE VALIDATOR & SECURITY SCANNER
 * 
 * Enforces server-side file inspection:
 * - Magic bytes verification (header sniffing)
 * - Maximum byte size enforcement
 * - Secure UUID-based file naming with path traversal rejection
 */

import crypto from 'crypto';
import { AllowedMimeType, StorageBucket, STORAGE_LIMITS } from './storageTypes';

export class FileValidator {
  /**
   * Sniffs magic bytes at the beginning of the buffer to determine true MIME type.
   */
  public static detectMimeType(buffer: Buffer): AllowedMimeType | null {
    if (!buffer || buffer.length < 12) return null;

    // 1. JPEG (FF D8 FF)
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // 2. PNG (89 50 4E 47 0D 0A 1A 0A)
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return 'image/png';
    }

    // 3. WebP (RIFF .... WEBP)
    if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50 // WEBP
    ) {
      return 'image/webp';
    }

    return null;
  }

  /**
   * Enforces file size limitations per bucket.
   */
  public static validateSize(buffer: Buffer, bucket: StorageBucket): void {
    const size = buffer.length;
    let limit = STORAGE_LIMITS.CHAT_MEDIA_MAX_BYTES;

    if (bucket === 'popo-avatars') limit = STORAGE_LIMITS.AVATAR_MAX_BYTES;
    if (bucket === 'popo-posters') limit = STORAGE_LIMITS.POSTER_MAX_BYTES;

    if (size > limit) {
      const err: any = new Error(`File size ${Math.round(size / 1024 / 1024 * 10) / 10}MB exceeds maximum allowed limit of ${Math.round(limit / 1024 / 1024)}MB.`);
      err.status = 400;
      err.code = 'FILE_TOO_LARGE';
      throw err;
    }
  }

  /**
   * Generates a collision-resistant, secure UUID key: {bucket}/{userId}/{uuid}.{ext}
   * Completely ignores original user filename to prevent path traversal and script injection.
   */
  public static generateSecureKey(bucket: StorageBucket, userId: string, mime: AllowedMimeType, attemptedFilename?: string): string {
    // Path traversal check on attempted filename
    if (attemptedFilename) {
      if (attemptedFilename.includes('..') || attemptedFilename.includes('/') || attemptedFilename.includes('\\')) {
        const err: any = new Error('Path traversal sequences in filename are strictly rejected.');
        err.status = 400;
        err.code = 'PATH_TRAVERSAL_DETECTED';
        throw err;
      }
    }

    // Clean user ID to only alphanumeric and dashes
    const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
    const uuid = crypto.randomUUID();

    let ext = 'jpg';
    if (mime === 'image/png') ext = 'png';
    if (mime === 'image/webp') ext = 'webp';

    return `${bucket}/${safeUserId}/${uuid}.${ext}`;
  }
}
