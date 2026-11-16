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
  final String poppoId;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final int viewerCount;

  const PkParticipant({
    required this.id,
    required this.roomNumber,
    required this.nickname,
    required this.avatar,
    this.streamKey,
    this.score = 0,
    this.poppoId = '',
    this.country = 'Global',
    this.countryCode = 'WW',
    this.flagEmoji = '🌐',
    this.viewerCount = 0,
  });

  factory PkParticipant.fromJson(Map<String, dynamic> json) {
    return PkParticipant(
      id: json['id']?.toString() ?? '',
      roomNumber: json['roomNumber']?.toString() ?? json['room_number']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? 'Host',
      avatar: json['avatar']?.toString() ?? json['avatarUrl']?.toString() ?? '',
      streamKey: json['streamKey']?.toString() ?? json['stream_key']?.toString(),
      score: (json['score'] is num) ? (json['score'] as num).toInt() : 0,
      poppoId: json['poppoId']?.toString() ?? json['poppo_id']?.toString() ?? '',
      country: json['country']?.toString() ?? 'Global',
      countryCode: json['countryCode']?.toString() ?? json['country_code']?.toString() ?? 'WW',
      flagEmoji: json['flagEmoji']?.toString() ?? json['flag_emoji']?.toString() ?? '🌐',
      viewerCount: (json['viewerCount'] is num)
          ? (json['viewerCount'] as num).toInt()
          : (json['viewer_count'] is num)
              ? (json['viewer_count'] as num).toInt()
              : 0,
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
      'poppoId': poppoId,
      'country': country,
      'countryCode': countryCode,
      'flagEmoji': flagEmoji,
      'viewerCount': viewerCount,
    };
  }

  PkParticipant copyWith({
    int? score,
    int? viewerCount,
  }) {
    return PkParticipant(
      id: id,
      roomNumber: roomNumber,
      nickname: nickname,
      avatar: avatar,
      streamKey: streamKey,
      score: score ?? this.score,
      poppoId: poppoId,
      country: country,
      countryCode: countryCode,
      flagEmoji: flagEmoji,
      viewerCount: viewerCount ?? this.viewerCount,
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

/// Server-authoritative Battle Countdown Timer
class PkBattleTimer {
  final int durationSeconds;
  final int remainingSeconds;
  final int elapsedSeconds;
  final String formattedTime;
  final String status; // 'normal' | 'warning_60s' | 'warning_10s' | 'time_expired'
  final DateTime? serverTime;
  final DateTime? startedAt;
  final DateTime? expiresAt;

  const PkBattleTimer({
    required this.durationSeconds,
    required this.remainingSeconds,
    required this.elapsedSeconds,
    required this.formattedTime,
    required this.status,
    this.serverTime,
    this.startedAt,
    this.expiresAt,
  });

  factory PkBattleTimer.fromJson(Map<String, dynamic> json) {
    return PkBattleTimer(
      durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 300,
      remainingSeconds: (json['remainingSeconds'] as num?)?.toInt() ?? 300,
      elapsedSeconds: (json['elapsedSeconds'] as num?)?.toInt() ?? 0,
      formattedTime: json['formattedTime']?.toString() ?? '05:00',
      status: json['status']?.toString() ?? 'normal',
      serverTime: json['serverTime'] != null
          ? DateTime.tryParse(json['serverTime'].toString())
          : null,
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'].toString())
          : null,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'].toString())
          : null,
    );
  }

  bool get isWarning60 => status == 'warning_60s';
  bool get isWarning10 => status == 'warning_10s';
  bool get isExpired => remainingSeconds <= 0 || status == 'time_expired';
}

/// Single Real-time Point / Score Delta Event
class PkScoreEvent {
  final String id;
  final String battleId;
  final String hostSide; // 'host_a' | 'host_b'
  final String targetHostId;
  final String senderId;
  final String senderName;
  final int points;
  final String giftName;
  final String? idempotencyKey;
  final DateTime? createdAt;

  const PkScoreEvent({
    required this.id,
    required this.battleId,
    required this.hostSide,
    required this.targetHostId,
    required this.senderId,
    required this.senderName,
    required this.points,
    required this.giftName,
    this.idempotencyKey,
    this.createdAt,
  });

  factory PkScoreEvent.fromJson(Map<String, dynamic> json) {
    return PkScoreEvent(
      id: json['id']?.toString() ?? '',
      battleId: json['battleId']?.toString() ?? '',
      hostSide: json['hostSide']?.toString() ?? 'host_a',
      targetHostId: json['targetHostId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      senderName: json['senderName']?.toString() ?? '',
      points: (json['points'] as num?)?.toInt() ?? 0,
      giftName: json['giftName']?.toString() ?? 'Diamond Star',
      idempotencyKey: json['idempotencyKey']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

/// Authoritative Score and Timer State returned by GET /api/pk/battle/[battleId]/score-timer
class PkScoreTimerState {
  final String battleId;
  final String battleType;
  final String status;
  final PkParticipant hostA;
  final PkParticipant hostB;
  final PkBattleTimer timer;
  final String leadingSide; // 'host_a' | 'host_b' | 'tie'
  final String? leadingHostId;
  final double ratioA; // 15.0 to 85.0
  final double ratioB; // 15.0 to 85.0
  final List<PkScoreEvent> recentEvents;

  const PkScoreTimerState({
    required this.battleId,
    required this.battleType,
    required this.status,
    required this.hostA,
    required this.hostB,
    required this.timer,
    required this.leadingSide,
    this.leadingHostId,
    required this.ratioA,
    required this.ratioB,
    this.recentEvents = const [],
  });

  factory PkScoreTimerState.fromJson(Map<String, dynamic> json) {
    final hostAData = json['hostA'] as Map<String, dynamic>? ?? {};
    final hostBData = json['hostB'] as Map<String, dynamic>? ?? {};
    final timerData = json['timer'] as Map<String, dynamic>? ?? {};

    final rawEvents = json['recentEvents'] as List<dynamic>? ?? [];
    final events = rawEvents
        .map((e) => PkScoreEvent.fromJson(e as Map<String, dynamic>))
        .toList();

    return PkScoreTimerState(
      battleId: json['battleId']?.toString() ?? '',
      battleType: json['battleType']?.toString() ?? '1v1',
      status: json['status']?.toString() ?? 'active',
      hostA: PkParticipant.fromJson(hostAData),
      hostB: PkParticipant.fromJson(hostBData),
      timer: PkBattleTimer.fromJson(timerData),
      leadingSide: json['leadingSide']?.toString() ?? 'tie',
      leadingHostId: json['leadingHostId']?.toString(),
      ratioA: (json['ratioA'] as num?)?.toDouble() ?? 50.0,
      ratioB: (json['ratioB'] as num?)?.toDouble() ?? 50.0,
      recentEvents: events,
    );
  }

  bool isLeading(String hostId) => leadingHostId == hostId;
  bool isTie() => leadingSide == 'tie';
}

/// Final Battle Outcome & Winner Declaration returned by /api/pk/battle/[battleId]/result
class PkBattleResult {
  final String id;
  final String battleId;
  final String battleType;
  final String hostAId;
  final String hostANickname;
  final String hostAAvatar;
  final int hostAScore;
  final String hostBId;
  final String hostBNickname;
  final String hostBAvatar;
  final int hostBScore;
  final String resultType; // 'winner_declared' | 'draw' | 'cancelled'
  final String? winnerHostId;
  final String? winnerNickname;
  final String? winnerAvatar;
  final int? winnerScore;
  final String? loserHostId;
  final String? loserNickname;
  final String? loserAvatar;
  final int? loserScore;
  final int scoreDiff;
  final int durationSeconds;
  final DateTime? startedAt;
  final DateTime? endedAt;

  const PkBattleResult({
    required this.id,
    required this.battleId,
    required this.battleType,
    required this.hostAId,
    required this.hostANickname,
    required this.hostAAvatar,
    required this.hostAScore,
    required this.hostBId,
    required this.hostBNickname,
    required this.hostBAvatar,
    required this.hostBScore,
    required this.resultType,
    this.winnerHostId,
    this.winnerNickname,
    this.winnerAvatar,
    this.winnerScore,
    this.loserHostId,
    this.loserNickname,
    this.loserAvatar,
    this.loserScore,
    required this.scoreDiff,
    required this.durationSeconds,
    this.startedAt,
    this.endedAt,
  });

  factory PkBattleResult.fromJson(Map<String, dynamic> json) {
    return PkBattleResult(
      id: json['id']?.toString() ?? '',
      battleId: json['battleId']?.toString() ?? '',
      battleType: json['battleType']?.toString() ?? '1v1',
      hostAId: json['hostAId']?.toString() ?? '',
      hostANickname: json['hostANickname']?.toString() ?? 'Host A',
      hostAAvatar: json['hostAAvatar']?.toString() ?? '',
      hostAScore: (json['hostAScore'] as num?)?.toInt() ?? 0,
      hostBId: json['hostBId']?.toString() ?? '',
      hostBNickname: json['hostBNickname']?.toString() ?? 'Host B',
      hostBAvatar: json['hostBAvatar']?.toString() ?? '',
      hostBScore: (json['hostBScore'] as num?)?.toInt() ?? 0,
      resultType: json['resultType']?.toString() ?? 'winner_declared',
      winnerHostId: json['winnerHostId']?.toString(),
      winnerNickname: json['winnerNickname']?.toString(),
      winnerAvatar: json['winnerAvatar']?.toString(),
      winnerScore: (json['winnerScore'] as num?)?.toInt(),
      loserHostId: json['loserHostId']?.toString(),
      loserNickname: json['loserNickname']?.toString(),
      loserAvatar: json['loserAvatar']?.toString(),
      loserScore: (json['loserScore'] as num?)?.toInt(),
      scoreDiff: (json['scoreDiff'] as num?)?.toInt() ?? 0,
      durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 300,
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'].toString())
          : null,
      endedAt: json['endedAt'] != null
          ? DateTime.tryParse(json['endedAt'].toString())
          : null,
    );
  }

  bool isWinner(String hostId) => winnerHostId == hostId;
  bool isDraw() => resultType == 'draw';
}

/// Catalog gift available to send during 1v1 PK battle
class PkGiftItem {
  final String id;
  final String name;
  final String nameUr;
  final int coinPrice;
  final String currencyIcon;
  final String imageUrl;
  final String animationName;
  final String category;
  final int displayOrder;

  const PkGiftItem({
    required this.id,
    required this.name,
    required this.nameUr,
    required this.coinPrice,
    required this.currencyIcon,
    required this.imageUrl,
    required this.animationName,
    required this.category,
    required this.displayOrder,
  });

  factory PkGiftItem.fromJson(Map<String, dynamic> json) {
    return PkGiftItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Gift',
      nameUr: json['nameUr']?.toString() ?? json['name_ur']?.toString() ?? 'تحفہ',
      coinPrice: (json['coinPrice'] ?? json['coin_price'] as num?)?.toInt() ?? 10,
      currencyIcon: json['currencyIcon']?.toString() ?? json['currency_icon']?.toString() ?? '🪙',
      imageUrl: json['imageUrl']?.toString() ?? json['image_url']?.toString() ?? '',
      animationName: json['animationName']?.toString() ?? json['animation_name']?.toString() ?? 'banner_flash',
      category: json['category']?.toString() ?? 'popular',
      displayOrder: (json['displayOrder'] ?? json['display_order'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'nameUr': nameUr,
      'coinPrice': coinPrice,
      'currencyIcon': currencyIcon,
      'imageUrl': imageUrl,
      'animationName': animationName,
      'category': category,
      'displayOrder': displayOrder,
    };
  }

  /// 1 Coin = 1 PK Point (Backend authoritative conversion rate)
  int get pkScorePoints => coinPrice;
}

/// Record of an executed PK gift transaction
class PkGiftTransaction {
  final String transactionId;
  final String battleId;
  final String senderId;
  final String senderName;
  final String receiverId;
  final String receiverName;
  final String receiverSide; // 'host_a' | 'host_b'
  final String giftId;
  final String giftName;
  final int coinPrice;
  final int quantity;
  final int totalCoins;
  final int hostPoints;
  final int pkScoreAdded;
  final String status;
  final DateTime? createdAt;

  const PkGiftTransaction({
    required this.transactionId,
    required this.battleId,
    required this.senderId,
    required this.senderName,
    required this.receiverId,
    required this.receiverName,
    required this.receiverSide,
    required this.giftId,
    required this.giftName,
    required this.coinPrice,
    required this.quantity,
    required this.totalCoins,
    required this.hostPoints,
    required this.pkScoreAdded,
    required this.status,
    this.createdAt,
  });

  factory PkGiftTransaction.fromJson(Map<String, dynamic> json) {
    return PkGiftTransaction(
      transactionId: json['transactionId']?.toString() ?? json['transaction_id']?.toString() ?? '',
      battleId: json['battleId']?.toString() ?? json['battle_id']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? json['sender_id']?.toString() ?? '',
      senderName: json['senderName']?.toString() ?? json['sender_name']?.toString() ?? 'Viewer',
      receiverId: json['receiverId']?.toString() ?? json['receiver_id']?.toString() ?? '',
      receiverName: json['receiverName']?.toString() ?? json['receiver_name']?.toString() ?? 'Host',
      receiverSide: json['receiverSide']?.toString() ?? json['receiver_side']?.toString() ?? 'host_a',
      giftId: json['giftId']?.toString() ?? json['gift_id']?.toString() ?? '',
      giftName: json['giftName']?.toString() ?? json['gift_name']?.toString() ?? '',
      coinPrice: (json['coinPrice'] ?? json['coin_price'] as num?)?.toInt() ?? 0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      totalCoins: (json['totalCoins'] ?? json['total_coins'] as num?)?.toInt() ?? 0,
      hostPoints: (json['hostPoints'] ?? json['host_points'] as num?)?.toInt() ?? 0,
      pkScoreAdded: (json['pkScoreAdded'] ?? json['pk_score_added'] as num?)?.toInt() ?? 0,
      status: json['status']?.toString() ?? 'completed',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : (json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null),
    );
  }
}

/// User Coin/Diamond Balance from Wallet Engine
class PkUserWallet {
  final String userId;
  final int coins;
  final int diamondPoints;
  final int totalSpentCoins;
  final int totalReceivedPoints;

  const PkUserWallet({
    required this.userId,
    required this.coins,
    required this.diamondPoints,
    this.totalSpentCoins = 0,
    this.totalReceivedPoints = 0,
  });

  factory PkUserWallet.fromJson(Map<String, dynamic> json) {
    return PkUserWallet(
      userId: json['userId']?.toString() ?? json['user_id']?.toString() ?? '',
      coins: (json['coins'] as num?)?.toInt() ?? 0,
      diamondPoints: (json['diamondPoints'] ?? json['diamond_points'] as num?)?.toInt() ?? 0,
      totalSpentCoins: (json['totalSpentCoins'] ?? json['total_spent_coins'] as num?)?.toInt() ?? 0,
      totalReceivedPoints: (json['totalReceivedPoints'] ?? json['total_received_points'] as num?)?.toInt() ?? 0,
    );
  }

  PkUserWallet copyWith({
    String? userId,
    int? coins,
    int? diamondPoints,
    int? totalSpentCoins,
    int? totalReceivedPoints,
  }) {
    return PkUserWallet(
      userId: userId ?? this.userId,
      coins: coins ?? this.coins,
      diamondPoints: diamondPoints ?? this.diamondPoints,
      totalSpentCoins: totalSpentCoins ?? this.totalSpentCoins,
      totalReceivedPoints: totalReceivedPoints ?? this.totalReceivedPoints,
    );
  }
}

/// Floating real-time gift animation event
class PkGiftAnimationEvent {
  final String type; // e.g. 'crown_burst', 'rocket_launch', 'rose_cascade'
  final String targetSide; // 'host_a' | 'host_b'
  final String senderName;
  final String giftName;
  final int quantity;
  final int pointsAwarded;
  final String? imageUrl;

  const PkGiftAnimationEvent({
    required this.type,
    required this.targetSide,
    required this.senderName,
    required this.giftName,
    this.quantity = 1,
    required this.pointsAwarded,
    this.imageUrl,
  });
}

/// PK Battle Past History Record returned by GET /api/pk/history
class PkBattleHistory {
  final String battleId;
  final String opponentId;
  final String opponentName;
  final String opponentAvatar;
  final int myScore;
  final int opponentScore;
  final String outcome; // 'win' | 'loss' | 'draw'
  final String battleDate;
  final String durationFormatted;

  const PkBattleHistory({
    required this.battleId,
    required this.opponentId,
    required this.opponentName,
    required this.opponentAvatar,
    required this.myScore,
    required this.opponentScore,
    required this.outcome,
    required this.battleDate,
    required this.durationFormatted,
  });

  factory PkBattleHistory.fromJson(Map<String, dynamic> json) {
    return PkBattleHistory(
      battleId: json['battleId']?.toString() ?? '',
      opponentId: json['opponentId']?.toString() ?? '',
      opponentName: json['opponentName']?.toString() ?? 'Opponent',
      opponentAvatar: json['opponentAvatar']?.toString() ?? '',
      myScore: (json['myScore'] as num?)?.toInt() ?? 0,
      opponentScore: (json['opponentScore'] as num?)?.toInt() ?? 0,
      outcome: json['outcome']?.toString() ?? 'draw',
      battleDate: json['battleDate']?.toString() ?? '',
      durationFormatted: json['durationFormatted']?.toString() ?? '5m',
    );
  }
}


