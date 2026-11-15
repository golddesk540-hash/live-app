import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../api/api.dart';
import '../../models/live/live_models.dart';
import 'agora_rtc_service.dart';
import 'live_permission_service.dart';

/// Central Controller for Active Live Streaming Sessions
/// Orchestrates backend API operations, Agora RTC streaming, heartbeats,
/// viewer presence, live chat polling, and user safety/moderation.
class LiveSessionManager extends ChangeNotifier {
  static final LiveSessionManager instance = LiveSessionManager._internal();
  LiveSessionManager._internal() {
    _initConnectionStateListener();
  }

  factory LiveSessionManager() => instance;

  final LiveApiService _apiService = LiveApiService();
  final AgoraRtcService _agoraService = AgoraRtcService.instance;
  final LivePermissionService _permissionService =
      LivePermissionService.instance;

  LiveRoomSession? _currentSession;
  LiveStreamRole? _currentRole;
  LiveSessionState _sessionState = LiveSessionState.idle;
  Timer? _heartbeatTimer;
  Timer? _chatPollingTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 3;

  /// Callback fired when viewer detects host has ended the room
  void Function()? onStreamEndedByHost;

  List<LiveChatMessage> _chatMessages = [];
  final Set<String> _seenMessageIds = {};
  final Set<String> _blockedUserIds = {};
  final Set<String> _mutedUserIds = {};

  String? _lastMessageTimestamp;
  bool _isChatLoading = false;
  String? _chatError;
  bool _isLoading = false;
  String? _errorMessage;

  LiveRoomSession? get currentSession => _currentSession;
  LiveStreamRole? get currentRole => _currentRole;
  LiveSessionState get sessionState => _sessionState;
  List<LiveChatMessage> get chatMessages => List.unmodifiable(_chatMessages);
  Set<String> get blockedUserIds => Set.unmodifiable(_blockedUserIds);
  Set<String> get mutedUserIds => Set.unmodifiable(_mutedUserIds);
  bool get isChatLoading => _isChatLoading;
  String? get chatError => _chatError;

  bool get isBroadcasting =>
      _currentSession != null &&
      _currentRole == LiveStreamRole.host &&
      _agoraService.isBroadcasting;
  bool get isWatching =>
      _currentSession != null && _currentRole == LiveStreamRole.viewer;
  bool get isLoading => _isLoading;
  bool get isEnding => _sessionState == LiveSessionState.ending;
  bool get isEnded => _sessionState == LiveSessionState.ended;
  String? get errorMessage => _errorMessage;

  bool isUserBlocked(String userId) => _blockedUserIds.contains(userId);
  bool isUserMuted(String userId) => _mutedUserIds.contains(userId);

  void resetSessionState() {
    _sessionState = LiveSessionState.idle;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();
  }

  void _initConnectionStateListener() {
    _agoraService.onConnectionStateChanged = (status, message) {
      if (_sessionState == LiveSessionState.active &&
          (status == LiveConnectionStatus.disconnected ||
              status == LiveConnectionStatus.error)) {
        _handleNetworkDisconnect();
      }
    };
  }

  void _handleNetworkDisconnect() {
    if (_sessionState != LiveSessionState.active &&
        _sessionState != LiveSessionState.disconnected) {
      return;
    }

    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint(
        '[LiveSessionManager] Max reconnection attempts ($_maxReconnectAttempts) reached. Marking session failed.',
      );
      _sessionState = LiveSessionState.failed;
      _errorMessage =
          'Network connection lost. Please check your internet connection.';
      notifyListeners();
      return;
    }

    _sessionState = LiveSessionState.disconnected;
    _reconnectAttempts++;
    debugPrint(
      '[LiveSessionManager] Connection interrupted. Reconnect attempt $_reconnectAttempts/$_maxReconnectAttempts in ${_reconnectAttempts * 2}s...',
    );
    notifyListeners();

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(
      Duration(seconds: _reconnectAttempts * 2),
      () async {
        if (_currentSession?.agora != null && _currentRole != null) {
          final success = await _agoraService.joinChannel(
            config: _currentSession!.agora!,
            role: _currentRole!,
          );
          if (success) {
            debugPrint(
              '[LiveSessionManager] Successfully reconnected to RTC channel.',
            );
            _sessionState = LiveSessionState.active;
            _reconnectAttempts = 0;
            _errorMessage = null;
            notifyListeners();
          } else {
            _handleNetworkDisconnect();
          }
        }
      },
    );
  }

  /// Starts a live broadcast studio session and publishes host video/audio
  Future<bool> startBroadcast({
    String? roomId,
    String? title,
    String? category,
    String? coverUrl,
    bool isDemo = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _sessionState = LiveSessionState.connecting;
    notifyListeners();

    try {
      final res = await _apiService.startStudio(
        roomId: roomId,
        title: title,
        category: category,
        coverUrl: coverUrl,
        isDemo: isDemo,
      );

      if (!res.isSuccess || res.data == null) {
        _errorMessage = res.errorMessage ?? 'Failed to start broadcast';
        _isLoading = false;
        _sessionState = LiveSessionState.failed;
        notifyListeners();
        return false;
      }

      final data = res.data as Map<String, dynamic>;
      _currentSession = LiveRoomSession.fromJson(data);
      _currentRole = LiveStreamRole.host;
      _reconnectAttempts = 0;

      // Connect to Agora channel & publish host video/audio
      if (_currentSession?.agora != null) {
        await _agoraService.joinChannel(
          config: _currentSession!.agora!,
          role: LiveStreamRole.host,
        );
      }

      await loadSafetyFilters(_currentSession!.id);
      _startChatPolling(_currentSession!.id);
      _isLoading = false;
      _sessionState = LiveSessionState.active;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Error starting broadcast: $e';
      _isLoading = false;
      _sessionState = LiveSessionState.failed;
      notifyListeners();
      return false;
    }
  }

  /// Synchronizes active host studio session with backend
  Future<void> refreshStudioSession({
    String? roomId,
    bool isDemo = false,
  }) async {
    try {
      final res = await _apiService.getStudioSession(
        roomId: roomId ?? _currentSession?.id,
        isDemo: isDemo,
      );

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        _currentSession = LiveRoomSession.fromJson(data);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('[LiveSessionManager] Session sync warning: $e');
    }
  }

  /// Mutes or unmutes host camera video track
  Future<void> muteVideo(bool mute) async {
    await _agoraService.muteLocalVideo(mute);
    notifyListeners();
  }

  /// Mutes or unmutes host microphone audio track
  Future<void> muteAudio(bool mute) async {
    await _agoraService.muteLocalAudio(mute);
    notifyListeners();
  }

  /// Switches between front and rear cameras
  Future<void> switchCamera() async {
    await _agoraService.switchCamera();
    notifyListeners();
  }

  /// Ends the current broadcast studio session and frees all Agora/hardware resources
  /// Includes accidental and duplicate termination protection
  Future<LiveEndSummary?> endBroadcast({bool isDemo = false}) async {
    if (_sessionState == LiveSessionState.ending ||
        _sessionState == LiveSessionState.ended) {
      debugPrint(
        '[LiveSessionManager] Duplicate endBroadcast call ignored (state: $_sessionState).',
      );
      return null;
    }

    if (_currentSession == null) {
      _sessionState = LiveSessionState.idle;
      notifyListeners();
      return null;
    }

    final roomId = _currentSession!.id;
    _sessionState = LiveSessionState.ending;
    _isLoading = true;
    notifyListeners();

    _reconnectTimer?.cancel();
    _stopChatPolling();
    _stopHeartbeat();
    _resetChatState();

    // Release camera, mic and Agora channel resources
    await _agoraService.releaseHardwareResources();

    LiveEndSummary? summary;
    try {
      final res = await _apiService.endStudio(roomId: roomId, isDemo: isDemo);
      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        if (data['summary'] != null) {
          summary = LiveEndSummary.fromJson(
            data['summary'] as Map<String, dynamic>,
          );
        }
      }

      // Enrich or fallback with end-screen summary endpoint
      if (summary == null ||
          (summary.newFollowers == 0 && summary.totalViewers == 0)) {
        final summaryRes = await _apiService.getEndScreenSummary(
          roomId: roomId,
          isDemo: isDemo,
        );
        if (summaryRes.isSuccess && summaryRes.data != null) {
          final summaryData = summaryRes.data as Map<String, dynamic>;
          summary = LiveEndSummary.fromJson(summaryData);
        }
      }
    } catch (e) {
      debugPrint('[LiveSessionManager] Error ending broadcast: $e');
    }

    _currentSession = null;
    _currentRole = null;
    _isLoading = false;
    _sessionState = LiveSessionState.ended;
    notifyListeners();
    return summary;
  }

  /// Joins a room as an audience viewer
  Future<bool> joinAsViewer({
    required String roomId,
    bool isDemo = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _sessionState = LiveSessionState.connecting;
    notifyListeners();

    try {
      // 1. Register presence
      await _apiService.joinViewer(roomId: roomId, isDemo: isDemo);

      // 2. Fetch session and audience Agora credentials
      final sessionRes = await _apiService.getViewerSession(
        roomId: roomId,
        isDemo: isDemo,
      );

      if (!sessionRes.isSuccess || sessionRes.data == null) {
        _errorMessage = sessionRes.errorMessage ?? 'Failed to join live room';
        _isLoading = false;
        _sessionState = LiveSessionState.failed;
        notifyListeners();
        return false;
      }

      final data = sessionRes.data as Map<String, dynamic>;
      _currentSession = LiveRoomSession.fromJson(data);
      _currentRole = LiveStreamRole.viewer;
      _reconnectAttempts = 0;

      // 3. Connect to Agora channel as audience
      if (_currentSession?.agora != null) {
        await _agoraService.joinChannel(
          config: _currentSession!.agora!,
          role: LiveStreamRole.viewer,
        );
      }

      // 4. Load safety lists, start heartbeat and chat polling
      await loadSafetyFilters(roomId);
      _startHeartbeat(roomId);
      _startChatPolling(roomId);

      _isLoading = false;
      _sessionState = LiveSessionState.active;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Error joining live stream: $e';
      _isLoading = false;
      _sessionState = LiveSessionState.failed;
      notifyListeners();
      return false;
    }
  }

  /// Leaves viewer room and cleans up resources
  Future<void> leaveViewer({bool isDemo = false}) async {
    if (_currentSession == null) {
      _sessionState = LiveSessionState.idle;
      return;
    }

    final roomId = _currentSession!.id;
    _sessionState = LiveSessionState.ending;
    notifyListeners();

    _reconnectTimer?.cancel();
    _stopHeartbeat();
    _stopChatPolling();
    _resetChatState();
    await _agoraService.releaseHardwareResources();

    try {
      await _apiService.leaveViewer(roomId: roomId, isDemo: isDemo);
    } catch (e) {
      debugPrint('[LiveSessionManager] Error leaving viewer: $e');
    }

    _currentSession = null;
    _currentRole = null;
    _sessionState = LiveSessionState.ended;
    notifyListeners();
  }

  // ==========================================
  // SAFETY & MODERATION FILTERS
  // ==========================================

  /// Loads active blocklist and room mute list to filter messages
  Future<void> loadSafetyFilters(String roomId) async {
    try {
      // 1. Load user blocklist
      final blockRes = await _apiService.getBlockedUsers();
      if (blockRes.isSuccess && blockRes.data != null) {
        final data = blockRes.data as Map<String, dynamic>;
        final rawBlocks = data['blockedUserIds'] as List<dynamic>? ?? [];
        _blockedUserIds.clear();
        _blockedUserIds.addAll(rawBlocks.map((id) => id.toString()));
      }

      // 2. Load active mutes for room
      final muteRes = await _apiService.getMutedUsers(roomId: roomId);
      if (muteRes.isSuccess && muteRes.data != null) {
        final data = muteRes.data as Map<String, dynamic>;
        final rawMutes = data['mutedUserIds'] as List<dynamic>? ?? [];
        _mutedUserIds.clear();
        _mutedUserIds.addAll(rawMutes.map((id) => id.toString()));
      }

      _filterExistingMessages();
    } catch (e) {
      debugPrint('[LiveSessionManager] Error loading safety filters: $e');
    }
  }

  void _filterExistingMessages() {
    _chatMessages.removeWhere(
      (m) =>
          _blockedUserIds.contains(m.senderId) ||
          _mutedUserIds.contains(m.senderId),
    );
    notifyListeners();
  }

  /// Mutes a user (viewer_local for audience, room_global for host)
  Future<LiveMuteResult> muteUser({
    required String targetUserId,
    String? targetNickname,
    String muteType = 'viewer_local',
  }) async {
    final roomId = _currentSession?.id ?? '880219';
    final role = _currentRole == LiveStreamRole.host ? 'host' : 'viewer';

    final res = await _apiService.muteUser(
      roomId: roomId,
      targetUserId: targetUserId,
      targetNickname: targetNickname,
      muteType: muteType,
      requesterRole: role,
    );

    if (res.isSuccess && res.data != null) {
      _mutedUserIds.add(targetUserId);
      _filterExistingMessages();
      return LiveMuteResult.fromJson(res.data as Map<String, dynamic>);
    }

    return LiveMuteResult(
      success: false,
      muted: false,
      targetUserId: targetUserId,
      muteType: muteType,
      error: res.errorMessage ?? 'Failed to mute participant',
    );
  }

  /// Unmutes a user
  Future<bool> unmuteUser({
    required String targetUserId,
    String muteType = 'viewer_local',
  }) async {
    final roomId = _currentSession?.id ?? '880219';
    final res = await _apiService.unmuteUser(
      roomId: roomId,
      targetUserId: targetUserId,
      muteType: muteType,
    );

    if (res.isSuccess) {
      _mutedUserIds.remove(targetUserId);
      notifyListeners();
      return true;
    }
    return false;
  }

  /// Blocks a user and filters their messages out
  Future<LiveBlockResult> blockUser({
    required String targetUserId,
    String? targetNickname,
  }) async {
    final res = await _apiService.blockUser(
      targetUserId: targetUserId,
      targetNickname: targetNickname,
      roomId: _currentSession?.id,
    );

    if (res.isSuccess && res.data != null) {
      _blockedUserIds.add(targetUserId);
      _filterExistingMessages();
      return LiveBlockResult.fromJson(res.data as Map<String, dynamic>);
    }

    return LiveBlockResult(
      success: false,
      blocked: false,
      targetUserId: targetUserId,
      error: res.errorMessage ?? 'Failed to block user',
    );
  }

  /// Unblocks a user
  Future<bool> unblockUser({required String targetUserId}) async {
    final res = await _apiService.unblockUser(targetUserId: targetUserId);
    if (res.isSuccess) {
      _blockedUserIds.remove(targetUserId);
      notifyListeners();
      return true;
    }
    return false;
  }

  /// Submits safety/abuse report with verified reason
  Future<LiveReportResult> reportUser({
    required String reportedUserId,
    required String reason,
    String? reportedNickname,
    String? description,
  }) async {
    final roomId = _currentSession?.id ?? '880219';
    final res = await _apiService.reportUser(
      roomId: roomId,
      reason: reason,
      reportedUserId: reportedUserId,
      reportedNickname: reportedNickname,
      description: description,
    );

    if (res.isSuccess && res.data != null) {
      return LiveReportResult.fromJson(res.data as Map<String, dynamic>);
    }

    return LiveReportResult(
      success: false,
      error: res.errorMessage ?? 'Failed to submit report',
    );
  }

  // ==========================================
  // LIVE CHAT & POLLED SYNCHRONIZATION
  // ==========================================

  /// Sends a chat message to the current room
  Future<bool> sendChatMessage(
    String content, {
    String? emoji,
    String? senderRole,
  }) async {
    if (_currentSession == null) return false;
    final trimmed = content.trim();
    if (trimmed.isEmpty || trimmed.length > 300) return false;

    final role =
        senderRole ?? (_currentRole == LiveStreamRole.host ? 'host' : 'viewer');

    final res = await _apiService.sendChatMessage(
      roomId: _currentSession!.id,
      text: trimmed,
      emoji: emoji,
      senderRole: role,
    );

    if (res.isSuccess && res.data != null) {
      final data = res.data as Map<String, dynamic>;
      LiveChatMessage? created;
      if (data['message'] != null && data['message'] is Map<String, dynamic>) {
        created = LiveChatMessage.fromJson(
          data['message'] as Map<String, dynamic>,
        );
      }

      created ??= LiveChatMessage(
        id: 'self_${DateTime.now().millisecondsSinceEpoch}',
        roomId: _currentSession!.id,
        senderId: 'self',
        senderNickname: role == 'host' ? 'Host' : 'You',
        senderAvatarUrl: null,
        senderRole: role,
        text: trimmed,
        emoji: emoji,
        createdAt: DateTime.now(),
      );

      if (!_seenMessageIds.contains(created.id)) {
        _seenMessageIds.add(created.id);
        _chatMessages.add(created);
        _lastMessageTimestamp = created.createdAt.toIso8601String();
        notifyListeners();
      }
      return true;
    }
    return false;
  }

  void _startHeartbeat(String roomId) {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        final res = await _apiService.heartbeat(roomId: roomId);
        if (!res.isSuccess) {
          if (res.statusCode == 404 ||
              (res.errorMessage != null &&
                  res.errorMessage!.toLowerCase().contains('ended'))) {
            await _handleHostEndedStream();
          }
        }
      } catch (e) {
        debugPrint('[LiveSessionManager] Heartbeat error: $e');
      }
    });
  }

  /// Called when viewer detects that the live stream has been terminated by the host
  Future<void> _handleHostEndedStream() async {
    if (_currentRole == LiveStreamRole.viewer &&
        (_sessionState == LiveSessionState.active ||
            _sessionState == LiveSessionState.disconnected)) {
      debugPrint(
        '[LiveSessionManager] Host has ended broadcast stream. Cleaning up viewer resources.',
      );
      _sessionState = LiveSessionState.ended;
      _reconnectTimer?.cancel();
      _stopHeartbeat();
      _stopChatPolling();
      await _agoraService.releaseHardwareResources();
      onStreamEndedByHost?.call();
      notifyListeners();
    }
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  void _startChatPolling(String roomId) {
    _chatPollingTimer?.cancel();

    // Initial immediate fetch
    _fetchNewChatMessages(roomId, isInitial: true);

    // Synchronize every 2.5 seconds
    _chatPollingTimer = Timer.periodic(
      const Duration(milliseconds: 2500),
      (_) => _fetchNewChatMessages(roomId),
    );
  }

  Future<void> _fetchNewChatMessages(
    String roomId, {
    bool isInitial = false,
  }) async {
    try {
      if (isInitial) {
        _isChatLoading = true;
        _chatError = null;
      }

      final res = await _apiService.getChatMessages(
        roomId: roomId,
        after: isInitial ? null : _lastMessageTimestamp,
        limit: 50,
      );

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final rawMessages = data['messages'] as List<dynamic>? ?? [];

        bool hasNew = false;
        for (final item in rawMessages) {
          if (item is Map<String, dynamic>) {
            final msg = LiveChatMessage.fromJson(item);
            if (!_seenMessageIds.contains(msg.id)) {
              _seenMessageIds.add(msg.id);
              if (!_blockedUserIds.contains(msg.senderId) &&
                  !_mutedUserIds.contains(msg.senderId)) {
                _chatMessages.add(msg);
                hasNew = true;
              }
              _lastMessageTimestamp = msg.createdAt.toIso8601String();
            }
          }
        }

        if (hasNew || isInitial) {
          _chatMessages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
          _isChatLoading = false;
          notifyListeners();
        }
      } else if (isInitial) {
        _chatError = res.errorMessage ?? 'Failed to load messages';
        _isChatLoading = false;
        notifyListeners();
      }
    } catch (e) {
      if (isInitial) {
        _chatError = 'Chat connection error: $e';
        _isChatLoading = false;
        notifyListeners();
      }
      debugPrint('[LiveSessionManager] Chat poll error: $e');
    }
  }

  void _stopChatPolling() {
    _chatPollingTimer?.cancel();
    _chatPollingTimer = null;
  }

  void _resetChatState() {
    _chatMessages = [];
    _seenMessageIds.clear();
    _blockedUserIds.clear();
    _mutedUserIds.clear();
    _lastMessageTimestamp = null;
    _isChatLoading = false;
    _chatError = null;
  }

  @override
  void dispose() {
    _reconnectTimer?.cancel();
    _stopHeartbeat();
    _stopChatPolling();
    _resetChatState();
    super.dispose();
  }
}
