import 'discovery_room.dart';

/// Strongly typed models for Search Results
class SearchUser {
  final String id;
  final String poppoId;
  final String nickname;
  final String avatarUrl;
  final int hostLevel;
  final int wealthLevel;
  final bool isLive;
  final String? liveRoomId;
  final int followersCount;
  final String profileUrl;

  const SearchUser({
    required this.id,
    required this.poppoId,
    required this.nickname,
    required this.avatarUrl,
    this.hostLevel = 1,
    this.wealthLevel = 1,
    this.isLive = false,
    this.liveRoomId,
    this.followersCount = 0,
    this.profileUrl = '',
  });

  factory SearchUser.fromJson(Map<String, dynamic> json) {
    return SearchUser(
      id: json['id']?.toString() ?? '',
      poppoId: json['poppoId']?.toString() ?? '',
      nickname: json['nickname']?.toString() ?? 'User',
      avatarUrl: json['avatarUrl']?.toString() ?? '/avatars/default.png',
      hostLevel: int.tryParse(json['hostLevel']?.toString() ?? '1') ?? 1,
      wealthLevel: int.tryParse(json['wealthLevel']?.toString() ?? '1') ?? 1,
      isLive: json['isLive'] == true,
      liveRoomId: json['liveRoomId']?.toString(),
      followersCount:
          int.tryParse(json['followersCount']?.toString() ?? '0') ?? 0,
      profileUrl: json['profileUrl']?.toString() ?? '',
    );
  }
}

class SearchResultData {
  final String query;
  final int totalCount;
  final List<SearchUser> users;
  final List<DiscoveryRoom> rooms;

  const SearchResultData({
    required this.query,
    this.totalCount = 0,
    this.users = const [],
    this.rooms = const [],
  });

  factory SearchResultData.fromJson(Map<String, dynamic> json) {
    final counts = json['counts'] is Map ? json['counts'] as Map : {};
    final results = json['results'] is Map ? json['results'] as Map : {};

    final usersList = results['users'] is List
        ? (results['users'] as List)
              .map(
                (u) => SearchUser.fromJson(Map<String, dynamic>.from(u as Map)),
              )
              .toList()
        : <SearchUser>[];

    final roomsList = results['rooms'] is List
        ? (results['rooms'] as List)
              .map(
                (r) =>
                    DiscoveryRoom.fromJson(Map<String, dynamic>.from(r as Map)),
              )
              .toList()
        : <DiscoveryRoom>[];

    final total =
        int.tryParse(counts['total']?.toString() ?? '0') ??
        (usersList.length + roomsList.length);

    return SearchResultData(
      query: json['query']?.toString() ?? '',
      totalCount: total,
      users: usersList,
      rooms: roomsList,
    );
  }
}
