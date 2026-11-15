/// Live chat message domain model
class LiveChatMessage {
  final String id;
  final String roomId;
  final String senderId;
  final String senderNickname;
  final String? senderAvatarUrl;
  final String senderRole;
  final String text;
  final String? emoji;
  final DateTime createdAt;

  const LiveChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.senderNickname,
    this.senderAvatarUrl,
    required this.senderRole,
    required this.text,
    this.emoji,
    required this.createdAt,
  });

  /// Formatted string combining text and emoji
  String get displayContent =>
      (emoji != null && emoji!.isNotEmpty) ? '$text $emoji' : text;

  factory LiveChatMessage.fromJson(Map<String, dynamic> json) {
    DateTime time = DateTime.now();
    if (json['createdAt'] != null) {
      time = DateTime.tryParse(json['createdAt'].toString()) ?? time;
    }

    return LiveChatMessage(
      id: json['id']?.toString() ?? '',
      roomId: json['roomId']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      senderNickname: json['senderNickname']?.toString() ?? 'User',
      senderAvatarUrl: json['senderAvatarUrl']?.toString(),
      senderRole: json['senderRole']?.toString() ?? 'viewer',
      text: json['messageText']?.toString() ?? json['text']?.toString() ?? '',
      emoji: json['emoji']?.toString(),
      createdAt: time,
    );
  }
}
