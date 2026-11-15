import '../api_client.dart';
import '../api_response.dart';

/// Service managing Explore feed, live stream queries, categories, and tabs
class DiscoveryService {
  final ApiClient _client;

  DiscoveryService({ApiClient? client})
    : _client = client ?? ApiClient.instance;

  /// Fetches paginated explore live rooms with optional filters
  Future<ApiResponse<dynamic>> getExplore({
    int page = 1,
    int limit = 12,
    String? category, // 'live', 'party', 'pk', 'game'
    String? country, // 'ALL' or 2-letter ISO code
    String? search,
  }) async {
    return _client.get(
      '/api/discovery/explore',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (category != null && category.isNotEmpty) 'category': category,
        if (country != null && country.isNotEmpty) 'country': country,
        if (search != null && search.isNotEmpty) 'q': search,
      },
    );
  }

  /// Fetches followed hosts currently broadcasting
  Future<ApiResponse<dynamic>> getFollowing({
    int page = 1,
    int limit = 12,
  }) async {
    return _client.get(
      '/api/discovery/following',
      queryParameters: {'page': page, 'limit': limit},
    );
  }

  /// Fetches newly onboarded hosts
  Future<ApiResponse<dynamic>> getNewHosts({
    int page = 1,
    int limit = 12,
  }) async {
    return _client.get(
      '/api/discovery/new',
      queryParameters: {'page': page, 'limit': limit},
    );
  }

  /// Fetches multi-seat audio/video party rooms
  Future<ApiResponse<dynamic>> getPartyRooms({
    int page = 1,
    int limit = 12,
  }) async {
    return _client.get(
      '/api/discovery/party',
      queryParameters: {'page': page, 'limit': limit},
    );
  }

  /// Fetches active PK battle rooms
  Future<ApiResponse<dynamic>> getPkRooms({
    int page = 1,
    int limit = 12,
  }) async {
    return _client.get(
      '/api/discovery/pk',
      queryParameters: {'page': page, 'limit': limit},
    );
  }

  /// Searches live hosts, live rooms, and party rooms by keyword or numeric ID
  Future<ApiResponse<dynamic>> search(
    String query, {
    String type = 'all', // 'all', 'users', 'rooms', 'party'
    int limit = 20,
  }) async {
    return _client.get(
      '/api/search',
      queryParameters: {'q': query, 'type': type, 'limit': limit},
    );
  }
}
