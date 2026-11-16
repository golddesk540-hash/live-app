import '../api_client.dart';
import '../api_response.dart';

/// Service managing host, wealth, and regional leaderboard rankings
class RankingsService {
  final ApiClient _client;

  RankingsService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  static final RankingsService instance = RankingsService();

  /// Fetches leaderboard preview for Explore tab
  Future<ApiResponse<dynamic>> getRankingsPreview({
    String category = 'host',
    String period = 'monthly',
  }) async {
    return _client.get(
      '/api/discovery/rankings/preview',
      queryParameters: {'category': category, 'period': period},
    );
  }

  /// Fetches discovery ranking navigation doors (Event, Rank, Agency, Notice)
  Future<ApiResponse<dynamic>> getRankDoors() async {
    return _client.get('/api/discovery/rank-doors');
  }

  /// Fetches actual host rankings
  /// [period]: 'daily', 'weekly', 'monthly'
  Future<ApiResponse<dynamic>> getHostRankings({
    String period = 'daily',
    int limit = 20,
  }) async {
    return _client.get(
      '/api/rankings/hosts',
      queryParameters: {'period': period, 'limit': limit.toString()},
    );
  }

  /// Fetches detailed ranking profile for a specific host
  Future<ApiResponse<dynamic>> getHostDetails(String hostId) async {
    return _client.get('/api/rankings/hosts/$hostId');
  }
}
