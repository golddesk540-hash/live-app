import '../api_client.dart';
import '../api_response.dart';

/// Central API Service for 9-Seat Party Rooms
/// Connects to verified Next.js backend endpoints:
/// - GET  /api/discovery/party
/// - GET  /api/party/categories
/// - POST /api/party/create
/// - GET  /api/party/{roomId}
/// - GET  /api/party/{roomId}/seats
class PartyApiService {
  final ApiClient _client;

  PartyApiService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Fetches available party rooms with optional category, country, or keyword search filters
  Future<ApiResponse<dynamic>> getPartyRooms({
    String? country,
    String? category,
    String? search,
  }) async {
    return _client.get(
      '/api/discovery/party',
      queryParameters: {
        if (country != null && country.isNotEmpty && country != 'ALL')
          'country': country,
        if (category != null && category.isNotEmpty && category != 'all')
          'category': category,
        if (search != null && search.isNotEmpty) 'q': search,
      },
    );
  }

  /// Retrieves canonical party room categories
  Future<ApiResponse<dynamic>> getCategories() async {
    return _client.get('/api/party/categories');
  }

  /// Creates a new 9-seat party room
  Future<ApiResponse<dynamic>> createPartyRoom({
    required String title,
    required String categoryId,
    String roomType = 'public',
  }) async {
    return _client.post(
      '/api/party/create',
      body: {
        'title': title.trim(),
        'categoryId': categoryId,
        'roomType': roomType,
      },
    );
  }

  /// Loads details for a specific party room
  Future<ApiResponse<dynamic>> getPartyRoomDetails(String roomId) async {
    return _client.get('/api/party/$roomId');
  }

  /// Loads real-time 9-seat occupancy and participant status for a party room
  Future<ApiResponse<dynamic>> getPartySeats(String roomId) async {
    return _client.get('/api/party/$roomId/seats');
  }
}
