import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../api/api.dart';
import '../../models/live/live_models.dart';
import 'agora_rtc_service.dart';
import 'live_permission_service.dart';

/// Central Controller for Active Live Streaming Sessions
/// Orchestrates backend API operations, Agora RTC streaming, heartbeats, and viewer presence
class LiveSessionManager extends ChangeNotifier {
  static final LiveSessionManager instance = LiveSessionManager._internal();
  LiveSessionManager._internal();

  factory LiveSessionManager() => instance;

  final LiveApiService _apiService = LiveApiService();
  final AgoraRtcService _agoraService = AgoraRtcService.instance;
  final LivePermissionService _permissionService =
      LivePermissionService.instance;

  LiveRoomSession? _currentSession;
  LiveStreamRole? _currentRole;
  Timer? _heartbeatTimer;
  Timer? _chatPollingTimer;
  List<LiveChatMessage> _chatMessages = [];
  bool _isLoading = false;
  String? _errorMessage;

  LiveRoomSession? get currentSession => _currentSession;
  LiveStreamRole? get currentRole => _currentRole;
  List<LiveChatMessage> get chatMessages => _chatMessages;
  bool get isBroadcasting =>
      _currentSession != null &&
      _currentRole == LiveStreamRole.host &&
      _agoraService.isBroadcasting;
  bool get isWatching =>
      _currentSession != null && _currentRole == LiveStreamRole.viewer;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

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
        notifyListeners();
        return false;
      }

      final data = res.data as Map<String, dynamic>;
      _currentSession = LiveRoomSession.fromJson(data);
      _currentRole = LiveStreamRole.host;

      // Connect to Agora channel & publish host video/audio
      if (_currentSession?.agora != null) {
        await _agoraService.joinChannel(
          config: _currentSession!.agora!,
          role: LiveStreamRole.host,
        );
      }

      _startChatPolling(_currentSession!.id);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Error starting broadcast: $e';
      _isLoading = false;
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
  Future<LiveEndSummary?> endBroadcast({bool isDemo = false}) async {
    if (_currentSession == null) return null;

    final roomId = _currentSession!.id;
    _stopChatPolling();
    await _agoraService.leaveChannel();

    try {
      final res = await _apiService.endStudio(roomId: roomId, isDemo: isDemo);
      _currentSession = null;
      _currentRole = null;
      notifyListeners();

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        if (data['summary'] != null) {
          return LiveEndSummary.fromJson(
            data['summary'] as Map<String, dynamic>,
          );
        }

        // Secondary fallback to summary endpoint
        final summaryRes = await _apiService.getEndScreenSummary(
          roomId: roomId,
          isDemo: isDemo,
        );
        if (summaryRes.isSuccess && summaryRes.data != null) {
          return LiveEndSummary.fromJson(
            summaryRes.data as Map<String, dynamic>,
          );
        }
      }
    } catch (e) {
      debugPrint('[LiveSessionManager] Error ending broadcast: $e');
    }

    _currentSession = null;
    _currentRole = null;
    notifyListeners();
    return null;
  }

  /// Joins a room as an audience viewer
  Future<bool> joinAsViewer({
    required String roomId,
    bool isDemo = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
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
        notifyListeners();
        return false;
      }

      final data = sessionRes.data as Map<String, dynamic>;
      _currentSession = LiveRoomSession.fromJson(data);
      _currentRole = LiveStreamRole.viewer;

      // 3. Connect to Agora channel as audience
      if (_currentSession?.agora != null) {
        await _agoraService.joinChannel(
          config: _currentSession!.agora!,
          role: LiveStreamRole.viewer,
        );
      }

      // 4. Start heartbeat and chat polling
      _startHeartbeat(roomId);
      _startChatPolling(roomId);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Error joining live stream: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Leaves viewer room and cleans up resources
  Future<void> leaveViewer({bool isDemo = false}) async {
    if (_currentSession == null) return;

    final roomId = _currentSession!.id;
    _stopHeartbeat();
    _stopChatPolling();
    await _agoraService.leaveChannel();

    try {
      await _apiService.leaveViewer(roomId: roomId, isDemo: isDemo);
    } catch (e) {
      debugPrint('[LiveSessionManager] Error leaving viewer: $e');
    }

    _currentSession = null;
    _currentRole = null;
    _chatMessages = [];
    notifyListeners();
  }

  /// Sends a chat message to the current room
  Future<bool> sendChatMessage(String content, {String? emoji}) async {
    if (_currentSession == null || content.trim().isEmpty) return false;

    final res = await _apiService.sendChatMessage(
      roomId: _currentSession!.id,
      text: content.trim(),
      emoji: emoji,
    );

    if (res.isSuccess) {
      final msg = LiveChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        roomId: _currentSession!.id,
        senderId: 'self',
        senderNickname: 'You',
        senderAvatarUrl: null,
        senderRole: 'viewer',
        text: content.trim(),
        emoji: emoji,
        createdAt: DateTime.now(),
      );
      _chatMessages.add(msg);
      notifyListeners();
      return true;
    }
    return false;
  }

  void _startHeartbeat(String roomId) {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) async {
      try {
        await _apiService.heartbeat(roomId: roomId);
      } catch (e) {
        debugPrint('[LiveSessionManager] Heartbeat error: $e');
      }
    });
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  void _startChatPolling(String roomId) {
    _chatPollingTimer?.cancel();
    _chatPollingTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      try {
        final res = await _apiService.getChatMessages(roomId: roomId);
        if (res.isSuccess && res.data != null) {
          final data = res.data as Map<String, dynamic>;
          final rawMessages = data['messages'] as List<dynamic>? ?? [];
          _chatMessages = rawMessages
              .map((m) => LiveChatMessage.fromJson(m as Map<String, dynamic>))
              .toList();
          notifyListeners();
        }
      } catch (e) {
        debugPrint('[LiveSessionManager] Chat poll error: $e');
      }
    });
  }

  void _stopChatPolling() {
    _chatPollingTimer?.cancel();
    _chatPollingTimer = null;
  }

  @override
  void dispose() {
    _stopHeartbeat();
    _stopChatPolling();
    super.dispose();
  }
}
