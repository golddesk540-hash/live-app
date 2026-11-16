/// Represents a chat message in a Party Room
/// Endpoints:
/// - GET  /api/party/{roomId}/chat/messages
/// - POST /api/party/{roomId}/chat/send
class PartyChatMessage {
  final String id;
  final String roomNumber;
  final String senderId;
  final String senderName;
  final String? senderAvatar;
  final String senderRole; // 'host' | 'speaker' | 'audience'
  final int? seatNumber;
  final String messageText;
  final String? emoji;
  final DateTime? createdAt;
  final int vipLevel;
  final String? vipBadgeLabel;

  const PartyChatMessage({
    required this.id,
    required this.roomNumber,
    required this.senderId,
    required this.senderName,
    this.senderAvatar,
    this.senderRole = 'audience',
    this.seatNumber,
    required this.messageText,
    this.emoji,
    this.createdAt,
    this.vipLevel = 0,
    this.vipBadgeLabel,
  });

  bool get isHost => senderRole == 'host' || seatNumber == 1;
  bool get isSpeaker =>
      senderRole == 'speaker' || (seatNumber != null && seatNumber! > 1);

  factory PartyChatMessage.fromJson(Map<String, dynamic> json) {
    DateTime? created;
    if (json['createdAt'] != null || json['created_at'] != null) {
      created = DateTime.tryParse(
        (json['createdAt'] ?? json['created_at']).toString(),
      );
    }

    return PartyChatMessage(
      id: json['id']?.toString() ?? '',
      roomNumber:
          json['roomNumber']?.toString() ??
          (json['room_number']?.toString() ?? ''),
      senderId:
          json['senderId']?.toString() ?? (json['sender_id']?.toString() ?? ''),
      senderName:
          json['senderName']?.toString() ??
          (json['sender_name']?.toString() ?? 'User'),
      senderAvatar:
          json['senderAvatar']?.toString() ?? json['sender_avatar']?.toString(),
      senderRole:
          json['senderRole']?.toString() ??
          (json['sender_role']?.toString() ?? 'audience'),
      seatNumber:
          (json['seatNumber'] as num?)?.toInt() ??
          (json['seat_number'] as num?)?.toInt(),
      messageText:
          json['messageText']?.toString() ??
          (json['message_text']?.toString() ?? ''),
      emoji: json['emoji']?.toString(),
      createdAt: created,
      vipLevel:
          (json['vipLevel'] as num?)?.toInt() ??
          (json['vip_level'] as num?)?.toInt() ??
          0,
      vipBadgeLabel:
          json['vipBadgeLabel']?.toString() ?? json['badge_label']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomNumber': roomNumber,
    'senderId': senderId,
    'senderName': senderName,
    'senderAvatar': senderAvatar,
    'senderRole': senderRole,
    'seatNumber': seatNumber,
    'messageText': messageText,
    'emoji': emoji,
    'createdAt': createdAt?.toIso8601String(),
    'vipLevel': vipLevel,
    'vipBadgeLabel': vipBadgeLabel,
  };
}
