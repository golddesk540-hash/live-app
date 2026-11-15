import '../api_client.dart';
import '../api_response.dart';

/// Central API Service for Live Streaming Operations
/// Interacts with Next.js live routes (/api/live/*)
class LiveApiService {
  final ApiClient _client;

  LiveApiService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  // ==========================================
  // GO-LIVE GATES
  // ==========================================

  /// Checks user Go-Live gate status (Wealth Level 5, Face KYC, Cover Photo)
  Future<ApiResponse<dynamic>> getGatesStatus({bool isDemo = false}) async {
    return _client.get(
      '/api/live/gates/status',
      queryParameters: isDemo ? {'demo': 'true'} : null,
    );
  }

  /// Submits biometric face verification scan
  Future<ApiResponse<dynamic>> verifyFace({
    bool simulateFailure = false,
    String? reason,
  }) async {
    return _client.post(
      '/api/live/gates/face-verify',
      body: {
        if (simulateFailure) 'simulateFailure': true,
        if (reason != null) 'reason': reason,
      },
    );
  }

  /// Uploads live broadcast cover photo (base64 payload)
  Future<ApiResponse<dynamic>> uploadCover({
    required String base64Image,
    String fileName = 'live_cover.jpg',
  }) async {
    return _client.post(
      '/api/live/gates/cover-upload',
      body: {'imageBase64': base64Image, 'fileName': fileName},
    );
  }

  /// Removes uploaded live broadcast cover photo
  Future<ApiResponse<dynamic>> deleteCover() async {
    return _client.delete('/api/live/gates/cover-upload');
  }

  /// Resets biometric face verification status (for testing)
  Future<ApiResponse<dynamic>> resetFaceVerification() async {
    return _client.delete('/api/live/gates/face-verify');
  }

  /// Validates all 3 Go-Live gates on the backend
  Future<ApiResponse<dynamic>> verifyEligibility() async {
    return _client.post('/api/live/gates/verify-eligibility', body: {});
  }

  // ==========================================
  // PRE-LIVE CONFIG & SETUP
  // ==========================================

  /// Fetches pre-live categories, saved setup, and eligibility status
  Future<ApiResponse<dynamic>> getPreLiveConfig({bool isDemo = false}) async {
    return _client.get(
      '/api/live/pre-live/config',
      queryParameters: isDemo ? {'demo': 'true'} : null,
    );
  }

  /// Saves broadcast title, category, and cover before launching
  Future<ApiResponse<dynamic>> setupPreLive({
    required String title,
    required String category,
    String? coverUrl,
  }) async {
    return _client.post(
      '/api/live/pre-live/setup',
      body: {
        'title': title,
        'category': category,
        if (coverUrl != null) 'coverUrl': coverUrl,
      },
    );
  }

  // ==========================================
  // HOST STUDIO (BROADCASTER)
  // ==========================================

  /// Starts live broadcast, transitions room to 'live', and acquires host Agora token
  Future<ApiResponse<dynamic>> startStudio({
    String? roomId,
    String? title,
    String? category,
    String? coverUrl,
    bool isDemo = false,
  }) async {
    return _client.post(
      '/api/live/studio/start',
      body: {
        if (roomId != null) 'roomId': roomId,
        if (title != null) 'title': title,
        if (category != null) 'category': category,
        if (coverUrl != null) 'coverUrl': coverUrl,
        if (isDemo) 'isDemo': true,
      },
    );
  }

  /// Retrieves active host studio session state and Agora credentials
  Future<ApiResponse<dynamic>> getStudioSession({
    String? roomId,
    bool isDemo = false,
  }) async {
    return _client.get(
      '/api/live/studio/session',
      queryParameters: {
        if (roomId != null) 'roomId': roomId,
        if (isDemo) 'demo': 'true',
      },
    );
  }

  /// Ends broadcast, calculates duration, points, and logs final stats
  Future<ApiResponse<dynamic>> endStudio({
    String? roomId,
    int? durationSeconds,
    bool isDemo = false,
  }) async {
    return _client.post(
      '/api/live/studio/end',
      body: {
        if (roomId != null) 'roomId': roomId,
        if (durationSeconds != null) 'durationSeconds': durationSeconds,
        if (isDemo) 'isDemo': true,
      },
    );
  }

  // ==========================================
  // VIEWER ROOM (AUDIENCE)
  // ==========================================

  /// Registers viewer presence in room and increments viewer count
  Future<ApiResponse<dynamic>> joinViewer({
    required String roomId,
    bool isDemo = false,
  }) async {
    return _client.post(
      '/api/live/viewer/join',
      body: {'roomId': roomId, if (isDemo) 'isDemo': true},
    );
  }

  /// Retrieves room, host, gifts, and audience Agora RTC token
  Future<ApiResponse<dynamic>> getViewerSession({
    required String roomId,
    bool isDemo = false,
  }) async {
    return _client.get(
      '/api/live/viewer/session',
      queryParameters: {'roomId': roomId, if (isDemo) 'demo': 'true'},
    );
  }

  /// Removes viewer presence and decrements room viewer count
  Future<ApiResponse<dynamic>> leaveViewer({required String roomId}) async {
    return _client.post('/api/live/viewer/leave', body: {'roomId': roomId});
  }

  // ==========================================
  // LIVE CHAT
  // ==========================================

  /// Retrieves recent live chat messages
  Future<ApiResponse<dynamic>> getChatMessages({required String roomId}) async {
    return _client.get(
      '/api/live/chat/messages',
      queryParameters: {'roomId': roomId},
    );
  }

  /// Sends a chat message in the live room (max 300 chars, rate-limited)
  Future<ApiResponse<dynamic>> sendChatMessage({
    required String roomId,
    required String text,
    String? emoji,
  }) async {
    return _client.post(
      '/api/live/chat/send',
      body: {
        'roomId': roomId,
        'text': text,
        if (emoji != null && emoji.isNotEmpty) 'emoji': emoji,
      },
    );
  }

  // ==========================================
  // SAFETY & MODERATION
  // ==========================================

  /// Submits safety/moderation report against host or viewer
  Future<ApiResponse<dynamic>> reportUser({
    required String roomId,
    required String reason,
    String? reportedUserId,
    String? description,
  }) async {
    return _client.post(
      '/api/live/safety/report',
      body: {
        'roomId': roomId,
        'reason': reason,
        if (reportedUserId != null) 'reportedUserId': reportedUserId,
        if (description != null) 'description': description,
      },
    );
  }

  // ==========================================
  // HOST RULES & END SCREEN
  // ==========================================

  /// Fetches canonical streaming community rules
  Future<ApiResponse<dynamic>> getRules() async {
    return _client.get('/api/live/rules');
  }

  /// Submits acknowledgement and agreement of host streaming rules
  Future<ApiResponse<dynamic>> acceptRules({String? policyVersion}) async {
    return _client.post(
      '/api/live/rules/accept',
      body: {if (policyVersion != null) 'policyVersion': policyVersion},
    );
  }

  /// Retrieves broadcast summary metrics for the end screen
  Future<ApiResponse<dynamic>> getEndScreenSummary({
    required String roomId,
    bool isDemo = false,
  }) async {
    return _client.get(
      '/api/live/end-screen/summary',
      queryParameters: {'roomId': roomId, if (isDemo) 'demo': 'true'},
    );
  }
}
