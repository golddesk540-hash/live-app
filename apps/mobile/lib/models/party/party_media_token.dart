/// Represents the Agora RTC Token Result for a Party Room
/// Endpoint: GET /api/party/{roomId}/seats/media/token
class PartyMediaToken {
  final bool isConfigured;
  final String appId;
  final String channelName;
  final int uid;
  final String? token;
  final String role; // 'publisher' | 'subscriber' | 'audience'
  final int expiresInSeconds;
  final String mode;
  final String message;

  const PartyMediaToken({
    required this.isConfigured,
    required this.appId,
    required this.channelName,
    required this.uid,
    this.token,
    required this.role,
    this.expiresInSeconds = 86400,
    required this.mode,
    required this.message,
  });

  factory PartyMediaToken.fromJson(Map<String, dynamic> json) {
    return PartyMediaToken(
      isConfigured: json['isConfigured'] == true,
      appId: json['appId']?.toString() ?? '',
      channelName: json['channelName']?.toString() ?? '',
      uid: (json['uid'] as num?)?.toInt() ?? 0,
      token: json['token']?.toString(),
      role: json['role']?.toString() ?? 'subscriber',
      expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 86400,
      mode: json['mode']?.toString() ?? 'local_webrtc_camera_preview',
      message: json['message']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'isConfigured': isConfigured,
    'appId': appId,
    'channelName': channelName,
    'uid': uid,
    'token': token,
    'role': role,
    'expiresInSeconds': expiresInSeconds,
    'mode': mode,
    'message': message,
  };
}
