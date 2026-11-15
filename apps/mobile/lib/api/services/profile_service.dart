import '../api_client.dart';
import '../api_response.dart';

/// Service managing user profiles, levels, VIP status, and public cards
class ProfileService {
  final ApiClient _client;

  ProfileService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Retrieves authenticated user's profile, VIP details, and loadout
  Future<ApiResponse<dynamic>> getMyProfile() async {
    return _client.get('/api/profile/me');
  }

  /// Retrieves authenticated user's activity and gifting statistics
  Future<ApiResponse<dynamic>> getMyStatistics() async {
    return _client.get('/api/profile/me/statistics');
  }

  /// Retrieves public user profile card by user UUID or numeric ID
  Future<ApiResponse<dynamic>> getPublicProfile(String userId) async {
    return _client.get('/api/users/$userId/public-profile');
  }

  /// Verifies availability of nickname during setup or editing
  Future<ApiResponse<dynamic>> checkNickname(String nickname) async {
    return _client.get(
      '/api/profile/check-nickname',
      queryParameters: {'nickname': nickname},
    );
  }
}
