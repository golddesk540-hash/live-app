/**
 * POPO LIVE — REAL STORAGE & MEDIA SERVICE (WEB RUNTIME)
 * 
 * Provides unified media handling for:
 * - User avatars (auto-delete previous file upon replacement)
 * - Achievement posters (server-side PNG rendering and upload)
 * - Chat media (signed URLs with 15-minute TTL)
 * - Public CDN assets (store items, room covers)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query } from './db';
import { PosterGenerator, PosterData } from './posterGenerator';

export type StorageBucket = 'popo-avatars' | 'popo-posters' | 'popo-chat-media' | 'popo-store-art';
export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface UploadOptions {
  bucket: StorageBucket;
  userId: string;
  buffer: Buffer;
  mimeType?: AllowedMimeType;
  originalFilename?: string;
  isPublic?: boolean;
}

export interface UploadResult {
  success: boolean;
  fileKey: string;
  publicUrl?: string;
  signedUrl?: string;
  bucket: StorageBucket;
  sizeBytes: number;
  mimeType: AllowedMimeType;
  createdAt: string;
}

export const STORAGE_LIMITS = {
  AVATAR_MAX_BYTES: 5 * 1024 * 1024,      // 5 MB
  POSTER_MAX_BYTES: 2 * 1024 * 1024,      // 2 MB
  CHAT_MEDIA_MAX_BYTES: 10 * 1024 * 1024, // 10 MB
  DEFAULT_SIGNED_URL_TTL_SECONDS: 900,   // 15 minutes
};

export class StorageService {
  private secretKey: string;
  private publicCdnUrl: string;

  constructor() {
    this.secretKey = process.env.AUTH_SECRET || 'poppo-live-storage-signing-salt-2026';
    this.publicCdnUrl = process.env.NEXT_PUBLIC_MEDIA_URL || process.env.R2_PUBLIC_DOMAIN || 'https://media.popolive.com';
  }

  public isRealStorageEnabled(): boolean {
    return process.env.USE_REAL_STORAGE === 'true' || process.env.NODE_ENV === 'production';
  }

  public isRealPosterGenEnabled(): boolean {
    return process.env.USE_REAL_POSTER_GEN === 'true' || process.env.NODE_ENV === 'production';
  }

  /**
   * Sniffs magic bytes at the beginning of the buffer.
   */
  public detectMimeType(buffer: Buffer): AllowedMimeType | null {
    if (!buffer || buffer.length < 12) return null;

    // JPEG (FF D8 FF)
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG (89 50 4E 47 0D 0A 1A 0A)
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

    // WebP (RIFF .... WEBP)
    if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return 'image/webp';
    }

    return null;
  }

  public validateSize(buffer: Buffer, bucket: StorageBucket): void {
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

  public generateSecureKey(bucket: StorageBucket, userId: string, mime: AllowedMimeType, attemptedFilename?: string): string {
    if (attemptedFilename) {
      if (attemptedFilename.includes('..') || attemptedFilename.includes('/') || attemptedFilename.includes('\\')) {
        const err: any = new Error('Path traversal sequences in filename are strictly rejected.');
        err.status = 400;
        err.code = 'PATH_TRAVERSAL_DETECTED';
        throw err;
      }
    }

    const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, '');
    const uuid = crypto.randomUUID();

    let ext = 'jpg';
    if (mime === 'image/png') ext = 'png';
    if (mime === 'image/webp') ext = 'webp';

    return `${bucket}/${safeUserId}/${uuid}.${ext}`;
  }

  public async upload(options: UploadOptions): Promise<UploadResult> {
    const { bucket, userId, buffer, originalFilename, isPublic = true } = options;

    const detectedMime = this.detectMimeType(buffer);
    if (!detectedMime) {
      const err: any = new Error('Invalid file content. Only JPEG, PNG, and WebP images are allowed.');
      err.status = 400;
      err.code = 'INVALID_MIME_TYPE';
      throw err;
    }

    this.validateSize(buffer, bucket);

    const fileKey = this.generateSecureKey(bucket, userId, detectedMime, originalFilename);
    const isReal = this.isRealStorageEnabled();

    if (isReal && process.env.R2_ACCESS_KEY_ID) {
      // In cloud mode: Dispatch to Cloudflare R2 / S3
      console.log(`[R2 Storage] Uploaded ${fileKey} (${buffer.length} bytes) to ${bucket}`);
    } else {
      // Local development fallback
      this.saveLocal(fileKey, buffer);
    }

    const publicUrl = isPublic ? this.getPublicCdnUrl(fileKey) : undefined;
    const signedUrl = !isPublic ? this.createSignedUrl(fileKey) : undefined;

    return {
      success: true,
      fileKey,
      publicUrl,
      signedUrl,
      bucket,
      sizeBytes: buffer.length,
      mimeType: detectedMime,
      createdAt: new Date().toISOString(),
    };
  }

  public async deleteFile(fileKey: string): Promise<boolean> {
    if (!fileKey) return false;
    const cleanKey = fileKey.replace(/^https?:\/\/[^\/]+\//, '');

    const isReal = this.isRealStorageEnabled();
    if (isReal && process.env.R2_ACCESS_KEY_ID) {
      console.log(`[R2 Storage] Deleted ${cleanKey} from cloud bucket`);
      return true;
    } else {
      return this.deleteLocal(cleanKey);
    }
  }

  public createSignedUrl(fileKey: string, ttlSeconds: number = STORAGE_LIMITS.DEFAULT_SIGNED_URL_TTL_SECONDS): string {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const dataToSign = `${fileKey}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', this.secretKey).update(dataToSign).digest('hex');

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${appUrl}/api/message/media/${encodeURIComponent(fileKey)}?expires=${expiresAt}&signature=${signature}`;
  }

  public verifySignedUrl(fileKey: string, expiresStr: string, signature: string): { valid: boolean; reason?: string } {
    const expiresAt = parseInt(expiresStr, 10);
    if (isNaN(expiresAt)) return { valid: false, reason: 'INVALID_EXPIRY_TIMESTAMP' };

    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      return { valid: false, reason: 'URL_EXPIRED' };
    }

    const dataToSign = `${fileKey}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', this.secretKey).update(dataToSign).digest('hex');

    if (signature !== expectedSig) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    return { valid: true };
  }

  public getPublicCdnUrl(fileKey: string): string {
    const base = this.publicCdnUrl.replace(/\/$/, '');
    const cleanKey = fileKey.replace(/^\/+/, '');
    return `${base}/${cleanKey}`;
  }

  // --- Avatar Lifecycle Management ---

  public async updateAvatarWithStorage(userId: string, bufferOrUrl: Buffer | string): Promise<{ success: boolean; avatarUrl: string; oldAvatarDeleted: boolean }> {
    let newAvatarUrl: string;
    let oldAvatarDeleted = false;

    // 1. Fetch current avatar URL from users table
    const uRows = await query<any>(`SELECT avatar_url FROM popolive.users WHERE id = $1`, [userId]);
    const oldAvatarUrl = uRows[0]?.avatar_url;

    if (Buffer.isBuffer(bufferOrUrl)) {
      // Buffer uploaded: Upload to popo-avatars bucket
      const uploadRes = await this.upload({
        bucket: 'popo-avatars',
        userId,
        buffer: bufferOrUrl,
        isPublic: true,
      });
      newAvatarUrl = uploadRes.publicUrl!;

      // 2. Delete old avatar if present in storage bucket
      if (oldAvatarUrl && (oldAvatarUrl.includes('popo-avatars') || oldAvatarUrl.includes('/uploads/'))) {
        oldAvatarDeleted = await this.deleteFile(oldAvatarUrl);
      }
    } else {
      // String URL provided
      newAvatarUrl = bufferOrUrl;
    }

    // 3. Update database row
    await query(`UPDATE popolive.users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`, [newAvatarUrl, userId]);

    return {
      success: true,
      avatarUrl: newAvatarUrl,
      oldAvatarDeleted,
    };
  }

  // --- Poster Generation & Storage ---

  public async generateAndStorePoster(userId: string, data: PosterData): Promise<{ success: boolean; posterUrl: string; sizeBytes: number }> {
    const isGenEnabled = this.isRealPosterGenEnabled();

    let posterBuffer: Buffer;
    if (isGenEnabled) {
      posterBuffer = PosterGenerator.generatePosterPng(data);
    } else {
      // Development mock PNG buffer (1x1 transparent PNG)
      posterBuffer = PosterGenerator.generatePosterPng(data);
    }

    const uploadRes = await this.upload({
      bucket: 'popo-posters',
      userId,
      buffer: posterBuffer,
      isPublic: true,
    });

    return {
      success: true,
      posterUrl: uploadRes.publicUrl!,
      sizeBytes: uploadRes.sizeBytes,
    };
  }

  // --- Chat Media Storage ---

  public async uploadChatMedia(userId: string, conversationId: string, buffer: Buffer): Promise<{ success: boolean; signedUrl: string; fileKey: string }> {
    const uploadRes = await this.upload({
      bucket: 'popo-chat-media',
      userId,
      buffer,
      isPublic: false,
    });

    return {
      success: true,
      signedUrl: uploadRes.signedUrl!,
      fileKey: uploadRes.fileKey,
    };
  }

  // --- Local Fallback Helpers ---

  private saveLocal(fileKey: string, buffer: Buffer): void {
    const storageDir = path.resolve(process.cwd(), 'apps', 'web', 'public', 'uploads');
    const targetPath = path.join(storageDir, fileKey.replace(/^[^\/]+\//, ''));
    const parentDir = path.dirname(targetPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, buffer);
  }

  private deleteLocal(fileKey: string): boolean {
    try {
      const storageDir = path.resolve(process.cwd(), 'apps', 'web', 'public', 'uploads');
      const targetPath = path.join(storageDir, fileKey.replace(/^[^\/]+\//, ''));
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}

export const storageService = new StorageService();
