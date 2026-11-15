import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/live/live_models.dart';
import 'package:popo_live/services/live/agora_rtc_service.dart';
import 'package:popo_live/services/live/live_permission_service.dart';

void main() {
  group(
    'M3 Actual Live Broadcasting Using Agora SDK (Phase 2 Prompt 04/10)',
    () {
      // -------------------------------------------------------------
      // Test 1: Agora engine initialization
      // -------------------------------------------------------------
      test(
        '1. Agora engine initialization configures video & audio pipelines',
        () async {
          final rtc = AgoraRtcService.instance;
          final initialized = await rtc.initialize(appId: 'test_app_id_1234');
          expect(initialized, isTrue);
          expect(rtc.connectionStatus, LiveConnectionStatus.idle);
        },
      );

      // -------------------------------------------------------------
      // Test 2: Camera permission
      // -------------------------------------------------------------
      test('2. Camera permission verification for broadcasting', () async {
        final perm = LivePermissionService.instance;
        final permissions = await perm.checkPermissions();
        expect(permissions.containsKey('camera'), isTrue);
      });

      // -------------------------------------------------------------
      // Test 3: Microphone permission
      // -------------------------------------------------------------
      test(
        '3. Microphone permission verification for audio streaming',
        () async {
          final perm = LivePermissionService.instance;
          expect(perm.isMicrophoneGranted, isTrue);
        },
      );

      // -------------------------------------------------------------
      // Test 4: Backend eligibility
      // -------------------------------------------------------------
      test(
        '4. Backend eligibility requires all 3 gates satisfied before live',
        () {
          // Ineligible case (wealth level 3)
          final ineligibleGate = LiveGatesStatus.fromJson({
            'success': true,
            'isEligible': false,
            'missingRequirements': ['wealth_level'],
            'gates': {
              'wealthLevel': {'current': 3, 'required': 5, 'passed': false},
              'faceCheck': {'status': 'verified', 'verified': true},
              'coverImage': {
                'uploaded': true,
                'coverUrl': 'https://example.com/c.jpg',
              },
            },
          });
          expect(ineligibleGate.canGoLive, isFalse);

          // Eligible case (wealth level 5)
          final eligibleGate = LiveGatesStatus.fromJson({
            'success': true,
            'isEligible': true,
            'missingRequirements': <String>[],
            'gates': {
              'wealthLevel': {'current': 5, 'required': 5, 'passed': true},
              'faceCheck': {'status': 'verified', 'verified': true},
              'coverImage': {
                'uploaded': true,
                'coverUrl': 'https://example.com/c.jpg',
              },
            },
          });
          expect(eligibleGate.canGoLive, isTrue);
        },
      );

      // -------------------------------------------------------------
      // Test 5: Start live API
      // -------------------------------------------------------------
      test(
        '5. Start live API response models live room and agora credentials',
        () {
          final startResponseJson = {
            'success': true,
            'message': 'Broadcast started successfully',
            'room': {
              'id': 'room_abc_123',
              'roomNumber': '880219',
              'title': 'Friday Live Fest 💕',
              'category': 'Live Chat',
              'status': 'live',
              'isLive': true,
              'viewerCount': 1800,
              'startedAt': '2026-11-15T12:00:00Z',
            },
            'agora': {
              'isConfigured': true,
              'appId': 'agora_app_test_123',
              'channelName': 'popo_room_880219',
              'uid': 880219,
              'token': 'rtc_token_secure_signature_123',
              'role': 'publisher',
              'expiresInSeconds': 86400,
              'mode': 'agora_cloud_rtc',
              'message': 'Token generated successfully.',
            },
          };

          final session = LiveRoomSession.fromJson(startResponseJson);
          expect(session.isLive, isTrue);
          expect(session.roomNumber, '880219');
          expect(session.agora, isNotNull);
          expect(session.agora!.channelName, 'popo_room_880219');
          expect(session.agora!.isPublisher, isTrue);
        },
      );

      // -------------------------------------------------------------
      // Test 6: Agora token retrieval
      // -------------------------------------------------------------
      test(
        '6. Agora token retrieval validates expiry and channel authorization',
        () {
          const agoraConfig = LiveAgoraConfig(
            isConfigured: true,
            appId: 'agora_app_id',
            channelName: 'popo_room_880219',
            uid: 880219,
            token: 'token_val_12345',
            role: 'publisher',
            expiresInSeconds: 86400,
            mode: 'agora_cloud_rtc',
            message: 'Valid token',
          );

          expect(agoraConfig.isTokenValid, isTrue);
          expect(agoraConfig.channelName, 'popo_room_880219');
          expect(agoraConfig.uid, 880219);
        },
      );

      // -------------------------------------------------------------
      // Test 7: Channel joining
      // -------------------------------------------------------------
      test(
        '7. Channel joining transitions state to connected as broadcaster',
        () async {
          final rtc = AgoraRtcService.instance;
          const config = LiveAgoraConfig(
            isConfigured: true,
            appId: 'test_app_id',
            channelName: 'popo_room_880219',
            uid: 880219,
            token: 'test_token',
            role: 'publisher',
            expiresInSeconds: 86400,
            mode: 'agora_cloud_rtc',
            message: 'Ready',
          );

          final joined = await rtc.joinChannel(
            config: config,
            role: LiveStreamRole.host,
          );

          expect(joined, isTrue);
          expect(rtc.connectionStatus, LiveConnectionStatus.connected);
          expect(rtc.isBroadcasting, isTrue);
        },
      );

      // -------------------------------------------------------------
      // Test 8: Actual video publishing
      // -------------------------------------------------------------
      test('8. Video publishing is enabled on broadcaster join', () {
        final rtc = AgoraRtcService.instance;
        expect(rtc.isVideoMuted, isFalse);
      });

      // -------------------------------------------------------------
      // Test 9: Actual audio publishing
      // -------------------------------------------------------------
      test('9. Audio publishing is enabled on broadcaster join', () {
        final rtc = AgoraRtcService.instance;
        expect(rtc.isAudioMuted, isFalse);
      });

      // -------------------------------------------------------------
      // Test 10: Camera on/off
      // -------------------------------------------------------------
      test('10. Camera video stream mute and un-mute toggling', () async {
        final rtc = AgoraRtcService.instance;

        await rtc.muteLocalVideo(true);
        expect(rtc.isVideoMuted, isTrue);

        await rtc.muteLocalVideo(false);
        expect(rtc.isVideoMuted, isFalse);
      });

      // -------------------------------------------------------------
      // Test 11: Microphone mute/unmute
      // -------------------------------------------------------------
      test('11. Microphone audio stream mute and un-mute toggling', () async {
        final rtc = AgoraRtcService.instance;

        await rtc.muteLocalAudio(true);
        expect(rtc.isAudioMuted, isTrue);

        await rtc.muteLocalAudio(false);
        expect(rtc.isAudioMuted, isFalse);
      });

      // -------------------------------------------------------------
      // Test 12: Camera switching
      // -------------------------------------------------------------
      test(
        '12. Camera switching toggles between front and rear sensors',
        () async {
          final rtc = AgoraRtcService.instance;
          final initialFacing = rtc.isFrontCamera;

          await rtc.switchCamera();
          expect(rtc.isFrontCamera, equals(!initialFacing));

          await rtc.switchCamera();
          expect(rtc.isFrontCamera, equals(initialFacing));
        },
      );

      // -------------------------------------------------------------
      // Test 13: Connection interruption
      // -------------------------------------------------------------
      test('13. Connection interruption and network quality callbacks', () {
        final rtc = AgoraRtcService.instance;
        int reportedQuality = 0;

        rtc.onNetworkQuality = (score) {
          reportedQuality = score;
        };

        rtc.updateNetworkQuality(2); // Good
        expect(reportedQuality, 2);
        expect(rtc.networkQuality, 2);

        rtc.updateNetworkQuality(1); // Excellent
        expect(reportedQuality, 1);
      });

      // -------------------------------------------------------------
      // Test 14: Session restoration
      // -------------------------------------------------------------
      test('14. Session restoration parses active room from backend sync', () {
        final activeSessionJson = {
          'room': {
            'id': 'room_active_99',
            'roomNumber': '880999',
            'title': 'Active Night Stream',
            'category': 'Entertainment',
            'status': 'live',
            'isLive': true,
            'viewerCount': 2400,
            'viewerDisplay': '2.4K',
          },
        };

        final restoredSession = LiveRoomSession.fromJson(activeSessionJson);
        expect(restoredSession.isLive, isTrue);
        expect(restoredSession.viewerDisplay, '2.4K');
      });

      // -------------------------------------------------------------
      // Test 15: End live API
      // -------------------------------------------------------------
      test('15. End live API parses summary metrics correctly', () {
        final endSummaryJson = {
          'success': true,
          'message': 'Broadcast ended successfully',
          'summary': {
            'roomId': 'room_abc_123',
            'roomNumber': '880219',
            'durationSeconds': 945,
            'durationFormatted': '00:15:45',
            'peakViewers': 1920,
            'totalLikes': 6100,
            'totalGifts': 410,
            'diamondsEarned': 2100,
          },
        };

        final summary = LiveEndSummary.fromJson(endSummaryJson);
        expect(summary.durationSeconds, 945);
        expect(summary.durationFormatted, '00:15:45');
        expect(summary.peakViewers, 1920);
        expect(summary.pointsReceived, 2100);
      });

      // -------------------------------------------------------------
      // Test 16: Agora channel leaving
      // -------------------------------------------------------------
      test(
        '16. Agora channel leaving resets broadcasting flags and state',
        () async {
          final rtc = AgoraRtcService.instance;

          await rtc.leaveChannel();
          expect(rtc.isBroadcasting, isFalse);
          expect(rtc.connectionStatus, LiveConnectionStatus.disconnected);
        },
      );

      // -------------------------------------------------------------
      // Test 17: Resource cleanup
      // -------------------------------------------------------------
      test(
        '17. Full resource cleanup releases camera and microphone hooks',
        () async {
          final rtc = AgoraRtcService.instance;
          await rtc.release();
          expect(rtc.connectionStatus, LiveConnectionStatus.disconnected);
        },
      );
    },
  );
}
