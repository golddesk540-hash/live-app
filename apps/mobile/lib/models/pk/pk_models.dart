/// PK Battle Data Models for Popo Live Phase 3
/// Integrates with Next.js PK API endpoints:
/// - GET  /api/pk/hosts
/// - GET  /api/pk/battle-types
/// - POST /api/pk/invitation/send
/// - POST /api/pk/invitation/respond
/// - GET  /api/pk/invitation/status
/// - POST /api/pk/invitation/cancel
/// - GET  /api/pk/battle/[battleId]
library pk_models;

/// Live Host eligible for 1v1 PK Battle
class PkHost {
  final String id;
  final String poppoId;
  final String nickname;
  final String avatarUrl;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final String roomNumber;
  final int viewerCount;
  final bool isLive;
  final bool inPkBattle;
  final bool pkInvitesEnabled;
  final bool isOnline;
  final bool isEligibleForPk;

  const PkHost({
    required this.id,
    required this.poppoId,
    required this.nickname,
    required this.avatarUrl,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    required this.roomNumber,
    required this.viewerCount,
    required this.isLive,
    required this.inPkBattle,
    required this.pkInvitesEnabled,
    required this.isOnline,
    required this.isEligibleForPk,
  });

  factory PkHost.fromJson(Map<String, dynamic> json) {
    return PkHost(
      id: json['id']?.toString() ?? '',
      poppoId: json['poppoId']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? 'Host',
      avatarUrl: json['avatarUrl']?.toString() ?? '',
      country: json['country']?.toString() ?? 'Pakistan',
      countryCode: json['countryCode']?.toString() ?? 'PK',
      flagEmoji: json['flagEmoji']?.toString() ?? '🇵🇰',
      roomNumber: json['roomNumber']?.toString() ?? '',
      viewerCount: (json['viewerCount'] is num) ? (json['viewerCount'] as num).toInt() : 0,
      isLive: json['isLive'] == true,
      inPkBattle: json['inPkBattle'] == true,
      pkInvitesEnabled: json['pkInvitesEnabled'] != false,
      isOnline: json['isOnline'] != false,
      isEligibleForPk: json['isEligibleForPk'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'poppoId': poppoId,
      'nickname': nickname,
      'avatarUrl': avatarUrl,
      'country': country,
      'countryCode': countryCode,
      'flagEmoji': flagEmoji,
      'roomNumber': roomNumber,
      'viewerCount': viewerCount,
      'isLive': isLive,
      'inPkBattle': inPkBattle,
      'pkInvitesEnabled': pkInvitesEnabled,
      'isOnline': isOnline,
      'isEligibleForPk': isEligibleForPk,
    };
  }

  /// Formatted viewer count (e.g. 1.2K, 35K)
  String get formattedViewers {
    if (viewerCount >= 1000000) {
      return '${(viewerCount / 1000000).toStringAsFixed(1)}M';
    } else if (viewerCount >= 1000) {
      return '${(viewerCount / 1000).toStringAsFixed(1)}K';
    }
    return viewerCount.toString();
  }
}

/// PK Battle Mode descriptor (1v1 is active; 4-host remains locked)
class PkBattleType {
  final String id;
  final String name;
  final String nameUr;
  final String description;
  final String descriptionUr;
  final int maxHosts;
  final bool isEnabled;
  final bool isLocked;
  final String badgeText;

  const PkBattleType({
    required this.id,
    required this.name,
    required this.nameUr,
    required this.description,
    required this.descriptionUr,
    required this.maxHosts,
    required this.isEnabled,
    required this.isLocked,
    required this.badgeText,
  });

  factory PkBattleType.fromJson(Map<String, dynamic> json) {
    return PkBattleType(
      id: json['id']?.toString() ?? '1v1',
      name: json['name']?.toString() ?? '1 vs 1',
      nameUr: json['nameUr']?.toString() ?? '1 بمقابلہ 1',
      description: json['description']?.toString() ?? '',
      descriptionUr: json['descriptionUr']?.toString() ?? '',
      maxHosts: (json['maxHosts'] is num) ? (json['maxHosts'] as num).toInt() : 2,
      isEnabled: json['isEnabled'] == true,
      isLocked: json['isLocked'] == true,
      badgeText: json['badgeText']?.toString() ?? '',
    );
  }

  /// True if strictly 1v1 mode
  bool get isOneVsOne => id == '1v1' && maxHosts == 2;
}

/// PK Invitation state model
class PkInvitation {
  final String id;
  final String senderHostId;
  final String senderRoomNumber;
  final String senderNickname;
  final String senderAvatar;
  final String receiverHostId;
  final String receiverRoomNumber;
  final String receiverNickname;
  final String receiverAvatar;
  final String battleType;
  final String status; // 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  final String? rejectionReason;
  final int secondsRemaining;
  final DateTime? expiresAt;
  final DateTime? createdAt;

  const PkInvitation({
    required this.id,
    required this.senderHostId,
    required this.senderRoomNumber,
    required this.senderNickname,
    required this.senderAvatar,
    required this.receiverHostId,
    required this.receiverRoomNumber,
    required this.receiverNickname,
    required this.receiverAvatar,
    required this.battleType,
    required this.status,
    this.rejectionReason,
    required this.secondsRemaining,
    this.expiresAt,
    this.createdAt,
  });

  factory PkInvitation.fromJson(Map<String, dynamic> json) {
    return PkInvitation(
      id: json['id']?.toString() ?? '',
      senderHostId: json['senderHostId']?.toString() ?? json['sender_host_id']?.toString() ?? '',
      senderRoomNumber: json['senderRoomNumber']?.toString() ?? json['sender_room_number']?.toString() ?? '',
      senderNickname: json['senderNickname']?.toString() ?? json['sender_nickname']?.toString() ?? 'Host A',
      senderAvatar: json['senderAvatar']?.toString() ?? json['sender_avatar']?.toString() ?? '',
      receiverHostId: json['receiverHostId']?.toString() ?? json['receiver_host_id']?.toString() ?? '',
      receiverRoomNumber: json['receiverRoomNumber']?.toString() ?? json['receiver_room_number']?.toString() ?? '',
      receiverNickname: json['receiverNickname']?.toString() ?? json['receiver_nickname']?.toString() ?? 'Host B',
      receiverAvatar: json['receiverAvatar']?.toString() ?? json['receiver_avatar']?.toString() ?? '',
      battleType: json['battleType']?.toString() ?? json['battle_type']?.toString() ?? '1v1',
      status: json['status']?.toString() ?? 'pending',
      rejectionReason: json['rejectionReason']?.toString() ?? json['rejection_reason']?.toString(),
      secondsRemaining: (json['secondsRemaining'] is num) ? (json['secondsRemaining'] as num).toInt() : 30,
      expiresAt: json['expiresAt'] != null ? DateTime.tryParse(json['expiresAt'].toString()) : null,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
    );
  }

  bool get isPending => status == 'pending';
  bool get isAccepted => status == 'accepted';
  bool get isRejected => status == 'rejected';
  bool get isExpired => status == 'expired';
  bool get isCancelled => status == 'cancelled';
}

/// Participant details in confirmed PK Battle
class PkParticipant {
  final String id;
  final String roomNumber;
  final String nickname;
  final String avatar;
  final String? streamKey;
  final int score;

  const PkParticipant({
    required this.id,
    required this.roomNumber,
    required this.nickname,
    required this.avatar,
    this.streamKey,
    this.score = 0,
  });

  factory PkParticipant.fromJson(Map<String, dynamic> json) {
    return PkParticipant(
      id: json['id']?.toString() ?? '',
      roomNumber: json['roomNumber']?.toString() ?? json['room_number']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? 'Host',
      avatar: json['avatar']?.toString() ?? json['avatarUrl']?.toString() ?? '',
      streamKey: json['streamKey']?.toString() ?? json['stream_key']?.toString(),
      score: (json['score'] is num) ? (json['score'] as num).toInt() : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'roomNumber': roomNumber,
      'nickname': nickname,
      'avatar': avatar,
      'streamKey': streamKey,
      'score': score,
    };
  }

  PkParticipant copyWith({int? score}) {
    return PkParticipant(
      id: id,
      roomNumber: roomNumber,
      nickname: nickname,
      avatar: avatar,
      streamKey: streamKey,
      score: score ?? this.score,
    );
  }
}

/// Active PK Battle Session
class PkBattle {
  final String id;
  final String battleType;
  final String matchMethod;
  final String status; // 'confirmed' | 'preparing' | 'active' | 'ended'
  final PkParticipant hostA;
  final PkParticipant hostB;
  final DateTime? createdAt;
  final DateTime? startedAt;
  final DateTime? endedAt;

  const PkBattle({
    required this.id,
    required this.battleType,
    required this.matchMethod,
    required this.status,
    required this.hostA,
    required this.hostB,
    this.createdAt,
    this.startedAt,
    this.endedAt,
  });

  factory PkBattle.fromJson(Map<String, dynamic> json) {
    final hostAData = json['hostA'] is Map ? json['hostA'] as Map<String, dynamic> : {
      'id': json['hostAId'] ?? json['host_a_id'] ?? '',
      'roomNumber': json['hostARoom'] ?? json['host_a_room'] ?? '',
      'nickname': json['hostANickname'] ?? json['host_a_nickname'] ?? 'Host A',
      'avatar': json['hostAAvatar'] ?? json['host_a_avatar'] ?? '',
    };

    final hostBData = json['hostB'] is Map ? json['hostB'] as Map<String, dynamic> : {
      'id': json['hostBId'] ?? json['host_b_id'] ?? '',
      'roomNumber': json['hostBRoom'] ?? json['host_b_room'] ?? '',
      'nickname': json['hostBNickname'] ?? json['host_b_nickname'] ?? 'Host B',
      'avatar': json['hostBAvatar'] ?? json['host_b_avatar'] ?? '',
    };

    return PkBattle(
      id: json['id']?.toString() ?? '',
      battleType: json['battleType']?.toString() ?? json['battle_type']?.toString() ?? '1v1',
      matchMethod: json['matchMethod']?.toString() ?? json['match_method']?.toString() ?? 'invite',
      status: json['status']?.toString() ?? 'confirmed',
      hostA: PkParticipant.fromJson(hostAData),
      hostB: PkParticipant.fromJson(hostBData),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      startedAt: json['startedAt'] != null ? DateTime.tryParse(json['startedAt'].toString()) : null,
      endedAt: json['endedAt'] != null ? DateTime.tryParse(json['endedAt'].toString()) : null,
    );
  }

  /// Whether current host is Host A
  bool isHostA(String currentHostId) => hostA.id == currentHostId;

  /// Returns opponent participant relative to current host
  PkParticipant getOpponent(String currentHostId) {
    return isHostA(currentHostId) ? hostB : hostA;
  }

  /// Returns local participant relative to current host
  PkParticipant getLocal(String currentHostId) {
    return isHostA(currentHostId) ? hostA : hostB;
  }
}

/// Active Broadcaster Session Context for PK Setup
class LiveBroadcasterSession {
  final String hostId;
  final String roomNumber;
  final String hostNickname;
  final String hostAvatar;
  final String category;

  const LiveBroadcasterSession({
    required this.hostId,
    required this.roomNumber,
    required this.hostNickname,
    this.hostAvatar = '',
    this.category = 'Live Chat',
  });
}

