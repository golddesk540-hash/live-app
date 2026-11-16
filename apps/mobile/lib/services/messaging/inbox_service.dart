import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../api/api_client.dart';
import '../../api/api_config.dart';
import '../../api/token_storage.dart';
import '../../screens/inbox/inbox_screen.dart';

/// Real-time message event payload
class RealtimeMessageEvent {
  final String eventType;
  final String conversationId;
  final String senderId;
  final Map<String, dynamic> payload;

  RealtimeMessageEvent({
    required this.eventType,
    required this.conversationId,
    required this.senderId,
    required this.payload,
  });
}

/// Centralized service for Popo Live Inbox, 1:1 Direct Messaging & Real-Time Sync
class InboxService {
  InboxService._();
  static final InboxService instance = InboxService._();

  http.Client? _sseClient;
  StreamSubscription? _sseSubscription;
  final _eventController = StreamController<RealtimeMessageEvent>.broadcast();

  Stream<RealtimeMessageEvent> get onMessageEvent => _eventController.stream;

  /// Fetches authoritative conversation list from backend
  Future<List<InboxConversationModel>> fetchConversations() async {
    final response = await ApiClient.instance.get('/api/inbox/conversations');

    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load conversations.');
    }

    final data = response.data['data'] as Map<String, dynamic>?;
    final convList = (data?['conversations'] as List<dynamic>?) ?? [];

    return convList.map((c) {
      final opp = c['opponent'] as Map<String, dynamic>? ?? {};
      final ringHex = opp['ringColorHex'] as String? ?? '#FF1A6C';
      Color ringColor = const Color(0xFFFF1A6C);
      try {
        final clean = ringHex.replaceAll('#', '');
        ringColor = Color(int.parse('FF$clean', radix: 16));
      } catch (_) {}

      final user = InboxUserModel(
        id: opp['id']?.toString() ?? '',
        name: opp['name']?.toString() ?? 'Popo User',
        poppoId: opp['poppoId']?.toString() ?? '',
        status: opp['status']?.toString() ?? 'offline',
        lastSeen: opp['lastSeen']?.toString() ?? 'Offline',
        ringColor: ringColor,
        isOfficial: opp['isOfficial'] == true,
      );

      return InboxConversationModel(
        id: c['id']?.toString() ?? '',
        user: user,
        lastMessage: c['lastMessage']?.toString() ?? '',
        lastTime: c['lastTime']?.toString() ?? '',
        unreadCount: int.tryParse(c['unreadCount']?.toString() ?? '0') ?? 0,
        isPinned: c['isPinned'] == true,
        messages: [],
      );
    }).toList();
  }

  /// Fetches unread message & notification summary
  Future<Map<String, int>> fetchInboxSummary() async {
    final response = await ApiClient.instance.get('/api/inbox/summary');
    if (!response.isSuccess || response.data == null) {
      return {'unreadMessages': 0, 'unreadNotices': 0, 'unreadNotifications': 0, 'total': 0};
    }
    final d = response.data['data'] as Map<String, dynamic>? ?? {};
    return {
      'unreadMessages': int.tryParse(d['unreadMessagesCount']?.toString() ?? '0') ?? 0,
      'unreadNotices': int.tryParse(d['unreadNoticesCount']?.toString() ?? '0') ?? 0,
      'unreadNotifications': int.tryParse(d['unreadNotificationsCount']?.toString() ?? '0') ?? 0,
      'total': int.tryParse(d['totalUnreadCount']?.toString() ?? '0') ?? 0,
    };
  }

  /// Fetches message history for a conversation
  Future<List<InboxMessageModel>> fetchMessages(String conversationId) async {
    final response = await ApiClient.instance.get('/api/messages/$conversationId');

    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to load messages.');
    }

    final data = response.data['data'] as Map<String, dynamic>?;
    final msgList = (data?['messages'] as List<dynamic>?) ?? [];

    return msgList.map((m) {
      final isMine = m['isMine'] == true;
      return InboxMessageModel(
        id: m['id']?.toString() ?? '',
        senderId: isMine ? 'me' : (m['senderId']?.toString() ?? ''),
        text: m['text']?.toString() ?? '',
        time: m['time']?.toString() ?? '',
      );
    }).toList();
  }

  /// Sends a direct message with client-side deduplication and server idempotency
  Future<InboxMessageModel> sendMessage({
    required String recipientId,
    required String text,
    String? conversationId,
    String? idempotencyKey,
  }) async {
    final idemKey = idempotencyKey ??
        'msg_${DateTime.now().millisecondsSinceEpoch}_${text.hashCode}';

    final body = {
      'recipientId': recipientId,
      'text': text.trim(),
      if (conversationId != null) 'conversationId': conversationId,
      'idempotencyKey': idemKey,
    };

    final response = await ApiClient.instance.post('/api/messages/send', body: body);

    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to deliver message.');
    }

    final data = response.data['data'] as Map<String, dynamic>?;
    final msg = data?['message'] as Map<String, dynamic>? ?? {};

    return InboxMessageModel(
      id: msg['id']?.toString() ?? '',
      senderId: 'me',
      text: msg['text']?.toString() ?? text,
      time: msg['time']?.toString() ?? 'Just now',
    );
  }

  /// Marks all incoming messages in a conversation as read
  Future<void> markConversationRead(String conversationId) async {
    await ApiClient.instance.post('/api/messages/$conversationId/read');
  }

  /// Starts or opens a conversation with a user
  Future<Map<String, dynamic>> startConversation(String recipientUserId) async {
    final response = await ApiClient.instance.post(
      '/api/inbox/conversations',
      body: {'recipientUserId': recipientUserId},
    );

    if (!response.isSuccess || response.data == null) {
      throw Exception(response.error ?? 'Failed to initiate conversation.');
    }

    return (response.data['data'] as Map<String, dynamic>?) ?? {};
  }

  /// Subscribes to real-time SSE messaging events
  Future<void> subscribeRealtimeEvents() async {
    disconnectRealtimeEvents();

    try {
      final sessionToken = await TokenStorage.getSessionToken();
      final uri = ApiClient.instance.buildUri('/api/inbox/events');

      _sseClient = http.Client();
      final request = http.Request('GET', uri);
      request.headers['Accept'] = 'text/event-stream';
      request.headers['Cache-Control'] = 'no-cache';
      if (sessionToken != null && sessionToken.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $sessionToken';
        request.headers['Cookie'] = 'poppo_session=$sessionToken';
      }

      final response = await _sseClient!.send(request);
      if (response.statusCode != 200) return;

      String buffer = '';
      _sseSubscription = response.stream.transform(utf8.decoder).listen((chunk) {
        buffer += chunk;
        final lines = buffer.split('\n\n');
        buffer = lines.removeLast();

        for (final block in lines) {
          _processSseBlock(block);
        }
      }, onError: (err) {
        // Safe reconnection after delay
        Future.delayed(const Duration(seconds: 4), () {
          if (_sseClient != null) subscribeRealtimeEvents();
        });
      });
    } catch (_) {}
  }

  void _processSseBlock(String block) {
    String? eventType;
    String? dataString;

    for (final line in block.split('\n')) {
      if (line.startsWith('event: ')) {
        eventType = line.substring(7).trim();
      } else if (line.startsWith('data: ')) {
        dataString = line.substring(6).trim();
      }
    }

    if (eventType != null && dataString != null && dataString.isNotEmpty) {
      try {
        final parsed = jsonDecode(dataString) as Map<String, dynamic>;
        _eventController.add(RealtimeMessageEvent(
          eventType: eventType,
          conversationId: parsed['conversationId']?.toString() ?? '',
          senderId: parsed['senderId']?.toString() ?? '',
          payload: parsed['payload'] as Map<String, dynamic>? ?? parsed,
        ));
      } catch (_) {}
    }
  }

  /// Cleans up SSE listeners
  void disconnectRealtimeEvents() {
    _sseSubscription?.cancel();
    _sseSubscription = null;
    _sseClient?.close();
    _sseClient = null;
  }
}
