/// Model representing one of the 9 seats in a Party Room
/// Corresponds to endpoint: GET /api/party/{roomId}/seats
class PartySeat {
  final String id;
  final String roomNumber;
  final int seatNumber; // 1 to 9
  final String? participantId;
  final String? participantName;
  final String? participantAvatar;
  final bool isHost; // true if seatNumber == 1 or marked as host
  final bool isMuted;
  final bool isCameraOn;
  final bool isHostMuted;
  final bool isVideoDisabled;
  final String cameraFacing;
  final String status; // 'occupied' or 'available'
  final DateTime? occupiedAt;
  final DateTime? updatedAt;

  const PartySeat({
    required this.id,
    required this.roomNumber,
    required this.seatNumber,
    this.participantId,
    this.participantName,
    this.participantAvatar,
    required this.isHost,
    this.isMuted = false,
    this.isCameraOn = false,
    this.isHostMuted = false,
    this.isVideoDisabled = false,
    this.cameraFacing = 'user',
    required this.status,
    this.occupiedAt,
    this.updatedAt,
  });

  bool get isOccupied => status == 'occupied' && participantId != null;
  bool get isAvailable => !isOccupied;

  factory PartySeat.fromJson(Map<String, dynamic> json) {
    DateTime? occAt;
    if (json['occupiedAt'] != null || json['occupied_at'] != null) {
      occAt = DateTime.tryParse(
        (json['occupiedAt'] ?? json['occupied_at']).toString(),
      );
    }

    DateTime? updAt;
    if (json['updatedAt'] != null || json['updated_at'] != null) {
      updAt = DateTime.tryParse(
        (json['updatedAt'] ?? json['updated_at']).toString(),
      );
    }

    final seatNum =
        (json['seatNumber'] as num?)?.toInt() ??
        (json['seat_number'] as num?)?.toInt() ??
        1;

    final isHostFlag =
        json['isHost'] == true || json['is_host'] == true || seatNum == 1;

    final stat =
        json['status']?.toString() ??
        (json['participantId'] != null || json['participant_id'] != null
            ? 'occupied'
            : 'available');

    return PartySeat(
      id: json['id']?.toString() ?? 'seat-$seatNum',
      roomNumber:
          json['roomNumber']?.toString() ??
          (json['room_number']?.toString() ?? ''),
      seatNumber: seatNum,
      participantId:
          json['participantId']?.toString() ??
          json['participant_id']?.toString(),
      participantName:
          json['participantName']?.toString() ??
          json['participant_name']?.toString(),
      participantAvatar:
          json['participantAvatar']?.toString() ??
          json['participant_avatar']?.toString(),
      isHost: isHostFlag,
      isMuted: json['isMuted'] == true || json['is_muted'] == true,
      isCameraOn: json['isCameraOn'] == true || json['is_camera_on'] == true,
      isHostMuted: json['isHostMuted'] == true || json['is_host_muted'] == true,
      isVideoDisabled:
          json['isVideoDisabled'] == true || json['is_video_disabled'] == true,
      cameraFacing:
          json['cameraFacing']?.toString() ??
          (json['camera_facing']?.toString() ?? 'user'),
      status: stat,
      occupiedAt: occAt,
      updatedAt: updAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomNumber': roomNumber,
    'seatNumber': seatNumber,
    'participantId': participantId,
    'participantName': participantName,
    'participantAvatar': participantAvatar,
    'isHost': isHost,
    'isMuted': isMuted,
    'isCameraOn': isCameraOn,
    'isHostMuted': isHostMuted,
    'isVideoDisabled': isVideoDisabled,
    'cameraFacing': cameraFacing,
    'status': status,
    'occupiedAt': occupiedAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
  };
}
