import '../design/design_fixtures.dart';

/// Strongly typed models for Discovery Live Rooms and Broadcasters
class DiscoveryHost {
  final String id;
  final String poppoId;
  final String nickname;
  final String avatarUrl;
  final int hostLevel;
  final int wealthLevel;
  final bool isVerified;
  final String? gender;

  const DiscoveryHost({
    required this.id,
    required this.poppoId,
    required this.nickname,
    required this.avatarUrl,
    this.hostLevel = 1,
    this.wealthLevel = 1,
    this.isVerified = false,
    this.gender,
  });

  factory DiscoveryHost.fromJson(Map<String, dynamic> json) {
    return DiscoveryHost(
      id: json['id']?.toString() ?? '',
      poppoId:
          json['poppoId']?.toString() ?? (json['poppo_id']?.toString() ?? ''),
      nickname: json['nickname']?.toString() ?? 'Broadcaster',
      avatarUrl:
          json['avatarUrl']?.toString() ??
          (json['avatar_url']?.toString() ?? '/avatars/default.png'),
      hostLevel:
          int.tryParse(
            json['hostLevel']?.toString() ??
                (json['host_level']?.toString() ?? '1'),
          ) ??
          1,
      wealthLevel:
          int.tryParse(
            json['wealthLevel']?.toString() ??
                (json['wealth_level']?.toString() ?? '1'),
          ) ??
          1,
      isVerified:
          json['isVerified'] == true ||
          json['is_adult_verified'] == true ||
          (json['hostLevel'] != null &&
              (int.tryParse(json['hostLevel'].toString()) ?? 0) >= 5),
      gender: json['gender']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'poppoId': poppoId,
    'nickname': nickname,
    'avatarUrl': avatarUrl,
    'hostLevel': hostLevel,
    'wealthLevel': wealthLevel,
    'isVerified': isVerified,
    if (gender != null) 'gender': gender,
  };
}

class PkOpponent {
  final String id;
  final String nickname;
  final String avatarUrl;
  final String poppoId;

  const PkOpponent({
    required this.id,
    required this.nickname,
    required this.avatarUrl,
    required this.poppoId,
  });

  factory PkOpponent.fromJson(Map<String, dynamic> json) {
    return PkOpponent(
      id: json['id']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? 'Host',
      avatarUrl: json['avatarUrl']?.toString() ?? '/avatars/default.png',
      poppoId: json['poppoId']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'nickname': nickname,
    'avatarUrl': avatarUrl,
    'poppoId': poppoId,
  };
}

class PkBattleDetails {
  final String pkId;
  final String title;
  final String status;
  final int votesHost;
  final int votesOpponent;
  final String pointsHost;
  final String pointsOpponent;
  final PkOpponent? opponent;

  const PkBattleDetails({
    required this.pkId,
    required this.title,
    required this.status,
    this.votesHost = 0,
    this.votesOpponent = 0,
    this.pointsHost = '0',
    this.pointsOpponent = '0',
    this.opponent,
  });

  factory PkBattleDetails.fromJson(Map<String, dynamic> json) {
    return PkBattleDetails(
      pkId: json['pkId']?.toString() ?? (json['id']?.toString() ?? ''),
      title: json['title']?.toString() ?? 'PK Battle Arena',
      status: json['status']?.toString() ?? 'active',
      votesHost: int.tryParse(json['votesHost']?.toString() ?? '0') ?? 0,
      votesOpponent:
          int.tryParse(json['votesOpponent']?.toString() ?? '0') ?? 0,
      pointsHost: json['pointsHost']?.toString() ?? '0',
      pointsOpponent: json['pointsOpponent']?.toString() ?? '0',
      opponent: json['opponent'] is Map
          ? PkOpponent.fromJson(
              Map<String, dynamic>.from(json['opponent'] as Map),
            )
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'pkId': pkId,
    'title': title,
    'status': status,
    'votesHost': votesHost,
    'votesOpponent': votesOpponent,
    'pointsHost': pointsHost,
    'pointsOpponent': pointsOpponent,
    if (opponent != null) 'opponent': opponent!.toJson(),
  };
}

class DiscoveryRoom {
  final String id;
  final String roomId;
  final String roomNumber;
  final String title;
  final String coverUrl;
  final String category;
  final String status;
  final bool isLive;
  final bool isPk;
  final int viewerCount;
  final String viewersFormatted;
  final int coinsEarned;
  final String coinsFormatted;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final List<String> tags;
  final DiscoveryHost host;
  final PkBattleDetails? pkBattle;
  final bool isFollowing;

  const DiscoveryRoom({
    required this.id,
    required this.roomId,
    required this.roomNumber,
    required this.title,
    required this.coverUrl,
    required this.category,
    this.status = 'live',
    this.isLive = true,
    this.isPk = false,
    this.viewerCount = 0,
    required this.viewersFormatted,
    this.coinsEarned = 0,
    this.coinsFormatted = '0',
    this.country = 'Pakistan',
    this.countryCode = 'PK',
    this.flagEmoji = '🌐',
    this.tags = const [],
    required this.host,
    this.pkBattle,
    this.isFollowing = false,
  });

  factory DiscoveryRoom.fromJson(Map<String, dynamic> json) {
    final rawHost = json['host'] is Map ? json['host'] as Map : null;
    final fallbackHost = DiscoveryHost(
      id: json['hostId']?.toString() ?? '',
      poppoId: json['hostPoppoId']?.toString() ?? '',
      nickname: json['hostNickname']?.toString() ?? 'Broadcaster',
      avatarUrl: json['hostAvatarUrl']?.toString() ?? '/avatars/default.png',
      hostLevel: int.tryParse(json['hostLevel']?.toString() ?? '1') ?? 1,
      wealthLevel: int.tryParse(json['wealthLevel']?.toString() ?? '1') ?? 1,
    );

    final hostObj = rawHost != null
        ? DiscoveryHost.fromJson(Map<String, dynamic>.from(rawHost))
        : fallbackHost;

    final pkRaw = json['pkBattle'] ?? json['pkDetails'];
    final pkObj = pkRaw is Map
        ? PkBattleDetails.fromJson(Map<String, dynamic>.from(pkRaw))
        : null;

    final tagsList = json['tags'] is List
        ? (json['tags'] as List).map((e) => e.toString()).toList()
        : <String>[];

    final isPkFlag =
        json['isPk'] == true || json['category'] == 'pk' || pkObj != null;

    final id = json['id']?.toString() ?? '';
    final roomNumber =
        json['roomNumber']?.toString() ?? (json['roomId']?.toString() ?? id);
    final effectiveRoomId =
        json['roomId']?.toString() ?? (id.isNotEmpty ? id : roomNumber);

    return DiscoveryRoom(
      id: id,
      roomId: effectiveRoomId,
      roomNumber: roomNumber,
      title:
          json['title']?.toString() ??
          (json['roomTitle']?.toString() ?? 'Live Stream'),
      coverUrl:
          json['coverUrl']?.toString() ??
          (json['avatarUrl']?.toString() ?? '/avatars/default.png'),
      category: json['category']?.toString() ?? (isPkFlag ? 'pk' : 'live'),
      status: json['status']?.toString() ?? 'live',
      isLive: json['isLive'] != false,
      isPk: isPkFlag,
      viewerCount: int.tryParse(json['viewerCount']?.toString() ?? '0') ?? 0,
      viewersFormatted:
          json['viewersFormatted']?.toString() ??
          (json['viewerCount']?.toString() ?? '0'),
      coinsEarned: int.tryParse(json['coinsEarned']?.toString() ?? '0') ?? 0,
      coinsFormatted: json['coinsFormatted']?.toString() ?? '0',
      country: json['country']?.toString() ?? 'Pakistan',
      countryCode: json['countryCode']?.toString() ?? 'PK',
      flagEmoji: json['flagEmoji']?.toString() ?? '🌐',
      tags: tagsList,
      host: hostObj,
      pkBattle: pkObj,
      isFollowing: json['isFollowing'] == true,
    );
  }

  factory DiscoveryRoom.fromFixture(FixtureLiveRoom f) {
    return DiscoveryRoom(
      id: f.id,
      roomId: f.id,
      roomNumber: f.roomNumber,
      title: f.title,
      coverUrl: f.coverUrl,
      category: f.category,
      status: f.isLive ? 'live' : 'ended',
      isLive: f.isLive,
      isPk: f.isPkActive,
      viewerCount: f.viewerCount,
      viewersFormatted: f.viewerCount >= 1000
          ? '${(f.viewerCount / 1000).toStringAsFixed(1)}k'
          : f.viewerCount.toString(),
      coinsEarned: f.heatScore,
      coinsFormatted: '${f.heatScore}',
      country: f.country,
      countryCode: f.countryCode,
      flagEmoji: f.flagEmoji,
      tags: f.tags,
      host: DiscoveryHost(
        id: 'host_${f.id}',
        poppoId: f.roomNumber,
        nickname: f.hostNickname,
        avatarUrl: f.hostAvatar,
        hostLevel: 10,
        wealthLevel: 5,
        isVerified: true,
      ),
      isFollowing: false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomId': roomId,
    'roomNumber': roomNumber,
    'title': title,
    'coverUrl': coverUrl,
    'category': category,
    'status': status,
    'isLive': isLive,
    'isPk': isPk,
    'viewerCount': viewerCount,
    'viewersFormatted': viewersFormatted,
    'coinsEarned': coinsEarned,
    'coinsFormatted': coinsFormatted,
    'country': country,
    'countryCode': countryCode,
    'flagEmoji': flagEmoji,
    'tags': tags,
    'host': host.toJson(),
    if (pkBattle != null) 'pkBattle': pkBattle!.toJson(),
    'isFollowing': isFollowing,
  };
}

class PaginationMetadata {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasMore;

  const PaginationMetadata({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasMore,
  });

  factory PaginationMetadata.fromJson(Map<String, dynamic> json) {
    final page = int.tryParse(json['page']?.toString() ?? '1') ?? 1;
    final limit = int.tryParse(json['limit']?.toString() ?? '12') ?? 12;
    final total = int.tryParse(json['total']?.toString() ?? '0') ?? 0;
    final totalPages = int.tryParse(json['totalPages']?.toString() ?? '1') ?? 1;
    final hasMore = json['hasMore'] == true || page < totalPages;

    return PaginationMetadata(
      page: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
      hasMore: hasMore,
    );
  }
}
