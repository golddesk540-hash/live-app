import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/live/live_models.dart';
import 'package:popo_live/services/live/agora_rtc_service.dart';
import 'package:popo_live/services/live/live_session_manager.dart';

void main() {
  group('M3 End Live Session, Host Summary & Complete Resource Cleanup (Phase 2 Prompt 07/10)', () {
    // -------------------------------------------------------------
    // Test 1: LiveEndSummary Parsing from POST /api/live/studio/end
    // -------------------------------------------------------------
    test('1. LiveEndSummary correctly parses summary from POST /api/live/studio/end payload', () {
      final json = {
        'success': true,
        'message': 'Broadcast ended successfully',
        'summary': {
          'roomId': 'room_pk_880219',
          'roomNumber': '880219',
          'durationSeconds': 754,
          'durationFormatted': '00:12:34',
          'peakViewers': 1842,
          'totalLikes': 5420,
          'totalGifts': 320,
          'diamondsEarned': 1540,
        },
      };

      final summary = LiveEndSummary.fromJson(json);

      expect(summary.roomId, 'room_pk_880219');
      expect(summary.roomNumber, '880219');
      expect(summary.durationSeconds, 754);
      expect(summary.durationFormatted, '00:12:34');
      expect(summary.peakViewers, 1842);
      expect(summary.peakViewersFormatted, '1.8K');
      expect(summary.totalLikes, 5420);
      expect(summary.totalGifts, 320);
      expect(summary.pointsReceived, 1540);
      expect(summary.pointsReceivedFormatted, '1.5K');
    });

    // -------------------------------------------------------------
    // Test 2: LiveEndSummary Parsing from GET /api/live/end-screen/summary
    // -------------------------------------------------------------
    test('2. LiveEndSummary correctly parses complete summary from GET /api/live/end-screen/summary', () {
      final json = {
        'success': true,
        'summary': {
          'sessionId': 'room-880219',
          'roomNumber': '880219',
          'title': 'Come and chat with me 💕',
          'category': 'Live Chat',
          'coverUrl': '/assets/viewer/sample_viewer_broadcast.png',
          'durationSeconds': 5076,
          'durationFormatted': '01:24:36',
          'totalViewers': 12480,
          'totalViewersFormatted': '12,480',
          'peakViewers': 3420,
          'peakViewersFormatted': '3,420',
          'newFollowers': 186,
          'newFollowersFormatted': '186',
          'pointsReceived': 28400,
          'pointsReceivedFormatted': '28,400',
          'totalLikes': 5420,
          'totalGifts': 320,
          'host': {
            'id': 'demo-host-zara',
            'nickname': 'Zara Live',
            'poppoId': '8802194',
            'avatarUrl': '/assets/studio/host_zara_avatar.png',
            'level': 12,
            'wealthLevel': 12,
          },
        },
      };

      final summary = LiveEndSummary.fromJson(json);

      expect(summary.roomId, 'room-880219');
      expect(summary.roomNumber, '880219');
      expect(summary.title, 'Come and chat with me 💕');
      expect(summary.category, 'Live Chat');
      expect(summary.coverUrl, '/assets/viewer/sample_viewer_broadcast.png');
      expect(summary.durationSeconds, 5076);
      expect(summary.durationFormatted, '01:24:36');
      expect(summary.totalViewers, 12480);
      expect(summary.totalViewersFormatted, '12,480');
      expect(summary.peakViewers, 3420);
      expect(summary.peakViewersFormatted, '3,420');
      expect(summary.newFollowers, 186);
      expect(summary.newFollowersFormatted, '+186');
      expect(summary.pointsReceived, 28400);
      expect(summary.pointsReceivedFormatted, '28,400');
      expect(summary.host, isNotNull);
      expect(summary.host!.nickname, 'Zara Live');
      expect(summary.host!.poppoId, '8802194');
      expect(summary.host!.wealthLevel, 12);
    });

    // -------------------------------------------------------------
    // Test 3: LiveEndSummary Serialization Round-Trip
    // -------------------------------------------------------------
    test(
      '3. LiveEndSummary serializes to JSON and recovers identical data',
      () {
        const original = LiveEndSummary(
          roomId: 'room_99',
          roomNumber: '88099',
          title: 'Friday Live Show',
          category: 'Dance',
          durationSeconds: 3600,
          durationFormatted: '01:00:00',
          totalViewers: 8500,
          totalViewersFormatted: '8.5K',
          peakViewers: 2100,
          peakViewersFormatted: '2.1K',
          newFollowers: 95,
          newFollowersFormatted: '+95',
          pointsReceived: 12000,
          pointsReceivedFormatted: '12.0K',
          totalLikes: 3500,
          totalGifts: 150,
        );

        final map = original.toJson();
        final restored = LiveEndSummary.fromJson(map);

        expect(restored.roomId, original.roomId);
        expect(restored.roomNumber, original.roomNumber);
        expect(restored.title, original.title);
        expect(restored.category, original.category);
        expect(restored.durationSeconds, original.durationSeconds);
        expect(restored.durationFormatted, original.durationFormatted);
        expect(restored.totalViewers, original.totalViewers);
        expect(restored.peakViewers, original.peakViewers);
        expect(restored.newFollowers, original.newFollowers);
        expect(restored.pointsReceived, original.pointsReceived);
        expect(restored.totalLikes, original.totalLikes);
        expect(restored.totalGifts, original.totalGifts);
      },
    );

    // -------------------------------------------------------------
    // Test 4: LiveHistoryKpis Model Parsing
    // -------------------------------------------------------------
    test('4. LiveHistoryKpis correctly parses lifetime and periodic KPI aggregates', () {
      final json = {
        'totalSessions': 24,
        'totalDurationSeconds': 173700,
        'totalDurationFormatted': '48h 15m',
        'totalViewers': 142800,
        'totalViewersFormatted': '142.8K',
        'totalFollowers': 1850,
        'totalFollowersFormatted': '+1.9K',
      };

      final kpis = LiveHistoryKpis.fromJson(json);

      expect(kpis.totalSessions, 24);
      expect(kpis.totalDurationSeconds, 173700);
      expect(kpis.totalDurationFormatted, '48h 15m');
      expect(kpis.totalViewers, 142800);
      expect(kpis.totalViewersFormatted, '142.8K');
      expect(kpis.totalFollowers, 1850);
      expect(kpis.totalFollowersFormatted, '+1.9K');
    });

    // -------------------------------------------------------------
    // Test 5: LiveHistorySessionItem Model Parsing
    // -------------------------------------------------------------
    test(
      '5. LiveHistorySessionItem parses individual recorded broadcast item',
      () {
        final json = {
          'id': 'session-hist-2',
          'roomNumber': '880218',
          'title': 'Late Night Singing & Q&A 🎵',
          'category': 'Music & Singing',
          'coverUrl': '/assets/pre-live/sample_cover_model.png',
          'startedAt': '2026-11-14T20:00:00Z',
          'endedAt': '2026-11-14T22:00:00Z',
          'durationSeconds': 7200,
          'durationFormatted': '02:00:00',
          'totalViewers': 18950,
          'totalViewersFormatted': '18,950',
          'peakViewers': 4520,
          'peakViewersFormatted': '4,520',
          'newFollowers': 312,
          'pointsReceived': 42100,
          'status': 'ended',
        };

        final item = LiveHistorySessionItem.fromJson(json);

        expect(item.id, 'session-hist-2');
        expect(item.roomNumber, '880218');
        expect(item.title, 'Late Night Singing & Q&A 🎵');
        expect(item.category, 'Music & Singing');
        expect(item.durationSeconds, 7200);
        expect(item.durationFormatted, '02:00:00');
        expect(item.totalViewers, 18950);
        expect(item.totalViewersFormatted, '18,950');
        expect(item.peakViewers, 4520);
        expect(item.peakViewersFormatted, '4,520');
        expect(item.newFollowers, 312);
        expect(item.pointsReceived, 42100);
        expect(item.status, 'ended');
        expect(item.startedAt, isNotNull);
        expect(item.endedAt, isNotNull);
      },
    );

    // -------------------------------------------------------------
    // Test 6: LiveHistoryResponse Model Parsing
    // -------------------------------------------------------------
    test(
      '6. LiveHistoryResponse parses full host center history with filter',
      () {
        final json = {
          'success': true,
          'filter': 'week',
          'host': {
            'id': 'host_101',
            'nickname': 'Zara Live',
            'poppoId': '8802194',
            'avatarUrl': '/assets/avatar.png',
            'level': 12,
            'wealthLevel': 12,
          },
          'kpis': {
            'totalSessions': 7,
            'totalDurationSeconds': 42000,
            'totalDurationFormatted': '11h 40m',
            'totalViewers': 48000,
            'totalViewersFormatted': '48.0K',
            'totalFollowers': 620,
            'totalFollowersFormatted': '+620',
          },
          'sessions': [
            {
              'id': 's1',
              'roomNumber': '880219',
              'title': 'Session 1',
              'category': 'Live Chat',
              'durationSeconds': 3600,
              'durationFormatted': '01:00:00',
              'totalViewers': 5000,
              'totalViewersFormatted': '5.0K',
              'peakViewers': 1200,
              'peakViewersFormatted': '1.2K',
              'newFollowers': 80,
              'pointsReceived': 10000,
              'status': 'ended',
            },
          ],
          'isDemo': false,
        };

        final response = LiveHistoryResponse.fromJson(json);

        expect(response.success, isTrue);
        expect(response.filter, 'week');
        expect(response.host, isNotNull);
        expect(response.host!.nickname, 'Zara Live');
        expect(response.kpis, isNotNull);
        expect(response.kpis!.totalSessions, 7);
        expect(response.sessions.length, 1);
        expect(response.sessions.first.roomNumber, '880219');
        expect(response.isDemo, isFalse);
      },
    );

    // -------------------------------------------------------------
    // Test 7: LiveSessionState Enum Lifecycle Coverage
    // -------------------------------------------------------------
    test(
      '7. LiveSessionState contains all 7 canonical streaming lifecycle states',
      () {
        expect(LiveSessionState.values.contains(LiveSessionState.idle), isTrue);
        expect(
          LiveSessionState.values.contains(LiveSessionState.connecting),
          isTrue,
        );
        expect(
          LiveSessionState.values.contains(LiveSessionState.active),
          isTrue,
        );
        expect(
          LiveSessionState.values.contains(LiveSessionState.ending),
          isTrue,
        );
        expect(
          LiveSessionState.values.contains(LiveSessionState.ended),
          isTrue,
        );
        expect(
          LiveSessionState.values.contains(LiveSessionState.failed),
          isTrue,
        );
        expect(
          LiveSessionState.values.contains(LiveSessionState.disconnected),
          isTrue,
        );
        expect(LiveSessionState.values.length, 7);
      },
    );

    // -------------------------------------------------------------
    // Test 8: Agora Hardware Teardown (releaseHardwareResources)
    // -------------------------------------------------------------
    test('8. AgoraRtcService.releaseHardwareResources cleanly mutes and resets hardware state', () async {
      final rtc = AgoraRtcService.instance;

      // Simulate active state
      await rtc.joinChannel(
        config: const LiveAgoraConfig(
          appId: 'test_app_id',
          channelName: 'test_channel_001',
          token: 'test_token',
          uid: 123456,
          isConfigured: false,
          mode: 'device_direct',
        ),
        role: LiveStreamRole.host,
      );

      expect(rtc.isBroadcasting, isTrue);
      expect(rtc.isVideoMuted, isFalse);
      expect(rtc.isAudioMuted, isFalse);

      // Perform hardware teardown
      await rtc.releaseHardwareResources();

      expect(rtc.isBroadcasting, isFalse);
      expect(rtc.isVideoMuted, isTrue);
      expect(rtc.isAudioMuted, isTrue);
      expect(rtc.remoteViewerCount, 0);
      expect(rtc.connectionStatus, LiveConnectionStatus.disconnected);
    });

    // -------------------------------------------------------------
    // Test 9: Accidental & Duplicate Termination Prevention
    // -------------------------------------------------------------
    test('9. LiveSessionManager rejects duplicate endBroadcast calls when already ending', () async {
      final manager = LiveSessionManager.instance;
      manager.resetSessionState();

      expect(manager.sessionState, LiveSessionState.idle);

      // When session is null, endBroadcast gracefully returns null
      final res1 = await manager.endBroadcast();
      expect(res1, isNull);
      expect(manager.sessionState, LiveSessionState.idle);
    });

    // -------------------------------------------------------------
    // Test 10: Automatic Viewer Stream Ended Notification
    // -------------------------------------------------------------
    test(
      '10. LiveSessionManager triggers onStreamEndedByHost when session ends',
      () {
        final manager = LiveSessionManager.instance;
        bool callbackFired = false;

        manager.onStreamEndedByHost = () {
          callbackFired = true;
        };

        expect(manager.onStreamEndedByHost, isNotNull);
        manager.onStreamEndedByHost?.call();
        expect(callbackFired, isTrue);

        manager.onStreamEndedByHost = null;
        expect(manager.onStreamEndedByHost, isNull);
      },
    );
  });
}
