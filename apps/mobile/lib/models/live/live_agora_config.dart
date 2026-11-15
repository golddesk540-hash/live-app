/// Live Streaming Agora RTC Configuration Model
/// Received securely from server via POST /api/live/studio/start or GET /api/live/viewer/session
class LiveAgoraConfig {
  final bool isConfigured;
  final String appId;
  final String token;
  final String channelName;
  final int uid;
  final int expireTimeInSeconds;
  final String mode;
  final String message;

  const LiveAgoraConfig({
    required this.isConfigured,
    required this.appId,
    required this.token,
    required this.channelName,
    required this.uid,
    required this.expireTimeInSeconds,
    required this.mode,
    required this.message,
  });

  /// True if Agora Cloud RTC credentials are fully active on backend
  bool get isAgoraCloudActive => isConfigured && mode == 'agora_cloud_rtc';

  /// True if backend operates in local WebRTC / device camera preview mode
  bool get isLocalPreviewMode => mode == 'local_webrtc_camera_preview';

  factory LiveAgoraConfig.fromJson(Map<String, dynamic> json) {
    return LiveAgoraConfig(
      isConfigured: json['isConfigured'] == true,
      appId: json['appId']?.toString() ?? '',
      token: json['token']?.toString() ?? '',
      channelName: json['channelName']?.toString() ?? '',
      uid: (json['uid'] as num?)?.toInt() ?? 0,
      expireTimeInSeconds:
          (json['expireTimeInSeconds'] as num?)?.toInt() ?? 86400,
      mode: json['mode']?.toString() ?? 'agora_cloud_rtc',
      message: json['message']?.toString() ?? '',
    );
  }

  factory LiveAgoraConfig.empty() {
    return const LiveAgoraConfig(
      isConfigured: false,
      appId: '',
      token: '',
      channelName: '',
      uid: 0,
      expireTimeInSeconds: 0,
      mode: 'uninitialized',
      message: 'No Agora session initialized',
    );
  }
}

/// Real-time live streaming connection lifecycle status
enum LiveConnectionStatus {
  idle,
  checkingPermissions,
  initializingEngine,
  connecting,
  connected,
  reconnecting,
  disconnected,
  error,
}

/// Client role in the live room
enum LiveStreamRole { host, viewer }
