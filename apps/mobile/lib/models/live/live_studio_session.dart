import 'live_agora_config.dart';

/// Live Room Session Details (Host Studio & Viewer Room)
class LiveRoomSession {
  final String id;
  final String roomNumber;
  final String title;
  final String category;
  final String? coverUrl;
  final String status;
  final bool isLive;
  final int viewerCount;
  final String viewerDisplay;
  final int coinsEarned;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final DateTime? startedAt;
  final bool isFollowing;
  final LiveHostInfo? host;
  final LiveAgoraConfig? agora;

  const LiveRoomSession({
    required this.id,
    required this.roomNumber,
    required this.title,
    required this.category,
    this.coverUrl,
    required this.status,
    required this.isLive,
    required this.viewerCount,
    required this.viewerDisplay,
    required this.coinsEarned,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    this.startedAt,
    this.isFollowing = false,
    this.host,
    this.agora,
  });

  factory LiveRoomSession.fromJson(Map<String, dynamic> json) {
    final room = json['room'] as Map<String, dynamic>? ?? json;
    final hostData = json['host'] as Map<String, dynamic>?;
    final agoraData = json['agora'] as Map<String, dynamic>?;

    final viewerCount = (room['viewerCount'] as num?)?.toInt() ?? 0;
    String display = room['viewerDisplay']?.toString() ?? '$viewerCount';
    if (viewerCount >= 1000 && room['viewerDisplay'] == null) {
      display = '${(viewerCount / 1000).toStringAsFixed(1)}K';
    }

    DateTime? started;
    if (room['startedAt'] != null) {
      started = DateTime.tryParse(room['startedAt'].toString());
    }

    return LiveRoomSession(
      id: room['id']?.toString() ?? '',
      roomNumber: room['roomNumber']?.toString() ?? '',
      title: room['title']?.toString() ?? 'Live Stream',
      category: room['category']?.toString() ?? 'Live Chat',
      coverUrl: room['coverUrl']?.toString(),
      status: room['status']?.toString() ?? 'live',
      isLive: room['isLive'] == true,
      viewerCount: viewerCount,
      viewerDisplay: display,
      coinsEarned: (room['coinsEarned'] as num?)?.toInt() ?? 0,
      country: room['country']?.toString() ?? 'Global',
      countryCode: room['countryCode']?.toString() ?? 'WW',
      flagEmoji: room['flagEmoji']?.toString() ?? '🌐',
      startedAt: started,
      isFollowing: room['isFollowing'] == true,
      host: hostData != null ? LiveHostInfo.fromJson(hostData) : null,
      agora: agoraData != null ? LiveAgoraConfig.fromJson(agoraData) : null,
    );
  }
}

/// Host details embedded inside live stream sessions
class LiveHostInfo {
  final String id;
  final String nickname;
  final String poppoId;
  final String? avatarUrl;
  final int hostLevel;
  final int wealthLevel;

  const LiveHostInfo({
    required this.id,
    required this.nickname,
    required this.poppoId,
    this.avatarUrl,
    required this.hostLevel,
    required this.wealthLevel,
  });

  factory LiveHostInfo.fromJson(Map<String, dynamic> json) {
    return LiveHostInfo(
      id: json['id']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? 'Host',
      poppoId: json['poppoId']?.toString() ?? '',
      avatarUrl: json['avatarUrl']?.toString(),
      hostLevel: (json['hostLevel'] as num?)?.toInt() ?? 1,
      wealthLevel: (json['wealthLevel'] as num?)?.toInt() ?? 1,
    );
  }
}
