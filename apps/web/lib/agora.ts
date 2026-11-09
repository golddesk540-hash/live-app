import { RtcTokenBuilder, RtcRole } from 'agora-token';

const AGORA_APP_ID = process.env.AGORA_APP_ID || '';
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

export interface AgoraTokenResult {
  isConfigured: boolean;
  appId: string;
  channelName: string;
  uid: number;
  token: string | null;
  role: 'publisher' | 'subscriber';
  expiresInSeconds: number;
  mode: 'agora_cloud_rtc' | 'local_webrtc_camera_preview';
  message: string;
}

/**
 * Secure Server-side Agora Token Generator
 * Ensures that AGORA_APP_CERTIFICATE is NEVER exposed to the frontend.
 */
export function generateHostRtcToken(
  channelName: string,
  uid: number,
  expireTimeInSeconds = 3600 * 24 // 24 hours validity
): AgoraTokenResult {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

  if (AGORA_APP_ID && AGORA_APP_CERTIFICATE) {
    // Generate valid cryptographically signed RTC token
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return {
      isConfigured: true,
      appId: AGORA_APP_ID,
      channelName,
      uid,
      token,
      role: 'publisher',
      expiresInSeconds: expireTimeInSeconds,
      mode: 'agora_cloud_rtc',
      message: 'Secure Agora RTC token generated successfully.',
    };
  }

  // Staging / Dev fallback when credentials are not yet configured in production env
  return {
    isConfigured: false,
    appId: AGORA_APP_ID || 'agora_dev_appid_pending',
    channelName,
    uid,
    token: `rtc_token_preview_${channelName}_${uid}`,
    role: 'publisher',
    expiresInSeconds: expireTimeInSeconds,
    mode: 'local_webrtc_camera_preview',
    message: 'Agora App ID or Certificate not configured. Operating in local WebRTC high-definition camera mode.',
  };
}

/**
 * Secure Server-side Agora Audience/Viewer Token Generator
 * Ensures viewer joins exclusively as SUBSCRIBER (audience), NEVER as host/publisher.
 * AGORA_APP_CERTIFICATE is NEVER exposed to the frontend.
 */
export function generateViewerRtcToken(
  channelName: string,
  uid: number,
  expireTimeInSeconds = 3600 * 24 // 24 hours validity
): AgoraTokenResult {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireTimeInSeconds;

  if (AGORA_APP_ID && AGORA_APP_CERTIFICATE) {
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.SUBSCRIBER, // Audience role only
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return {
      isConfigured: true,
      appId: AGORA_APP_ID,
      channelName,
      uid,
      token,
      role: 'subscriber',
      expiresInSeconds: expireTimeInSeconds,
      mode: 'agora_cloud_rtc',
      message: 'Secure Agora Audience RTC token generated successfully.',
    };
  }

  // Staging / Dev fallback when credentials are not yet configured
  return {
    isConfigured: false,
    appId: AGORA_APP_ID || 'agora_dev_appid_pending',
    channelName,
    uid,
    token: `rtc_token_viewer_${channelName}_${uid}`,
    role: 'subscriber',
    expiresInSeconds: expireTimeInSeconds,
    mode: 'local_webrtc_camera_preview',
    message: 'Agora App ID or Certificate not configured. Operating in local WebRTC stream viewer mode.',
  };
}
