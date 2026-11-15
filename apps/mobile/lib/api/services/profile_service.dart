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

  /// Submits initial profile completion with mandatory 18+ birthdate calculation
  Future<ApiResponse<dynamic>> completeProfileSetup({
    required String nickname,
    required String birthdate,
    required String country,
    required String countryCode,
    String gender = 'unspecified',
    String? avatarUrl,
  }) async {
    return _client.post(
      '/api/profile/setup',
      body: {
        'nickname': nickname,
        'birthdate': birthdate,
        'country': country,
        'countryCode': countryCode,
        'gender': gender,
        if (avatarUrl != null && avatarUrl.isNotEmpty) 'avatarUrl': avatarUrl,
      },
    );
  }

  /// Updates allowed profile fields (nickname, country, gender, bio)
  Future<ApiResponse<dynamic>> updateProfile({
    String? nickname,
    String? country,
    String? countryCode,
    String? gender,
    String? bio,
    String? avatarUrl,
  }) async {
    return _client.patch(
      '/api/profile/me',
      body: {
        if (nickname != null) 'nickname': nickname,
        if (country != null) 'country': country,
        if (countryCode != null) 'countryCode': countryCode,
        if (gender != null) 'gender': gender,
        if (bio != null) 'bio': bio,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
      },
    );
  }

  /// Uploads new profile avatar image (base64 payload)
  Future<ApiResponse<dynamic>> uploadAvatar(String base64Image) async {
    return _client.post(
      '/api/profile/avatar',
      body: {'imageBase64': base64Image},
    );
  }
}
