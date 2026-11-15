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
      _currentSession != null && _currentRole == LiveStreamRole.host;
  bool get isWatching =>
      _currentSession != null && _currentRole == LiveStreamRole.viewer;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Starts a live broadcast studio session
  Future<bool> startBroadcast({
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

      // Connect to Agora channel
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

  /// Ends the current broadcast studio session
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

      // 3. Connect as audience subscriber
      if (_currentSession?.agora != null) {
        await _agoraService.joinChannel(
          config: _currentSession!.agora!,
          role: LiveStreamRole.viewer,
        );
      }

      _startChatPolling(roomId);
      _startHeartbeat(roomId);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Error joining live room: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Leaves the viewer room
  Future<void> leaveViewerRoom() async {
    if (_currentSession == null) return;

    final roomId = _currentSession!.id;
    _stopHeartbeat();
    _stopChatPolling();
    await _agoraService.leaveChannel();

    try {
      await _apiService.leaveViewer(roomId: roomId);
    } catch (e) {
      debugPrint('[LiveSessionManager] Error leaving room: $e');
    }

    _currentSession = null;
    _currentRole = null;
    _chatMessages = [];
    notifyListeners();
  }

  /// Sends a real-time message in the active live room
  Future<bool> sendMessage(String text, {String? emoji}) async {
    if (_currentSession == null) return false;

    try {
      final res = await _apiService.sendChatMessage(
        roomId: _currentSession!.id,
        text: text,
        emoji: emoji,
      );

      if (res.isSuccess && res.data != null) {
        final newMsg = LiveChatMessage.fromJson(
          res.data as Map<String, dynamic>,
        );
        _chatMessages.add(newMsg);
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('[LiveSessionManager] Error sending chat message: $e');
    }
    return false;
  }

  void _startHeartbeat(String roomId) {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) async {
      try {
        await _apiService.joinViewer(roomId: roomId);
      } catch (_) {}
    });
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  void _startChatPolling(String roomId) {
    _stopChatPolling();
    _fetchChat(roomId);
    _chatPollingTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _fetchChat(roomId);
    });
  }

  Future<void> _fetchChat(String roomId) async {
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
    } catch (_) {}
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
