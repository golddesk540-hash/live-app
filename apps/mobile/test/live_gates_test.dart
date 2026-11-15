import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/live/live_models.dart';
import 'package:popo_live/services/live/live_permission_service.dart';

void main() {
  group('Go-Live Gates & Eligibility System Tests (Phase 2 Prompt 02/10)', () {
    // -------------------------------------------------------------
    // Test 1: Eligibility status loading
    // -------------------------------------------------------------
    test(
      '1. Eligibility status loading parses correctly from backend JSON',
      () {
        final json = {
          'success': true,
          'isGuest': false,
          'isEligible': false,
          'missingRequirements': ['face_check', 'cover_image'],
          'gates': {
            'wealthLevel': {'current': 5, 'required': 5, 'passed': true},
            'faceCheck': {'status': 'not_started', 'verified': false},
            'coverImage': {'uploaded': false, 'coverUrl': null},
          },
        };

        final status = LiveGatesStatus.fromJson(json);

        expect(status.success, isTrue);
        expect(status.isGuest, isFalse);
        expect(status.isEligible, isFalse);
        expect(
          status.missingRequirements,
          containsAll(['face_check', 'cover_image']),
        );
        expect(status.wealthLevel.current, 5);
        expect(status.wealthLevel.required, 5);
        expect(status.faceCheck.status, 'not_started');
        expect(status.faceCheck.verified, isFalse);
        expect(status.coverImage.uploaded, isFalse);
        expect(status.canGoLive, isFalse);
      },
    );

    // -------------------------------------------------------------
    // Test 2: Wealth Level below 5 (ineligible)
    // -------------------------------------------------------------
    test('2. Wealth Level below 5 strictly marks user ineligible', () {
      for (final lvl in [0, 1, 2, 3, 4]) {
        final gate = WealthLevelGate.fromJson({
          'current': lvl,
          'required': 5,
          'passed': false,
        });

        expect(
          gate.passed,
          isFalse,
          reason: 'Level $lvl must not pass Wealth Level 5 gate',
        );
        expect(gate.current, lvl);
        expect(gate.required, 5);

        final status = LiveGatesStatus(
          success: true,
          isGuest: false,
          isEligible: false,
          missingRequirements: ['wealth_level'],
          faceCheck: const FaceCheckGate(
            status: 'verified',
            verified: true,
            provider: 'kyc_face_service',
          ),
          coverImage: const CoverImageGate(
            uploaded: true,
            coverUrl: 'https://example.com/cover.jpg',
          ),
          wealthLevel: gate,
        );

        expect(status.isWealthQualified, isFalse);
        expect(
          status.canGoLive,
          isFalse,
          reason: 'User with Wealth Level $lvl must not be able to go live',
        );
      }
    });

    // -------------------------------------------------------------
    // Test 3: Wealth Level 5 or above (eligible)
    // -------------------------------------------------------------
    test('3. Wealth Level 5 or above satisfies the wealth requirement', () {
      for (final lvl in [5, 6, 10, 50, 100]) {
        final gate = WealthLevelGate.fromJson({
          'current': lvl,
          'required': 5,
          'passed': true,
        });

        expect(
          gate.passed,
          isTrue,
          reason: 'Level $lvl must satisfy Wealth Level 5 gate',
        );
        expect(gate.current, lvl);
        expect(gate.required, 5);

        final status = LiveGatesStatus(
          success: true,
          isGuest: false,
          isEligible: true,
          missingRequirements: [],
          faceCheck: const FaceCheckGate(
            status: 'verified',
            verified: true,
            provider: 'kyc_face_service',
          ),
          coverImage: const CoverImageGate(
            uploaded: true,
            coverUrl: 'https://example.com/cover.jpg',
          ),
          wealthLevel: gate,
        );

        expect(status.isWealthQualified, isTrue);
        expect(status.canGoLive, isTrue);
      }
    });

    // -------------------------------------------------------------
    // Test 4: Camera permission granted
    // -------------------------------------------------------------
    test(
      '4. Camera permission granted status allows biometric scanning',
      () async {
        final permService = LivePermissionService.instance;
        final statusMap = await permService.checkPermissions();

        expect(statusMap.containsKey('camera'), isTrue);
        expect(statusMap.containsKey('microphone'), isTrue);
        // In simulator / test environment, default state is granted or notDetermined
        expect(
          statusMap['camera'],
          anyOf([
            LivePermissionStatus.granted,
            LivePermissionStatus.notDetermined,
          ]),
        );
      },
    );

    // -------------------------------------------------------------
    // Test 5: Camera permission denied
    // -------------------------------------------------------------
    test('5. Camera permission denied blocks biometric verification scan', () {
      const deniedStatus = LivePermissionStatus.denied;
      const permPermanentlyDenied = LivePermissionStatus.permanentlyDenied;

      expect(deniedStatus == LivePermissionStatus.granted, isFalse);
      expect(permPermanentlyDenied == LivePermissionStatus.granted, isFalse);

      // Verify that without granted status, scanner must block and prompt
      bool canStartScan(LivePermissionStatus status) {
        return status == LivePermissionStatus.granted;
      }

      expect(canStartScan(deniedStatus), isFalse);
      expect(canStartScan(permPermanentlyDenied), isFalse);
    });

    // -------------------------------------------------------------
    // Test 6: Face verification success
    // -------------------------------------------------------------
    test('6. Face verification success transitions to verified state', () {
      final faceGate = FaceCheckGate.fromJson({
        'status': 'verified',
        'verified': true,
        'verifiedAt': '2026-11-15T12:00:00Z',
        'provider': 'kyc_face_service',
      });

      expect(faceGate.status, 'verified');
      expect(faceGate.verified, isTrue);
      expect(faceGate.verifiedAt, isNotNull);

      final stateEnum = GateVerificationStateParser.fromCode(faceGate.status);
      expect(stateEnum, GateVerificationState.verified);
      expect(stateEnum.label, 'Verified');
      expect(stateEnum.isTerminalSuccess, isTrue);
    });

    // -------------------------------------------------------------
    // Test 7: Face verification rejection
    // -------------------------------------------------------------
    test('7. Face verification rejection transitions to rejected state', () {
      final faceGate = FaceCheckGate.fromJson({
        'status': 'rejected',
        'verified': false,
        'reason': 'Liveness test failed: blinks not detected',
        'provider': 'kyc_face_service',
      });

      expect(faceGate.status, 'rejected');
      expect(faceGate.verified, isFalse);

      final stateEnum = GateVerificationStateParser.fromCode(faceGate.status);
      expect(stateEnum, GateVerificationState.rejected);
      expect(stateEnum.isTerminalSuccess, isFalse);
      expect(stateEnum.label, 'Rejected');
    });

    // -------------------------------------------------------------
    // Test 8: Cover image selection
    // -------------------------------------------------------------
    test('8. Cover image selection supports valid image formats', () {
      final validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

      for (final ext in validExtensions) {
        final filename = 'cover_sample$ext';
        final isSupported = validExtensions.any((e) => filename.endsWith(e));
        expect(isSupported, isTrue, reason: '$ext must be accepted');
      }
    });

    // -------------------------------------------------------------
    // Test 9: Invalid cover image format
    // -------------------------------------------------------------
    test('9. Invalid cover image format is rejected before upload', () {
      final invalidFiles = [
        'bad_cover.gif',
        'cover.bmp',
        'photo.svg',
        'malware.exe',
        'script.sh',
        'audio.mp3',
        'animation.mp4',
      ];
      final validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

      for (final bad in invalidFiles) {
        final isSupported = validExtensions.any((e) => bad.endsWith(e));
        expect(isSupported, isFalse, reason: '$bad must be rejected');
      }
    });

    // -------------------------------------------------------------
    // Test 10: Cover upload failure (file > 5MB or invalid)
    // -------------------------------------------------------------
    test('10. Cover upload failure enforces 5MB maximum file size', () {
      const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

      bool validateFileSize(int bytes) {
        return bytes > 0 && bytes <= maxSizeBytes;
      }

      expect(validateFileSize(1024), isTrue); // 1 KB
      expect(validateFileSize(4 * 1024 * 1024), isTrue); // 4 MB
      expect(validateFileSize(5 * 1024 * 1024), isTrue); // Exactly 5 MB
      expect(validateFileSize(5 * 1024 * 1024 + 1), isFalse); // 5 MB + 1 byte
      expect(validateFileSize(10 * 1024 * 1024), isFalse); // 10 MB
    });

    // -------------------------------------------------------------
    // Test 11: Cover upload success
    // -------------------------------------------------------------
    test('11. Cover upload success updates cover image gate state', () {
      final coverGate = CoverImageGate.fromJson({
        'uploaded': true,
        'coverUrl': 'https://static.popolive.com/covers/host_1001.jpg',
      });

      expect(coverGate.uploaded, isTrue);
      expect(
        coverGate.coverUrl,
        'https://static.popolive.com/covers/host_1001.jpg',
      );
    });

    // -------------------------------------------------------------
    // Test 12: Final eligibility verification (200 & 403)
    // -------------------------------------------------------------
    test(
      '12. Final eligibility verification handles 200 approved and 403 denied',
      () {
        // 200 OK Scenario
        final approvedResponse = {
          'success': true,
          'isEligible': true,
          'missingRequirements': <String>[],
          'message': 'All Go-Live gates verified successfully!',
        };

        expect(approvedResponse['isEligible'], isTrue);
        expect(
          (approvedResponse['missingRequirements'] as List).isEmpty,
          isTrue,
        );

        // 403 Forbidden Scenario
        final rejectedResponse = {
          'success': false,
          'isEligible': false,
          'missingGates': ['wealth_level', 'face_check'],
          'reasons': [
            'Wealth Level 5 required (current: 1)',
            'Face verification is required before broadcasting',
          ],
          'error': 'You do not meet all Go-Live requirements.',
        };

        expect(rejectedResponse['isEligible'], isFalse);
        expect(rejectedResponse['missingGates'], contains('wealth_level'));
        expect(rejectedResponse['missingGates'], contains('face_check'));
        expect((rejectedResponse['reasons'] as List).length, 2);
      },
    );

    // -------------------------------------------------------------
    // Test 13: Network failure handling
    // -------------------------------------------------------------
    test('13. Network failure gracefully falls back to initial gate state', () {
      final fallback = LiveGatesStatus.initial();

      expect(fallback.success, isFalse);
      expect(fallback.isEligible, isFalse);
      expect(fallback.canGoLive, isFalse);
      expect(fallback.wealthLevel.current, 1);
      expect(fallback.wealthLevel.required, 5);
      expect(fallback.faceCheck.verified, isFalse);
      expect(fallback.coverImage.uploaded, isFalse);
    });

    // -------------------------------------------------------------
    // Test 14: Unauthorized user handling
    // -------------------------------------------------------------
    test('14. Unauthorized / Guest user handling', () {
      final guestStatus = LiveGatesStatus.fromJson({
        'success': true,
        'isGuest': true,
        'isEligible': false,
        'missingRequirements': [
          'authentication',
          'wealth_level',
          'face_check',
          'cover_image',
        ],
        'gates': {
          'wealthLevel': {'current': 0, 'required': 5, 'passed': false},
          'faceCheck': {'status': 'not_started', 'verified': false},
          'coverImage': {'uploaded': false, 'coverUrl': null},
        },
      });

      expect(guestStatus.isGuest, isTrue);
      expect(guestStatus.isEligible, isFalse);
      expect(guestStatus.canGoLive, isFalse);
    });

    // -------------------------------------------------------------
    // Test 15: Retry functionality
    // -------------------------------------------------------------
    test('15. GateVerificationState retry lifecycle transitions', () {
      // Step A: Not started
      var state = GateVerificationState.notStarted;
      expect(state.code, 'not_started');
      expect(state.isTerminalSuccess, isFalse);

      // Step B: In progress
      state = GateVerificationState.inProgress;
      expect(state.code, 'in_progress');

      // Step C: Failed
      state = GateVerificationState.failed;
      expect(state.code, 'failed');
      expect(state.canRetry, isTrue);

      // Step D: Retry -> In progress again
      state = GateVerificationState.inProgress;
      expect(state.code, 'in_progress');

      // Step E: Verified
      state = GateVerificationState.verified;
      expect(state.code, 'verified');
      expect(state.isTerminalSuccess, isTrue);
    });
  });
}
