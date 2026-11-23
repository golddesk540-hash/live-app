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

  /// Saves broadcast title, category, tags, and cover before launching
  Future<ApiResponse<dynamic>> setupPreLive({
    required String title,
    required String categoryId,
    String? category,
    String? coverUrl,
    List<String>? tags,
  }) async {
    return _client.post(
      '/api/live/pre-live/setup',
      body: {
        'title': title,
        'categoryId': categoryId,
        if (category != null) 'category': category,
        if (coverUrl != null) 'coverUrl': coverUrl,
        if (tags != null) 'tags': tags,
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
      '/api/live/rooms/$roomId/join',
      body: {if (isDemo) 'isDemo': true},
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
  Future<ApiResponse<dynamic>> leaveViewer({
    required String roomId,
    bool isDemo = false,
  }) async {
    return _client.post(
      '/api/live/rooms/$roomId/leave',
      body: {if (isDemo) 'isDemo': true},
    );
  }

  /// Sends periodic viewer heartbeat to keep presence active
  Future<ApiResponse<dynamic>> heartbeat({
    required String roomId,
    bool isDemo = false,
  }) async {
    return _client.post(
      '/api/live/rooms/$roomId/heartbeat',
      body: {if (isDemo) 'isDemo': true},
    );
  }

  /// Fetches active viewers and current distinct viewer count from PostgreSQL
  Future<ApiResponse<dynamic>> getViewers({
    required String roomId,
    int limit = 50,
  }) async {
    return _client.get(
      '/api/live/rooms/$roomId/viewers',
      queryParameters: {'limit': limit.toString()},
    );
  }

  // ==========================================
  // LIVE CHAT
  // ==========================================

  /// Retrieves recent live chat messages with optional pagination
  Future<ApiResponse<dynamic>> getChatMessages({
    required String roomId,
    String? after,
    int limit = 50,
    bool isDemo = false,
  }) async {
    return _client.get(
      '/api/live/chat/messages',
      queryParameters: {
        'roomId': roomId,
        if (after != null) 'after': after,
        'limit': limit.toString(),
        if (isDemo) 'preview': 'demo',
      },
    );
  }

  /// Sends a chat message in the live room (max 300 chars, rate-limited)
  Future<ApiResponse<dynamic>> sendChatMessage({
    required String roomId,
    required String text,
    String? emoji,
    String? senderRole,
  }) async {
    return _client.post(
      '/api/live/chat/send',
      body: {
        'roomId': roomId,
        'text': text,
        if (emoji != null && emoji.isNotEmpty) 'emoji': emoji,
        if (senderRole != null) 'senderRole': senderRole,
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
    required String reportedUserId,
    String? reportedNickname,
    String? description,
  }) async {
    return _client.post(
      '/api/live/safety/report',
      body: {
        'roomId': roomId,
        'reason': reason,
        'reportedUserId': reportedUserId,
        if (reportedNickname != null) 'reportedNickname': reportedNickname,
        if (description != null && description.isNotEmpty)
          'description': description,
      },
    );
  }

  /// Blocks selected user in live room
  Future<ApiResponse<dynamic>> blockUser({
    required String targetUserId,
    String? targetNickname,
    String? roomId,
  }) async {
    return _client.post(
      '/api/live/safety/block',
      body: {
        'targetUserId': targetUserId,
        if (targetNickname != null) 'targetNickname': targetNickname,
        if (roomId != null) 'roomId': roomId,
      },
    );
  }

  /// Unblocks selected user
  Future<ApiResponse<dynamic>> unblockUser({
    required String targetUserId,
  }) async {
    return _client.delete(
      '/api/live/safety/block',
      queryParameters: {'targetUserId': targetUserId},
    );
  }

  /// Fetches currently blocked user IDs
  Future<ApiResponse<dynamic>> getBlockedUsers() async {
    return _client.get('/api/live/safety/block');
  }

  /// Mutes participant in live room (viewer_local or room_global)
  Future<ApiResponse<dynamic>> muteUser({
    required String roomId,
    required String targetUserId,
    String? targetNickname,
    String muteType = 'viewer_local',
    String requesterRole = 'viewer',
  }) async {
    return _client.post(
      '/api/live/safety/mute',
      body: {
        'roomId': roomId,
        'targetUserId': targetUserId,
        if (targetNickname != null) 'targetNickname': targetNickname,
        'muteType': muteType,
        'requesterRole': requesterRole,
      },
    );
  }

  /// Unmutes participant in live room
  Future<ApiResponse<dynamic>> unmuteUser({
    required String roomId,
    required String targetUserId,
    String muteType = 'viewer_local',
  }) async {
    return _client.delete(
      '/api/live/safety/mute',
      queryParameters: {
        'roomId': roomId,
        'targetUserId': targetUserId,
        'muteType': muteType,
      },
    );
  }

  /// Fetches list of active mutes for room
  Future<ApiResponse<dynamic>> getMutedUsers({required String roomId}) async {
    return _client.get(
      '/api/live/safety/mute',
      queryParameters: {'roomId': roomId},
    );
  }

  // ==========================================
  // HOST RULES & POLICY
  // ==========================================

  /// Fetches canonical streaming community rules
  Future<ApiResponse<dynamic>> getRules() async {
    return _client.get('/api/live/rules');
  }

  /// Checks rules acceptance status
  Future<ApiResponse<dynamic>> getRulesStatus({
    String? userId,
    String? hostId,
  }) async {
    return _client.get(
      '/api/live/rules/status',
      queryParameters: {
        if (userId != null) 'userId': userId,
        if (hostId != null) 'hostId': hostId,
      },
    );
  }

  /// Submits acknowledgement and agreement of host streaming rules
  Future<ApiResponse<dynamic>> acceptRules({
    String? policyVersion,
    bool acknowledgedCheckbox = true,
  }) async {
    return _client.post(
      '/api/live/rules/accept',
      body: {
        if (policyVersion != null) 'policyVersion': policyVersion,
        'acknowledgedCheckbox': acknowledgedCheckbox,
      },
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

  /// Terminates broadcast session with explicit duration tracking
  Future<ApiResponse<dynamic>> endBroadcastSession({
    required String roomId,
    int? durationSeconds,
    bool isDemo = false,
  }) async {
    return _client.post(
      '/api/live/end-screen/end',
      body: {
        'roomId': roomId,
        if (durationSeconds != null) 'durationSeconds': durationSeconds,
        if (isDemo) 'isDemo': true,
      },
    );
  }

  /// Retrieves host broadcast session history and aggregated KPIs
  Future<ApiResponse<dynamic>> getLiveHistory({
    String filter = 'all',
    bool isDemo = false,
  }) async {
    return _client.get(
      '/api/live/center/history',
      queryParameters: {'filter': filter, if (isDemo) 'preview': 'demo'},
    );
  }

  // ==========================================
  // VIRTUAL GIFTS & WALLET (Phase B5)
  // ==========================================

  /// Sends a virtual gift to the broadcaster of a live room
  Future<ApiResponse<dynamic>> sendGift({
    required String roomId,
    required String giftId,
    int quantity = 1,
    String? idempotencyKey,
  }) async {
    return _client.post(
      '/api/live/rooms/$roomId/gift',
      body: {
        'giftId': giftId,
        'quantity': quantity,
        if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Retrieves coin balance of authenticated user
  Future<ApiResponse<dynamic>> getCoinBalance() async {
    return _client.get('/api/economy/coins/balance');
  }
}
