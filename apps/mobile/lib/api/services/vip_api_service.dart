import '../api_client.dart';
import '../api_response.dart';

/// Popo Live — Phase 7 (P7-P8)
/// Mobile API Service for VIP, Rewards, Rankings, Honor Levels & Medals
class VipApiService {
  VipApiService._();
  static final VipApiService instance = VipApiService._();

  final ApiClient _client = ApiClient.instance;

  /// Fetches active VIP membership plans
  Future<ApiResponse<dynamic>> fetchVipPlans() async {
    return _client.get('/api/vip/plans');
  }

  /// Fetches active VIP membership status for current user
  Future<ApiResponse<dynamic>> fetchActiveVip() async {
    return _client.get('/api/vip/active');
  }

  /// Subscribes to a VIP plan with atomic coin debit
  Future<ApiResponse<dynamic>> subscribeVipPlan(
    String planId, {
    String? idempotencyKey,
  }) async {
    final headers = <String, String>{};
    if (idempotencyKey != null) {
      headers['idempotency-key'] = idempotencyKey;
    }
    return _client.post(
      '/api/vip/plans/$planId/subscribe',
      body: {'idempotencyKey': idempotencyKey},
      headers: headers,
    );
  }

  /// Fetches VIP subscription history
  Future<ApiResponse<dynamic>> fetchVipHistory() async {
    return _client.get('/api/vip/history');
  }

  /// Fetches daily rewards and host task progress
  Future<ApiResponse<dynamic>> fetchRewards() async {
    return _client.get('/api/rewards');
  }

  /// Claims reward points atomically for a completed task
  Future<ApiResponse<dynamic>> claimReward(
    String rewardId, {
    String? idempotencyKey,
  }) async {
    final headers = <String, String>{};
    if (idempotencyKey != null) {
      headers['idempotency-key'] = idempotencyKey;
    }
    return _client.post(
      '/api/rewards/$rewardId/claim',
      body: {'idempotencyKey': idempotencyKey},
      headers: headers,
    );
  }

  /// Fetches reward claim history
  Future<ApiResponse<dynamic>> fetchRewardsHistory() async {
    return _client.get('/api/rewards/history');
  }

  /// Fetches derived host rankings for day / week / month
  Future<ApiResponse<dynamic>> fetchHostRankings({
    String range = 'day',
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get(
      '/api/rankings/hosts',
      queryParameters: {
        'range': range,
        'page': page.toString(),
        'limit': limit.toString(),
      },
    );
  }

  /// Fetches active event leaderboard
  Future<ApiResponse<dynamic>> fetchEventRankings() async {
    return _client.get('/api/rankings/events');
  }

  /// Fetches derived three-bar honor levels (wealth, shining, honor)
  Future<ApiResponse<dynamic>> fetchHonorLevels(String userId) async {
    return _client.get('/api/honor/levels/$userId');
  }

  /// Fetches read-only medal wall (earned medals + locked slots)
  Future<ApiResponse<dynamic>> fetchMedalsMe() async {
    return _client.get('/api/medals/me');
  }
}
