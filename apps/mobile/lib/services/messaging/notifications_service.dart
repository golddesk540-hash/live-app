import 'package:flutter/material.dart';
import '../../api/api_client.dart';

/// Notification item model
class PopoNotificationItem {
  final String id;
  final String user;
  final String category;
  final String text;
  final String time;
  final bool unread;
  final Color ring;
  final String? entityType;
  final String? entityId;

  const PopoNotificationItem({
    required this.id,
    required this.user,
    required this.category,
    required this.text,
    required this.time,
    required this.unread,
    required this.ring,
    this.entityType,
    this.entityId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user': user,
      'category': category,
      'text': text,
      'time': time,
      'unread': unread,
      'ring': ring,
      'entityType': entityType,
      'entityId': entityId,
    };
  }
}

/// Centralized service for Popo Live In-App Notifications
class NotificationsService {
  NotificationsService._();
  static final NotificationsService instance = NotificationsService._();

  /// Fetches in-app notifications
  Future<List<PopoNotificationItem>> fetchNotifications({
    String category = 'all',
    bool unreadOnly = false,
  }) async {
    final response = await ApiClient.instance.get(
      '/api/notifications',
      queryParameters: {
        if (category != 'all' && category != 'All') 'category': category.toLowerCase(),
        if (unreadOnly) 'unreadOnly': 'true',
      },
    );

    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load notifications.');
    }

    final data = response.data['data'] as Map<String, dynamic>?;
    final list = (data?['notifications'] as List<dynamic>?) ?? [];

    return list.map((n) {
      final ringHex = n['ringColorHex'] as String? ?? '#3B82F6';
      Color ringColor = const Color(0xFF3B82F6);
      try {
        final clean = ringHex.replaceAll('#', '');
        ringColor = Color(int.parse('FF$clean', radix: 16));
      } catch (_) {}

      // Normalize category for UI display
      String cat = n['category']?.toString() ?? 'Platform';
      if (cat.toLowerCase() == 'messages') cat = 'Mentions';
      else if (cat.toLowerCase() == 'likes') cat = 'Likes';
      else if (cat.toLowerCase() == 'comments') cat = 'Comments';
      else if (cat.toLowerCase() == 'followers') cat = 'Followers';
      else if (cat.toLowerCase() == 'invites') cat = 'Invites';
      else if (cat.toLowerCase() == 'live_activity') cat = 'Live Activity';

      return PopoNotificationItem(
        id: n['id']?.toString() ?? '',
        user: n['actorNickname']?.toString() ?? 'Popo User',
        category: cat,
        text: n['body']?.toString() ?? '',
        time: n['timeAgo']?.toString() ?? '',
        unread: n['isRead'] != true,
        ring: ringColor,
        entityType: n['entityType']?.toString(),
        entityId: n['entityId']?.toString(),
      );
    }).toList();
  }

  /// Marks a specific notification as read
  Future<void> markNotificationRead(String notificationId) async {
    await ApiClient.instance.post('/api/notifications/$notificationId/read');
  }

  /// Marks all notifications as read
  Future<void> markAllNotificationsRead() async {
    await ApiClient.instance.post('/api/notifications/read-all');
  }
}
