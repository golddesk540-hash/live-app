/**
 * POPO LIVE — REAL STORAGE TYPES & CONSTANTS
 */

export type StorageBucket = 'popo-avatars' | 'popo-posters' | 'popo-chat-media' | 'popo-store-art';

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface StorageConfig {
  provider: 'r2' | 's3' | 'local';
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicCdnUrl?: string;
  endpoint?: string;
}

export interface UploadOptions {
  bucket: StorageBucket;
  userId: string;
  buffer: Buffer;
  mimeType: AllowedMimeType;
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
