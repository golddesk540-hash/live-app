import '../api_client.dart';
import '../api_response.dart';

/// Service managing creator events, campaigns, and leaderboard rankings
class EventService {
  final ApiClient _client;

  EventService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  static final EventService instance = EventService();

  /// Fetches events list, optionally filtered by status ('active', 'upcoming', 'completed')
  Future<ApiResponse<dynamic>> getEvents({String? status}) async {
    return _client.get(
      '/api/events',
      queryParameters: status != null ? {'status': status} : null,
    );
  }

  /// Fetches leaderboard rankings for a specific event
  Future<ApiResponse<dynamic>> getEventLeaderboard(String eventId) async {
    return _client.get('/api/events/$eventId/leaderboard');
  }

  /// Registers authenticated user for an event
  Future<ApiResponse<dynamic>> joinEvent(String eventId) async {
    return _client.post('/api/events/$eventId/join');
  }
}
