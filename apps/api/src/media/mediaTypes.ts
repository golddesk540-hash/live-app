/**
 * POPO LIVE — REAL LIVE STREAMING MEDIA TYPES & QUALITY PRESETS
 * 
 * Defines RTMP ingest, HLS playback, quality presets, and webhook events.
 */

export interface VideoQualityPreset {
  name: string;
  resolution: string;
  bitrateKbps: number;
  fps: number;
  codec: string;
  targetNetwork: string;
}

export const VIDEO_QUALITY_PRESETS: Record<string, VideoQualityPreset> = {
  FHD_1080P: {
    name: '1080p Full HD',
    resolution: '1920x1080',
    bitrateKbps: 4500,
    fps: 30,
    codec: 'h264',
    targetNetwork: 'Broadband / 5G',
  },
  HD_720P: {
    name: '720p HD (Default)',
    resolution: '1280x720',
    bitrateKbps: 2500,
    fps: 30,
    codec: 'h264',
    targetNetwork: '4G LTE / Stable WiFi',
  },
  SD_480P: {
    name: '480p SD (Data Saver)',
    resolution: '854x480',
    bitrateKbps: 1200,
    fps: 30,
    codec: 'h264',
    targetNetwork: '3G / Mobile Data',
  },
  LOW_360P: {
    name: '360p Low Bandwidth',
    resolution: '640x360',
    bitrateKbps: 600,
    fps: 15,
    codec: 'h264',
    targetNetwork: '2G / Weak Network',
  },
};

export interface RtmpIngestCredentials {
  ingestUrl: string;
  streamKey: string;
  fullRtmpUrl: string;
  expiresAt: string;
  serverRegion: string;
  supportedProtocols: string[];
}

export interface HlsPlaybackInfo {
  roomId: string;
  hlsUrl: string;
  signedHlsUrl: string;
  isLive: boolean;
  expiresAt: string;
  viewerCount: number;
  presets: VideoQualityPreset[];
  lowLatencySupported: boolean;
  watermark?: string;
}

export interface StreamStartRequest {
  roomId: string;
  hostId: string;
  qualityPreset?: string;
}

export interface StreamWebhookEvent {
  event: 'stream.started' | 'stream.ended' | 'stream.failed' | 'stream.viewer_update';
  streamKey: string;
  roomId: string;
  timestamp: string;
  details?: {
    viewerCount?: number;
    failureReason?: string;
    durationSeconds?: number;
    bytesIngested?: number;
  };
}
