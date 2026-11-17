/// Strongly typed model for Multi-Seat Party Rooms
/// Corresponds to backend endpoints:
/// - GET /api/discovery/party
/// - GET /api/party/{roomId}
class PartyRoom {
  final String id;
  final String roomNumber;
  final String title;
  final String? collageUrl;
  final int currentMembers;
  final int maxMembers;
  final String seatCountFormatted;
  final bool isLive;
  final String status;
  final String category;
  final String? categoryId;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final String hostNickname;
  final String? hostAvatar;
  final List<String> tags;
  final int displayOrder;
  final bool isPrivate;
  final String roomType;
  final DateTime? createdAt;

  const PartyRoom({
    required this.id,
    required this.roomNumber,
    required this.title,
    this.collageUrl,
    required this.currentMembers,
    this.maxMembers = 9,
    required this.seatCountFormatted,
    required this.isLive,
    required this.status,
    required this.category,
    this.categoryId,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    required this.hostNickname,
    this.hostAvatar,
    this.tags = const [],
    this.displayOrder = 0,
    this.isPrivate = false,
    this.roomType = 'public',
    this.createdAt,
  });

  /// Host user identifier (maps to party room host or creator)
  String get hostUserId => id;

  factory PartyRoom.fromJson(Map<String, dynamic> json) {
    final rawTags = json['tags'] as List<dynamic>? ?? [];
    final tagsList = rawTags.map((e) => e.toString()).toList();

    final curMembers =
        (json['currentMembers'] as num?)?.toInt() ??
        (json['current_members'] as num?)?.toInt() ??
        1;
    final maxMemb =
        (json['maxMembers'] as num?)?.toInt() ??
        (json['max_members'] as num?)?.toInt() ??
        (json['maxSeats'] as num?)?.toInt() ??
        (json['max_seats'] as num?)?.toInt() ??
        9;

    final seatFormatted =
        json['seatCountFormatted']?.toString() ?? '$curMembers / $maxMemb';

    DateTime? created;
    if (json['createdAt'] != null || json['created_at'] != null) {
      created = DateTime.tryParse(
        (json['createdAt'] ?? json['created_at']).toString(),
      );
    }

    final isPriv =
        json['isPrivate'] == true ||
        json['is_private'] == true ||
        json['roomType'] == 'private' ||
        json['room_type'] == 'private';

    return PartyRoom(
      id: json['id']?.toString() ?? '',
      roomNumber:
          json['roomNumber']?.toString() ??
          (json['room_number']?.toString() ?? ''),
      title: json['title']?.toString() ?? 'Party Room',
      collageUrl:
          json['collageUrl']?.toString() ?? json['collage_url']?.toString(),
      currentMembers: curMembers,
      maxMembers: maxMemb,
      seatCountFormatted: seatFormatted,
      isLive: json['isLive'] != false && json['is_live'] != false,
      status: json['status']?.toString() ?? 'live',
      category: json['category']?.toString() ?? 'Chill & Chat',
      categoryId:
          json['categoryId']?.toString() ?? json['category_id']?.toString(),
      country: json['country']?.toString() ?? 'Global',
      countryCode:
          json['countryCode']?.toString() ??
          (json['country_code']?.toString() ?? 'ALL'),
      flagEmoji:
          json['flagEmoji']?.toString() ??
          (json['flag_emoji']?.toString() ?? '🎉'),
      hostNickname:
          json['hostNickname']?.toString() ??
          (json['host_nickname']?.toString() ?? 'Host'),
      hostAvatar:
          json['hostAvatar']?.toString() ?? json['host_avatar']?.toString(),
      tags: tagsList,
      displayOrder:
          (json['displayOrder'] as num?)?.toInt() ??
          (json['display_order'] as num?)?.toInt() ??
          0,
      isPrivate: isPriv,
      roomType:
          json['roomType']?.toString() ??
          (json['room_type']?.toString() ?? (isPriv ? 'private' : 'public')),
      createdAt: created,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomNumber': roomNumber,
    'title': title,
    'collageUrl': collageUrl,
    'currentMembers': currentMembers,
    'maxMembers': maxMembers,
    'seatCountFormatted': seatCountFormatted,
    'isLive': isLive,
    'status': status,
    'category': category,
    'categoryId': categoryId,
    'country': country,
    'countryCode': countryCode,
    'flagEmoji': flagEmoji,
    'hostNickname': hostNickname,
    'hostAvatar': hostAvatar,
    'tags': tags,
    'displayOrder': displayOrder,
    'isPrivate': isPrivate,
    'roomType': roomType,
    'createdAt': createdAt?.toIso8601String(),
  };
}
