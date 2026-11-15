import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/live/live_models.dart';
import 'package:popo_live/services/live/live_permission_service.dart';
import 'package:popo_live/services/live/agora_rtc_service.dart';

void main() {
  group('LiveGatesStatus Model Tests', () {
    test('Strict Wealth Level 5 enforcement', () {
      // Current level 1 (under requirement)
      final statusUnder = LiveGatesStatus.fromJson({
        'success': true,
        'isEligible': false,
        'missingRequirements': ['wealth_level'],
        'gates': {
          'faceCheck': {'status': 'verified', 'verified': true},
          'coverImage': {
            'uploaded': true,
            'coverUrl': 'https://example.com/cover.jpg',
          },
          'wealthLevel': {'current': 1, 'required': 5, 'passed': false},
        },
      });

      expect(statusUnder.isWealthQualified, isFalse);
      expect(statusUnder.isFaceVerified, isTrue);
      expect(statusUnder.hasCoverImage, isTrue);
      expect(statusUnder.canGoLive, isFalse);

      // Current level 4 (still under requirement)
      final statusLevel4 = LiveGatesStatus.fromJson({
        'success': true,
        'isEligible': false,
        'missingRequirements': ['wealth_level'],
        'gates': {
          'faceCheck': {'status': 'verified', 'verified': true},
          'coverImage': {
            'uploaded': true,
            'coverUrl': 'https://example.com/cover.jpg',
          },
          'wealthLevel': {'current': 4, 'required': 5, 'passed': false},
        },
      });

      expect(statusLevel4.isWealthQualified, isFalse);
      expect(statusLevel4.canGoLive, isFalse);

      // Current level 5 (meets requirement)
      final statusLevel5 = LiveGatesStatus.fromJson({
        'success': true,
        'isEligible': true,
        'missingRequirements': [],
        'gates': {
          'faceCheck': {'status': 'verified', 'verified': true},
          'coverImage': {
            'uploaded': true,
            'coverUrl': 'https://example.com/cover.jpg',
          },
          'wealthLevel': {'current': 5, 'required': 5, 'passed': true},
        },
      });

      expect(statusLevel5.isWealthQualified, isTrue);
      expect(statusLevel5.canGoLive, isTrue);
    });

    test('Requires both Face Verification and Cover Image', () {
      final statusMissingFace = LiveGatesStatus.fromJson({
        'success': true,
        'isEligible': false,
        'missingRequirements': ['face_check'],
        'gates': {
          'faceCheck': {'status': 'not_started', 'verified': false},
          'coverImage': {
            'uploaded': true,
            'coverUrl': 'https://example.com/cover.jpg',
          },
          'wealthLevel': {'current': 12, 'required': 5, 'passed': true},
        },
      });

      expect(statusMissingFace.isFaceVerified, isFalse);
      expect(statusMissingFace.canGoLive, isFalse);

      final statusMissingCover = LiveGatesStatus.fromJson({
        'success': true,
        'isEligible': false,
        'missingRequirements': ['cover_image'],
        'gates': {
          'faceCheck': {'status': 'verified', 'verified': true},
          'coverImage': {'uploaded': false, 'coverUrl': null},
          'wealthLevel': {'current': 12, 'required': 5, 'passed': true},
        },
      });

      expect(statusMissingCover.hasCoverImage, isFalse);
      expect(statusMissingCover.canGoLive, isFalse);
    });
  });

  group('LiveAgoraConfig Model Tests', () {
    test('Parses server Agora credentials correctly', () {
      final config = LiveAgoraConfig.fromJson({
        'isConfigured': true,
        'appId': 'agora_app_test_123',
        'token': 'rtc_token_mock_abcdef',
        'channelName': 'popo_room_880219',
        'uid': 880219,
        'expireTimeInSeconds': 86400,
        'mode': 'agora_cloud_rtc',
        'message': 'Secure Agora RTC token generated successfully.',
      });

      expect(config.isConfigured, isTrue);
      expect(config.isAgoraCloudActive, isTrue);
      expect(config.isLocalPreviewMode, isFalse);
      expect(config.channelName, equals('popo_room_880219'));
      expect(config.uid, equals(880219));
    });

    test('Gracefully handles unconfigured backend Agora setup', () {
      final config = LiveAgoraConfig.fromJson({
        'isConfigured': false,
        'appId': 'agora_dev_appid_pending',
        'token': '',
        'channelName': 'popo_room_880219',
        'uid': 880219,
        'mode': 'local_webrtc_camera_preview',
        'message': 'Agora App ID or Certificate not configured. Operating in local WebRTC high-definition camera mode.',
      });

      expect(config.isConfigured, isFalse);
      expect(config.isAgoraCloudActive, isFalse);
      expect(config.isLocalPreviewMode, isTrue);
    });
  });

  group('LivePermissionService Tests', () {
    test('Initial permission state and test bypass', () async {
      final service = LivePermissionService.instance;
      service.setPermissionsForTesting(camera: false, microphone: false);

      expect(service.isCameraGranted, isFalse);
      expect(service.isMicrophoneGranted, isFalse);
      expect(service.hasAllPermissions, isFalse);

      service.setPermissionsForTesting(camera: true, microphone: true);
      expect(service.isCameraGranted, isTrue);
      expect(service.isMicrophoneGranted, isTrue);
      expect(service.hasAllPermissions, isTrue);
    });
  });

  group('AgoraRtcService Tests', () {
    test(
      'Initialization with pending App ID enters local preview mode',
      () async {
        final rtc = AgoraRtcService.instance;
        final ready = await rtc.initialize(appId: 'agora_dev_appid_pending');
        expect(ready, isFalse);
        expect(rtc.connectionStatus, equals(LiveConnectionStatus.idle));
      },
    );

    test('Audio/Video mute and camera switch state', () async {
      final rtc = AgoraRtcService.instance;
      expect(rtc.isAudioMuted, isFalse);
      expect(rtc.isVideoMuted, isFalse);
      expect(rtc.isFrontCamera, isTrue);

      await rtc.muteLocalAudio(true);
      expect(rtc.isAudioMuted, isTrue);

      await rtc.muteLocalVideo(true);
      expect(rtc.isVideoMuted, isTrue);

      await rtc.switchCamera();
      expect(rtc.isFrontCamera, isFalse);

      // Reset
      await rtc.muteLocalAudio(false);
      await rtc.muteLocalVideo(false);
      await rtc.switchCamera();
    });
  });
}
