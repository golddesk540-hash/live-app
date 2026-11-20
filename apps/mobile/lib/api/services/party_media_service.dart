import '../api_client.dart';
import '../api_config.dart';
import '../api_response.dart';

/// Real Party Rooms Voice Media Service for Mobile
/// Implements Popo Live Phase 8 (P8-P6)
/// Handles 9-seat voice room SFU tokens, microphone toggle & host moderation.
class PartyMediaService {
  final ApiClient _client;

  PartyMediaService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Whether real party voice media is enabled via feature flag
  bool get isRealPartyMediaEnabled => ApiConfig.useRealPartyMedia;

  /// Requests a role-scoped SFU room token (Host / Speaker / Listener)
  Future<ApiResponse<dynamic>> getMediaToken(String roomId) async {
    return _client.post('/api/party/rooms/$roomId/media/token');
  }

  /// Toggles microphone audio publish state for seat n
  Future<ApiResponse<dynamic>> toggleSeatMic(String roomId, int seatNumber) async {
    return _client.post('/api/party/rooms/$roomId/seats/$seatNumber/mic');
  }

  /// Host force ends party media session
  Future<ApiResponse<dynamic>> endPartyMedia(String roomId) async {
    return _client.post('/api/party/rooms/$roomId/media/end');
  }
}
