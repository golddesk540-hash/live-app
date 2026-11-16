/// Represents an audience member in a Party Room
/// Endpoint: GET /api/party/{roomId}/audience
class PartyAudienceMember {
  final String id;
  final String roomNumber;
  final String userId;
  final String userName;
  final String? userAvatar;
  final int userLevel;
  final bool isActive;
  final DateTime? joinedAt;

  const PartyAudienceMember({
    required this.id,
    required this.roomNumber,
    required this.userId,
    required this.userName,
    this.userAvatar,
    this.userLevel = 1,
    this.isActive = true,
    this.joinedAt,
  });

  factory PartyAudienceMember.fromJson(Map<String, dynamic> json) {
    DateTime? joined;
    if (json['joinedAt'] != null || json['joined_at'] != null) {
      joined = DateTime.tryParse(
        (json['joinedAt'] ?? json['joined_at']).toString(),
      );
    }

    return PartyAudienceMember(
      id: json['id']?.toString() ?? '',
      roomNumber:
          json['roomNumber']?.toString() ??
          (json['room_number']?.toString() ?? ''),
      userId: json['userId']?.toString() ?? (json['user_id']?.toString() ?? ''),
      userName:
          json['userName']?.toString() ??
          (json['user_name']?.toString() ?? 'Viewer'),
      userAvatar:
          json['userAvatar']?.toString() ?? json['user_avatar']?.toString(),
      userLevel:
          (json['userLevel'] as num?)?.toInt() ??
          (json['user_level'] as num?)?.toInt() ??
          1,
      isActive: json['isActive'] != false && json['is_active'] != false,
      joinedAt: joined,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomNumber': roomNumber,
    'userId': userId,
    'userName': userName,
    'userAvatar': userAvatar,
    'userLevel': userLevel,
    'isActive': isActive,
    'joinedAt': joinedAt?.toIso8601String(),
  };
}
