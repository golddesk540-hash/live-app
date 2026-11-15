/// Strongly typed models for Discovery Rankings & Leaderboards
class RankingDoor {
  final String id;
  final String title;
  final String titleUrdu;
  final String icon;
  final String iconType;
  final String gradient;
  final String destination;
  final bool hasNotificationDot;
  final String description;
  final int order;

  const RankingDoor({
    required this.id,
    required this.title,
    required this.titleUrdu,
    required this.icon,
    required this.iconType,
    required this.gradient,
    required this.destination,
    this.hasNotificationDot = false,
    this.description = '',
    this.order = 1,
  });

  factory RankingDoor.fromJson(Map<String, dynamic> json) {
    return RankingDoor(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      titleUrdu: json['titleUrdu']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'trophy',
      iconType: json['iconType']?.toString() ?? 'rank',
      gradient: json['gradient']?.toString() ?? 'from-[#f59e0b] to-[#ea580c]',
      destination: json['destination']?.toString() ?? '/ranking',
      hasNotificationDot: json['hasNotificationDot'] == true,
      description: json['description']?.toString() ?? '',
      order: int.tryParse(json['order']?.toString() ?? '1') ?? 1,
    );
  }
}

class RankingUser {
  final int rank;
  final String id;
  final String poppoId;
  final String nickname;
  final String avatarUrl;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final int hostLevel;
  final int wealthLevel;
  final bool isVerified;
  final int score;
  final String scoreFormatted;
  final String profileUrl;

  const RankingUser({
    required this.rank,
    required this.id,
    required this.poppoId,
    required this.nickname,
    required this.avatarUrl,
    this.country = 'Pakistan',
    this.countryCode = 'PK',
    this.flagEmoji = '🇵🇰',
    this.hostLevel = 1,
    this.wealthLevel = 1,
    this.isVerified = false,
    this.score = 0,
    required this.scoreFormatted,
    this.profileUrl = '',
  });

  factory RankingUser.fromJson(Map<String, dynamic> json) {
    return RankingUser(
      rank: int.tryParse(json['rank']?.toString() ?? '0') ?? 0,
      id: json['id']?.toString() ?? '',
      poppoId: json['poppoId']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? 'Broadcaster',
      avatarUrl: json['avatarUrl']?.toString() ?? '/avatars/default.png',
      country: json['country']?.toString() ?? 'Pakistan',
      countryCode: json['countryCode']?.toString() ?? 'PK',
      flagEmoji: json['flagEmoji']?.toString() ?? '🌐',
      hostLevel: int.tryParse(json['hostLevel']?.toString() ?? '1') ?? 1,
      wealthLevel: int.tryParse(json['wealthLevel']?.toString() ?? '1') ?? 1,
      isVerified: json['isVerified'] == true,
      score: int.tryParse(json['score']?.toString() ?? '0') ?? 0,
      scoreFormatted:
          json['scoreFormatted']?.toString() ??
          (json['score']?.toString() ?? '0'),
      profileUrl: json['profileUrl']?.toString() ?? '',
    );
  }
}

class RankingPodium {
  final RankingUser? first;
  final RankingUser? second;
  final RankingUser? third;

  const RankingPodium({this.first, this.second, this.third});

  factory RankingPodium.fromJson(Map<String, dynamic> json) {
    return RankingPodium(
      first: json['first'] is Map
          ? RankingUser.fromJson(
              Map<String, dynamic>.from(json['first'] as Map),
            )
          : null,
      second: json['second'] is Map
          ? RankingUser.fromJson(
              Map<String, dynamic>.from(json['second'] as Map),
            )
          : null,
      third: json['third'] is Map
          ? RankingUser.fromJson(
              Map<String, dynamic>.from(json['third'] as Map),
            )
          : null,
    );
  }
}

class RankingsPreviewResult {
  final String category;
  final String period;
  final bool isComingSoon;
  final RankingPodium? podium;
  final List<RankingUser> rankings;

  const RankingsPreviewResult({
    required this.category,
    required this.period,
    this.isComingSoon = false,
    this.podium,
    this.rankings = const [],
  });

  factory RankingsPreviewResult.fromJson(Map<String, dynamic> json) {
    final podiumRaw = json['podium'] is Map
        ? RankingPodium.fromJson(
            Map<String, dynamic>.from(json['podium'] as Map),
          )
        : null;

    final rankList = json['rankings'] is List
        ? (json['rankings'] as List)
              .map(
                (e) =>
                    RankingUser.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList()
        : <RankingUser>[];

    return RankingsPreviewResult(
      category: json['category']?.toString() ?? 'host',
      period: json['period']?.toString() ?? 'monthly',
      isComingSoon: json['isComingSoon'] == true,
      podium: podiumRaw,
      rankings: rankList,
    );
  }
}
