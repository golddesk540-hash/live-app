import '../api_client.dart';
import '../api_config.dart';
import '../api_response.dart';

/// Real Live Streaming Media Service for Mobile
/// Implements Popo Live Phase 8 (P8-P5)
/// Handles RTMP host ingest credentials, HLS viewer playback, and 1v1 PK dual streams.
class MediaStreamService {
  final ApiClient _client;

  MediaStreamService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Whether real live streaming media is enabled via feature flag
  bool get isRealMediaEnabled => ApiConfig.useRealMedia;

  /// Host starts live video broadcast and receives RTMP ingest credentials
  Future<ApiResponse<dynamic>> startStream(String roomId) async {
    return _client.post('/api/live/rooms/$roomId/stream/start');
  }

  /// Host ends active live video broadcast
  Future<ApiResponse<dynamic>> endStream(String roomId) async {
    return _client.post('/api/live/rooms/$roomId/stream/end');
  }

  /// Viewer retrieves signed HLS playback URL and video quality presets
  Future<ApiResponse<dynamic>> getPlayback(String roomId) async {
    return _client.get('/api/live/rooms/$roomId/playback');
  }

  /// Viewer retrieves 1v1 PK side-by-side stream playback info
  Future<ApiResponse<dynamic>> getPkPlayback(String pkBattleId) async {
    return _client.get('/api/live/pk/$pkBattleId/playback');
  }
}
