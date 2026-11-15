import '../api_client.dart';
import '../api_response.dart';

/// Service managing host, wealth, and regional leaderboard rankings
class RankingsService {
  final ApiClient _client;

  RankingsService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Fetches leaderboard preview for Explore tab
  /// [category]: 'host', 'wealth', 'popularity', 'country'
  /// [period]: 'daily', 'weekly', 'monthly'
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
}
