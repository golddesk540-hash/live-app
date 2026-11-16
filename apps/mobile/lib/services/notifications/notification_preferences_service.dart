import '../../api/api_client.dart';

/// Notification Preferences Model
class UserNotificationPreferences {
  final bool directMessages;
  final bool giftAlerts;
  final bool liveBroadcasts;
  final bool systemAnnouncements;
  final bool promotional;

  const UserNotificationPreferences({
    this.directMessages = true,
    this.giftAlerts = true,
    this.liveBroadcasts = true,
    this.systemAnnouncements = true,
    this.promotional = false,
  });

  factory UserNotificationPreferences.fromMap(Map<String, dynamic> map) {
    return UserNotificationPreferences(
      directMessages: map['direct_messages'] != false,
      giftAlerts: map['gift_alerts'] != false,
      liveBroadcasts: map['live_broadcasts'] != false,
      systemAnnouncements: map['system'] != false,
      promotional: map['promotional'] == true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'direct_messages': directMessages,
      'gift_alerts': giftAlerts,
      'live_broadcasts': liveBroadcasts,
      'system': systemAnnouncements,
      'promotional': promotional,
    };
  }
}

/// Centralized service for User Notification Preferences
class NotificationPreferencesService {
  NotificationPreferencesService._();
  static final NotificationPreferencesService instance = NotificationPreferencesService._();

  /// Fetches authoritative notification settings from backend
  Future<UserNotificationPreferences> fetchPreferences() async {
    final response = await ApiClient.instance.get('/api/settings/notifications');
    if (!response.isSuccess || response.data == null) {
      return const UserNotificationPreferences();
    }
    final notifs = response.data['notifications'] as Map<String, dynamic>? ?? {};
    return UserNotificationPreferences.fromMap(notifs);
  }

  /// Updates notification preferences on backend
  Future<bool> updatePreferences(UserNotificationPreferences prefs) async {
    final response = await ApiClient.instance.post(
      '/api/settings/notifications',
      body: prefs.toMap(),
    );
    return response.isSuccess;
  }
}
