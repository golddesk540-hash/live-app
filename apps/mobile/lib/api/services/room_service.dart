import '../api_client.dart';
import '../api_response.dart';

/// Service managing individual live room metadata, status, host info, and audience
class RoomService {
  final ApiClient _client;

  RoomService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Fetches room details including title, category, and playback status
  Future<ApiResponse<dynamic>> getRoomDetails(String roomId) async {
    return _client.get('/api/discovery/rooms/$roomId');
  }

  /// Fetches live room operational status
  Future<ApiResponse<dynamic>> getRoomStatus(String roomId) async {
    return _client.get('/api/discovery/rooms/$roomId/status');
  }

  /// Fetches host information for the specified room
  Future<ApiResponse<dynamic>> getRoomHost(String roomId) async {
    return _client.get('/api/discovery/rooms/$roomId/host');
  }

  /// Fetches active viewer count and viewer list
  Future<ApiResponse<dynamic>> getRoomViewers(String roomId) async {
    return _client.get('/api/discovery/rooms/$roomId/viewers');
  }
}
