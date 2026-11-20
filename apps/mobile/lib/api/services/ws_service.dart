import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../api_config.dart';

typedef WsEventHandler = void Function(dynamic data);

/// Real-time WebSocket Service for Mobile
/// Implements Popo Live Phase 8 (P8-P4)
/// Handles live chat, gifts, viewer counts, party seats, DM messages & notifications.
class WsService {
  static const String eventJoinLive = 'ws:join_live';
  static const String eventLeaveLive = 'ws:leave_live';
  static const String eventJoinParty = 'ws:join_party';
  static const String eventLeaveParty = 'ws:leave_party';
  static const String eventJoinDm = 'ws:join_dm';
  static const String eventTyping = 'ws:typing';
  static const String eventChatMessage = 'ws:chat_message';
  static const String eventGiftAlert = 'ws:gift_alert';
  static const String eventViewerCount = 'ws:viewer_count';
  static const String eventSeatUpdate = 'ws:seat_update';
  static const String eventNotification = 'ws:notification';
  static const String eventTypingStart = 'ws:typing_start';
  static const String eventTypingStop = 'ws:typing_stop';

  static final WsService _instance = WsService._internal();
  static WsService get instance => _instance;

  WsService._internal();

  WebSocket? _socket;
  bool _isConnecting = false;
  bool _isManuallyClosed = false;
  int _reconnectAttempts = 0;
  Timer? _reconnectTimer;
  String? _authToken;

  final Map<String, Set<WsEventHandler>> _listeners = {};
  final Set<String> _activeChannels = {};

  bool get isConnected => _socket != null && _socket!.readyState == WebSocket.open;

  /// Check whether real WebSockets are enabled via feature flag
  bool get isRealWsEnabled => ApiConfig.useRealWebsocket;

  /// Configure authentication token
  void setAuthToken(String token) {
    _authToken = token;
  }

  /// Connect to WebSocket server
  Future<void> connect({String? token}) async {
    if (token != null) _authToken = token;
    _isManuallyClosed = false;

    // In polling mode (flag false), WebSocket connection is suppressed
    if (!isRealWsEnabled) {
      return;
    }

    if (isConnected || _isConnecting) return;
    _isConnecting = true;

    try {
      final baseWsUrl = ApiConfig.baseUrl
          .replaceFirst('https://', 'wss://')
          .replaceFirst('http://', 'ws://');
      
      final url = _authToken != null
          ? '$baseWsUrl:4001?token=${Uri.encodeComponent(_authToken!)}'
          : '$baseWsUrl:4001';

      _socket = await WebSocket.connect(url).timeout(const Duration(seconds: 5));
      _isConnecting = false;
      _reconnectAttempts = 0;

      _socket!.listen(
        _onMessageReceived,
        onDone: _onSocketClosed,
        onError: _onSocketError,
        cancelOnError: true,
      );

      _emitLocal('open', null);

      // Resubscribe to existing channels
      for (final channel in _activeChannels) {
        _sendRawJoin(channel);
      }
    } catch (e) {
      _isConnecting = false;
      _scheduleReconnect();
    }
  }

  void _onMessageReceived(dynamic raw) {
    try {
      final decoded = jsonDecode(raw.toString());
      if (decoded is Map<String, dynamic>) {
        final event = decoded['event'] as String?;
        final data = decoded['data'];
        if (event != null) {
          _emitLocal(event, data);
        }
      }
    } catch (_) {}
  }

  void _onSocketClosed() {
    _isConnecting = false;
    _socket = null;
    _emitLocal('close', null);
    if (!_isManuallyClosed && _reconnectAttempts < 10) {
      _scheduleReconnect();
    }
  }

  void _onSocketError(dynamic error) {
    _isConnecting = false;
    _emitLocal('error', error);
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    final delaySeconds = (_reconnectAttempts < 5) ? (1 << _reconnectAttempts) : 30;
    _reconnectAttempts++;
    _reconnectTimer = Timer(Duration(seconds: delaySeconds), () {
      connect();
    });
  }

  // ---------------------------------------------------------------------------
  // Channel Subscriptions
  // ---------------------------------------------------------------------------

  void joinLiveRoom(String roomId) {
    _activeChannels.add('live:$roomId');
    if (isConnected) {
      send('ws:join_live', {'roomId': roomId});
    }
  }

  void leaveLiveRoom(String roomId) {
    _activeChannels.remove('live:$roomId');
    if (isConnected) {
      send('ws:leave_live', {'roomId': roomId});
    }
  }

  void joinPartyRoom(String roomId) {
    _activeChannels.add('party:$roomId');
    if (isConnected) {
      send('ws:join_party', {'roomId': roomId});
    }
  }

  void leavePartyRoom(String roomId) {
    _activeChannels.remove('party:$roomId');
    if (isConnected) {
      send('ws:leave_party', {'roomId': roomId});
    }
  }

  void joinDmConversation(String convId) {
    _activeChannels.add('dm:$convId');
    if (isConnected) {
      send('ws:join_dm', {'convId': convId});
    }
  }

  void sendTyping(String convId, {bool isTyping = true}) {
    if (isConnected) {
      send('ws:typing', {'convId': convId, 'isTyping': isTyping});
    }
  }

  void sendChatMessage(String channel, String messageText, {String? emoji}) {
    if (isConnected) {
      send('ws:chat_message', {
        'channel': channel,
        'messageText': messageText,
        'emoji': emoji,
      });
    }
  }

  void _sendRawJoin(String channel) {
    if (channel.startsWith('live:')) {
      send('ws:join_live', {'roomId': channel.substring(5)});
    } else if (channel.startsWith('party:')) {
      send('ws:join_party', {'roomId': channel.substring(6)});
    } else if (channel.startsWith('dm:')) {
      send('ws:join_dm', {'convId': channel.substring(3)});
    }
  }

  bool send(String event, dynamic data) {
    if (!isConnected) return false;
    try {
      final payload = jsonEncode({
        'event': event,
        'data': data,
        'timestamp': DateTime.now().toIso8601String(),
      });
      _socket!.add(payload);
      return true;
    } catch (_) {
      return false;
    }
  }

  void on(String event, WsEventHandler handler) {
    _listeners.putIfAbsent(event, () => <WsEventHandler>{}).add(handler);
  }

  void off(String event, WsEventHandler handler) {
    _listeners[event]?.remove(handler);
  }

  void _emitLocal(String event, dynamic data) {
    final handlers = _listeners[event];
    if (handlers != null) {
      for (final h in handlers.toList()) {
        try {
          h(data);
        } catch (_) {}
      }
    }
  }

  void disconnect() {
    _isManuallyClosed = true;
    _reconnectTimer?.cancel();
    _socket?.close();
    _socket = null;
    _activeChannels.clear();
  }
}
