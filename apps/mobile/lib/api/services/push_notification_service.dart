import '../api_client.dart';
import '../api_config.dart';
import '../api_response.dart';

/// Central API Service for Push Notifications (FCM / APNs)
/// Implements Popo Live Phase 8 (P8-P8) Device Token Registration & Push Preferences
class PushNotificationService {
  final ApiClient _client;

  PushNotificationService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Registers an active FCM or APNs device push token on user login
  Future<ApiResponse<dynamic>> registerDeviceToken({
    required String deviceToken,
    String platform = 'android',
    String? deviceModel,
    String? appVersion,
  }) async {
    return _client.post(
      '/api/notifications/device-token',
      body: {
        'deviceToken': deviceToken,
        'platform': platform,
        if (deviceModel != null) 'deviceModel': deviceModel,
        if (appVersion != null) 'appVersion': appVersion,
      },
    );
  }

  /// Invalidates and unregisters a device token on user logout
  Future<ApiResponse<dynamic>> unregisterDeviceToken({
    required String deviceToken,
  }) async {
    return _client.delete(
      '/api/notifications/device-token',
      queryParameters: {
        'deviceToken': deviceToken,
      },
    );
  }

  /// Retrieves user's granular push notification and quiet hours preferences
  Future<ApiResponse<dynamic>> getSettings() async {
    return _client.get('/api/notifications/settings');
  }

  /// Updates user's push notification category preferences and quiet hours
  Future<ApiResponse<dynamic>> updateSettings(Map<String, dynamic> updates) async {
    return _client.patch(
      '/api/notifications/settings',
      body: updates,
    );
  }

  /// Returns whether real push notification delivery is enabled
  bool get isRealPushEnabled => ApiConfig.useRealPush;
}
