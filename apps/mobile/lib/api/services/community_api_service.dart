import '../api_client.dart';
import '../api_response.dart';

/// Popo Live — Phase 7 (P7-P10)
/// Mobile API Service for Community Module (Fan Club, Guardian, Invite, Honor/Level, Poster, Watch History)
class CommunityApiService {
  CommunityApiService._();
  static final CommunityApiService instance = CommunityApiService._();

  final ApiClient _client = ApiClient.instance;

  /// Fetches fan club header and overview
  Future<ApiResponse<dynamic>> fetchFanClubDetail(String clubId) async {
    return _client.get('/api/community/fan-clubs/$clubId');
  }

  /// Joins a broadcaster fan club (enforces Age 18+ and unique membership)
  Future<ApiResponse<dynamic>> joinFanClub(String clubId) async {
    return _client.post('/api/community/fan-clubs/$clubId/join');
  }

  /// Leaves a broadcaster fan club
  Future<ApiResponse<dynamic>> leaveFanClub(String clubId) async {
    return _client.delete('/api/community/fan-clubs/$clubId/leave');
  }

  /// Fetches members list of a fan club
  Future<ApiResponse<dynamic>> fetchFanClubMembers(
    String clubId, {
    int limit = 20,
    int offset = 0,
  }) async {
    final uri = Uri(
      path: '/api/community/fan-clubs/$clubId/members',
      queryParameters: {
        'limit': limit.toString(),
        'offset': offset.toString(),
      },
    );
    return _client.get(uri.toString());
  }

  /// Fetches active guardians for a broadcaster / host
  Future<ApiResponse<dynamic>> fetchGuardians(String hostId) async {
    return _client.get('/api/community/guardians/$hostId');
  }

  /// Purchases a Guardian contract atomically using coin balance
  Future<ApiResponse<dynamic>> becomeGuardian(
    String hostId, {
    String tier = 'guardian_angel',
    String? idempotencyKey,
  }) async {
    final headers = <String, String>{};
    if (idempotencyKey != null) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return _client.post(
      '/api/community/guardians/become',
      body: {
        'hostId': hostId,
        'tier': tier,
        'idempotencyKey': idempotencyKey,
      },
      headers: headers,
    );
  }

  /// Fetches guardian benefits catalog
  Future<ApiResponse<dynamic>> fetchGuardianBenefits() async {
    return _client.get('/api/community/guardians/benefits');
  }

  /// Fetches caller's unique referral invite code and stats
  Future<ApiResponse<dynamic>> fetchInviteCode() async {
    return _client.get('/api/community/invite/code');
  }

  /// Fetches invite share payload with text, link and QR placeholder
  Future<ApiResponse<dynamic>> fetchInviteSharePayload() async {
    return _client.post('/api/community/invite/share');
  }

  /// Fetches list of people invited by the caller
  Future<ApiResponse<dynamic>> fetchInvitedPeople() async {
    return _client.get('/api/community/invite/people');
  }

  /// Fetches derived Honor Level bars from backend (wealth, shining, honor)
  Future<ApiResponse<dynamic>> fetchHonorLevels(String userId) async {
    return _client.get('/api/community/honor/$userId');
  }

  /// Fetches Level screen data (reuses honor data)
  Future<ApiResponse<dynamic>> fetchLevelData(String userId) async {
    return _client.get('/api/community/level/$userId');
  }

  /// Fetches shareable achievement poster payload for card preview
  Future<ApiResponse<dynamic>> fetchPosterPayload() async {
    return _client.get('/api/community/poster/me');
  }

  /// Fetches user's watch history (read-only from live_room_history, paginated)
  Future<ApiResponse<dynamic>> fetchWatchHistory({
    int page = 1,
    int limit = 20,
  }) async {
    final uri = Uri(
      path: '/api/community/watch-history',
      queryParameters: {
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );
    return _client.get(uri.toString());
  }
}
