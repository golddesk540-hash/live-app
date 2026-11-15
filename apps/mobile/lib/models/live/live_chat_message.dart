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
  final int wealthLevel;
  final bool isPinned;
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
    this.wealthLevel = 1,
    this.isPinned = false,
    required this.createdAt,
  });

  /// Alias for senderNickname
  String get nickname => senderNickname;

  /// Formatted string combining text and emoji
  String get displayContent =>
      (emoji != null && emoji!.isNotEmpty) ? '$text $emoji' : text;

  /// Formatted HH:mm time string
  String get formattedTime {
    final hour = createdAt.hour.toString().padLeft(2, '0');
    final minute = createdAt.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  factory LiveChatMessage.fromJson(Map<String, dynamic> json) {
    DateTime time = DateTime.now();
    final rawTime =
        json['createdAt'] ?? json['timestamp'] ?? json['created_at'];
    if (rawTime != null) {
      time = DateTime.tryParse(rawTime.toString()) ?? time;
    }

    final rawNickname =
        json['senderNickname'] ??
        json['sender_nickname'] ??
        json['nickname'] ??
        json['user'] ??
        'User';
    final rawAvatar =
        json['senderAvatarUrl'] ??
        json['sender_avatar_url'] ??
        json['avatarUrl'] ??
        json['avatar'];
    final rawRole =
        json['senderRole'] ?? json['sender_role'] ?? json['role'] ?? 'viewer';
    final rawText =
        json['messageText'] ??
        json['text'] ??
        json['message'] ??
        json['content'] ??
        '';
    final rawWealth = json['wealthLevel'] ?? json['wealth_level'] ?? 1;

    return LiveChatMessage(
      id: json['id']?.toString() ?? '',
      roomId: json['roomId']?.toString() ?? json['room_id']?.toString() ?? '',
      senderId:
          json['senderId']?.toString() ?? json['sender_id']?.toString() ?? '',
      senderNickname: rawNickname.toString(),
      senderAvatarUrl: rawAvatar?.toString(),
      senderRole: rawRole.toString(),
      text: rawText.toString(),
      emoji: json['emoji']?.toString(),
      wealthLevel: (rawWealth as num?)?.toInt() ?? 1,
      isPinned: json['isPinned'] == true || json['is_pinned'] == true,
      createdAt: time,
    );
  }
}
