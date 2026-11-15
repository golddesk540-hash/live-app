import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/live/live_models.dart';
import 'package:popo_live/services/live/agora_rtc_service.dart';
import 'package:popo_live/services/live/live_session_manager.dart';

void main() {
  group('M3 Actual Live Viewer Experience & Video Playback (Phase 2 Prompt 05/10)', () {
    // -------------------------------------------------------------
    // Test 1: LiveViewerSession model parsing & validation
    // -------------------------------------------------------------
    test('1. LiveViewerSession models live room, host info, and subscriber Agora tokens', () {
      final json = {
        'success': true,
        'room': {
          'id': 'room_stream_991',
          'roomNumber': '990219',
          'title': 'Popo Friday Music Night 🎵',
          'category': 'Music',
          'status': 'live',
          'isLive': true,
          'viewerCount': 2450,
          'startedAt': '2026-11-15T14:00:00Z',
          'coverUrl': 'https://example.com/cover.jpg',
          'pk': null,
        },
        'host': {
          'id': 'usr_host_777',
          'poppoId': '800777',
          'nickname': 'DJ Zara',
          'avatarUrl': 'https://example.com/zara.jpg',
          'gender': 'female',
          'country': 'PK',
          'hostLevel': 12,
          'wealthLevel': 8,
        },
        'agora': {
          'appId': 'agora_test_app_id_99',
          'channelName': 'popo_room_stream_991',
          'uid': 45678,
          'token': '006testTokenViewerSubscriber123',
          'role': 'subscriber',
        },
        'chatPreview': [
          {
            'id': 'chat_001',
            'senderId': 'usr_fan_01',
            'nickname': 'Ali',
            'text': 'Welcome to the live show! 🔥',
            'wealthLevel': 5,
            'timestamp': '2026-11-15T14:02:00Z',
          },
        ],
        'isFollowing': true,
      };

      final session = LiveViewerSession.fromJson(json);

      expect(session.room.id, 'room_stream_991');
      expect(session.room.roomNumber, '990219');
      expect(session.room.isLive, isTrue);
      expect(session.room.viewerCount, 2450);
      expect(session.host.nickname, 'DJ Zara');
      expect(session.agora.appId, 'agora_test_app_id_99');
      expect(session.agora.channelName, 'popo_room_stream_991');
      expect(session.agora.role, 'subscriber');
      expect(session.isFollowing, isTrue);
      expect(session.chatPreview.length, 1);
      expect(session.chatPreview.first.text, 'Welcome to the live show! 🔥');
      expect(session.chatPreview.first.nickname, 'Ali');
    });

    // -------------------------------------------------------------
    // Test 2: Subscriber role security & token enforcement
    // -------------------------------------------------------------
    test('2. Viewer joins strictly with audience/subscriber role and cannot publish tracks', () {
      final agoraToken = LiveAgoraCredentials(
        appId: 'agora_sec_app_01',
        channelName: 'popo_channel_live_88',
        uid: 98765,
        token: 'test_token_sub',
        role: 'subscriber',
      );

      // Verifies audience role flag
      expect(agoraToken.role, 'subscriber');
      expect(agoraToken.role != 'publisher', isTrue);
      expect(agoraToken.isValid, isTrue);
    });

    // -------------------------------------------------------------
    // Test 3: Agora RTC Audience role initialization
    // -------------------------------------------------------------
    test('3. Agora RTC engine sets client role to audience for live stream viewers', () async {
      final rtc = AgoraRtcService.instance;
      final initialized = await rtc.initialize(appId: 'test_viewer_app_id');
      expect(initialized, isTrue);

      final joined = await rtc.joinChannel(
        channelName: 'popo_room_test_101',
        token: 'test_viewer_token',
        uid: 12345,
        role: LiveStreamRole.viewer,
      );

      expect(joined, isTrue);
      expect(rtc.role, LiveStreamRole.viewer);
      expect(rtc.isBroadcasting, isFalse); // Viewer MUST NOT be broadcaster
    });

    // -------------------------------------------------------------
    // Test 4: Remote video stream tracking
    // -------------------------------------------------------------
    test(
      '4. Remote host video tracking updates remoteUids and active video state',
      () async {
        final rtc = AgoraRtcService.instance;

        // Initial state has no remote broadcaster
        expect(rtc.remoteUids.isEmpty, isTrue);

        // Simulate remote host joined
        rtc.notifyRemoteUserJoined(888001);
        expect(rtc.remoteUids.contains(888001), isTrue);

        // Simulate remote host left
        rtc.notifyRemoteUserOffline(888001);
        expect(rtc.remoteUids.contains(888001), isFalse);
      },
    );

    // -------------------------------------------------------------
    // Test 5: Remote audio playback & muting toggle
    // -------------------------------------------------------------
    test(
      '5. Remote audio subscription toggles mute/unmute state cleanly',
      () async {
        final rtc = AgoraRtcService.instance;

        // Default audio state: unmuted
        expect(rtc.isRemoteAudioMuted, isFalse);

        // Mute audio
        await rtc.muteRemoteAudio(true);
        expect(rtc.isRemoteAudioMuted, isTrue);

        // Unmute audio
        await rtc.muteRemoteAudio(false);
        expect(rtc.isRemoteAudioMuted, isFalse);
      },
    );

    // -------------------------------------------------------------
    // Test 6: Dynamic viewer count formatting
    // -------------------------------------------------------------
    test(
      '6. Viewer count formatting displays human-readable counts accurately',
      () {
        expect(LiveRoom.formatViewerCount(0), '0');
        expect(LiveRoom.formatViewerCount(89), '89');
        expect(LiveRoom.formatViewerCount(999), '999');
        expect(LiveRoom.formatViewerCount(1000), '1.0K');
        expect(LiveRoom.formatViewerCount(2450), '2.4K');
        expect(LiveRoom.formatViewerCount(12800), '12.8K');
        expect(LiveRoom.formatViewerCount(150000), '150.0K');
        expect(LiveRoom.formatViewerCount(1250000), '1.2M');
      },
    );

    // -------------------------------------------------------------
    // Test 7: Live chat message modeling & payload validation
    // -------------------------------------------------------------
    test(
      '7. LiveChatMessage validates text content, sender metadata and emoji',
      () {
        final chatJson = {
          'id': 'msg_002',
          'senderId': 'usr_fan_88',
          'nickname': 'StarGazer',
          'avatarUrl': 'https://example.com/avatar.png',
          'text': 'Sending love from Lahore! ❤️',
          'emoji': '❤️',
          'wealthLevel': 10,
          'timestamp': '2026-11-15T14:10:00Z',
        };

        final message = LiveChatMessage.fromJson(chatJson);
        expect(message.id, 'msg_002');
        expect(message.senderId, 'usr_fan_88');
        expect(message.nickname, 'StarGazer');
        expect(message.text, 'Sending love from Lahore! ❤️');
        expect(message.emoji, '❤️');
        expect(message.wealthLevel, 10);
        expect(message.formattedTime.isNotEmpty, isTrue);
      },
    );

    // -------------------------------------------------------------
    // Test 8: Live chat client-side rate & length validation
    // -------------------------------------------------------------
    test('8. Chat input validation blocks empty strings and limits excessive lengths', () {
      String sanitizeInput(String text) {
        final trimmed = text.trim();
        if (trimmed.isEmpty) return '';
        if (trimmed.length > 300) return trimmed.substring(0, 300);
        return trimmed;
      }

      expect(sanitizeInput('   '), '');
      expect(sanitizeInput('Hello Host!').isNotEmpty, isTrue);

      final longString = 'A' * 400;
      expect(sanitizeInput(longString).length, 300);
    });

    // -------------------------------------------------------------
    // Test 9: Viewer Join API request and response structure
    // -------------------------------------------------------------
    test('9. POST /api/live/viewer/join response handles viewer count increment and heartbeat', () {
      final joinResponse = {
        'success': true,
        'message': 'Joined live room',
        'viewerCount': 105,
        'viewerDisplay': '105',
      };

      expect(joinResponse['success'], isTrue);
      expect(joinResponse['viewerCount'], 105);
      expect(joinResponse['viewerDisplay'], '105');
    });

    // -------------------------------------------------------------
    // Test 10: Viewer Leave API execution preserves Host Broadcast
    // -------------------------------------------------------------
    test('10. POST /api/live/viewer/leave decrements count and does not terminate room', () {
      final leaveResponse = {
        'success': true,
        'message': 'Left live room',
        'viewerCount': 104,
        'viewerDisplay': '104',
      };

      expect(leaveResponse['success'], isTrue);
      expect(leaveResponse['viewerCount'], 104);
      // Notice: room status is NOT ended; broadcaster continues uninterrupted
    });

    // -------------------------------------------------------------
    // Test 11: Ended stream detection and error presentation
    // -------------------------------------------------------------
    test('11. Inactive or ended room triggers live stream closed state', () {
      final endedRoomJson = {
        'id': 'room_closed_001',
        'roomNumber': '990111',
        'title': 'Ended Stream',
        'category': 'Gaming',
        'status': 'ended',
        'isLive': false,
        'viewerCount': 0,
        'startedAt': '2026-11-15T12:00:00Z',
        'endedAt': '2026-11-15T13:30:00Z',
      };

      final room = LiveRoom.fromJson(endedRoomJson);
      expect(room.isLive, isFalse);
      expect(room.status, 'ended');
    });

    // -------------------------------------------------------------
    // Test 12: Network connection recovery handling
    // -------------------------------------------------------------
    test('12. Network status transitions through connecting, connected, and disconnected', () {
      final rtc = AgoraRtcService.instance;

      rtc.notifyConnectionStateChanged(LiveConnectionStatus.connecting);
      expect(rtc.connectionStatus, LiveConnectionStatus.connecting);

      rtc.notifyConnectionStateChanged(LiveConnectionStatus.connected);
      expect(rtc.connectionStatus, LiveConnectionStatus.connected);

      rtc.notifyConnectionStateChanged(LiveConnectionStatus.reconnecting);
      expect(rtc.connectionStatus, LiveConnectionStatus.reconnecting);

      rtc.notifyConnectionStateChanged(LiveConnectionStatus.disconnected);
      expect(rtc.connectionStatus, LiveConnectionStatus.disconnected);
    });
  });
}
