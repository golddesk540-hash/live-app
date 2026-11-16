/// Represents a guest request to join a specific seat in a Party Room
/// Endpoint: GET /api/party/{roomId}/seats/requests
class PartySeatRequest {
  final String id;
  final String roomNumber;
  final int seatNumber;
  final String userId;
  final String userName;
  final String? userAvatar;
  final String
  status; // 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
  final DateTime? createdAt;
  final DateTime? expiresAt;

  const PartySeatRequest({
    required this.id,
    required this.roomNumber,
    required this.seatNumber,
    required this.userId,
    required this.userName,
    this.userAvatar,
    required this.status,
    this.createdAt,
    this.expiresAt,
  });

  bool get isPending => status == 'pending';

  factory PartySeatRequest.fromJson(Map<String, dynamic> json) {
    DateTime? created;
    if (json['createdAt'] != null || json['created_at'] != null) {
      created = DateTime.tryParse(
        (json['createdAt'] ?? json['created_at']).toString(),
      );
    }
    DateTime? expires;
    if (json['expiresAt'] != null || json['expires_at'] != null) {
      expires = DateTime.tryParse(
        (json['expiresAt'] ?? json['expires_at']).toString(),
      );
    }

    return PartySeatRequest(
      id: json['id']?.toString() ?? '',
      roomNumber:
          json['roomNumber']?.toString() ??
          (json['room_number']?.toString() ?? ''),
      seatNumber:
          (json['seatNumber'] as num?)?.toInt() ??
          (json['seat_number'] as num?)?.toInt() ??
          2,
      userId: json['userId']?.toString() ?? (json['user_id']?.toString() ?? ''),
      userName:
          json['userName']?.toString() ??
          (json['user_name']?.toString() ?? 'Guest'),
      userAvatar:
          json['userAvatar']?.toString() ?? json['user_avatar']?.toString(),
      status: json['status']?.toString() ?? 'pending',
      createdAt: created,
      expiresAt: expires,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomNumber': roomNumber,
    'seatNumber': seatNumber,
    'userId': userId,
    'userName': userName,
    'userAvatar': userAvatar,
    'status': status,
    'createdAt': createdAt?.toIso8601String(),
    'expiresAt': expiresAt?.toIso8601String(),
  };
}

/// Represents an invitation from the host to an audience member for a seat
/// Endpoint: GET /api/party/{roomId}/seats/requests
class PartySeatInvitation {
  final String id;
  final String roomNumber;
  final int seatNumber;
  final String hostId;
  final String invitedUserId;
  final String invitedUserName;
  final String? invitedUserAvatar;
  final String status; // 'pending' | 'accepted' | 'declined' | 'expired'
  final DateTime? createdAt;
  final DateTime? expiresAt;

  const PartySeatInvitation({
    required this.id,
    required this.roomNumber,
    required this.seatNumber,
    required this.hostId,
    required this.invitedUserId,
    required this.invitedUserName,
    this.invitedUserAvatar,
    required this.status,
    this.createdAt,
    this.expiresAt,
  });

  bool get isPending => status == 'pending';

  factory PartySeatInvitation.fromJson(Map<String, dynamic> json) {
    DateTime? created;
    if (json['createdAt'] != null || json['created_at'] != null) {
      created = DateTime.tryParse(
        (json['createdAt'] ?? json['created_at']).toString(),
      );
    }
    DateTime? expires;
    if (json['expiresAt'] != null || json['expires_at'] != null) {
      expires = DateTime.tryParse(
        (json['expiresAt'] ?? json['expires_at']).toString(),
      );
    }

    return PartySeatInvitation(
      id: json['id']?.toString() ?? '',
      roomNumber:
          json['roomNumber']?.toString() ??
          (json['room_number']?.toString() ?? ''),
      seatNumber:
          (json['seatNumber'] as num?)?.toInt() ??
          (json['seat_number'] as num?)?.toInt() ??
          2,
      hostId: json['hostId']?.toString() ?? (json['host_id']?.toString() ?? ''),
      invitedUserId:
          json['invitedUserId']?.toString() ??
          (json['invited_user_id']?.toString() ?? ''),
      invitedUserName:
          json['invitedUserName']?.toString() ??
          (json['invited_user_name']?.toString() ?? 'Guest'),
      invitedUserAvatar:
          json['invitedUserAvatar']?.toString() ??
          json['invited_user_avatar']?.toString(),
      status: json['status']?.toString() ?? 'pending',
      createdAt: created,
      expiresAt: expires,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomNumber': roomNumber,
    'seatNumber': seatNumber,
    'hostId': hostId,
    'invitedUserId': invitedUserId,
    'invitedUserName': invitedUserName,
    'invitedUserAvatar': invitedUserAvatar,
    'status': status,
    'createdAt': createdAt?.toIso8601String(),
    'expiresAt': expiresAt?.toIso8601String(),
  };
}
