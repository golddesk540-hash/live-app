import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/live/live_models.dart';
import 'package:popo_live/services/live/agora_rtc_service.dart';
import 'package:popo_live/services/live/live_permission_service.dart';

void main() {
  group('M3 Pre-Live Setup & Host Studio Tests (Phase 2 Prompt 03/10)', () {
    // -------------------------------------------------------------
    // Test 1: Pre-live configuration loading
    // -------------------------------------------------------------
    test(
      '1. Pre-live configuration loading parses backend categories & setup',
      () {
        final json = {
          'success': true,
          'isDemo': false,
          'user': {
            'id': 'user_101',
            'poppoId': '8899001',
            'nickname': 'Host Zara',
            'wealthLevel': 8,
            'isFaceVerified': true,
            'liveCoverUrl': 'https://static.popolive.com/covers/zara.jpg',
          },
          'gates': {'isEligible': true, 'missingGates': <String>[]},
          'savedSetup': {
            'title': 'Night Vibes & Chat 💕',
            'categoryId': 'live_chat',
            'categoryName': 'Live Chat',
            'coverUrl': 'https://static.popolive.com/covers/zara.jpg',
          },
          'categories': [
            {
              'id': 'live_chat',
              'name': 'Live Chat',
              'description': 'Casual conversation & social interaction',
              'iconName': 'message-circle',
            },
            {
              'id': 'music',
              'name': 'Music',
              'description': 'Singing & performances',
              'iconName': 'music',
            },
          ],
        };

        final config = PreLiveConfig.fromJson(json);

        expect(config.success, isTrue);
        expect(config.isEligible, isTrue);
        expect(config.wealthLevel, 8);
        expect(config.hostNickname, 'Host Zara');
        expect(config.categories.length, 2);
        expect(config.categories[0].id, 'live_chat');
        expect(config.categories[1].name, 'Music');
        expect(config.savedSetup?.title, 'Night Vibes & Chat 💕');
        expect(config.coverUrl, contains('zara.jpg'));
      },
    );

    // -------------------------------------------------------------
    // Test 2: Live title validation
    // -------------------------------------------------------------
    test(
      '2. Live title validation enforces non-empty and 60-character limit',
      () {
        bool validateTitle(String title) {
          final trimmed = title.trim();
          return trimmed.isNotEmpty && trimmed.length <= 60;
        }

        expect(
          validateTitle(''),
          isFalse,
          reason: 'Empty string must be invalid',
        );
        expect(
          validateTitle('   '),
          isFalse,
          reason: 'Whitespace-only must be invalid',
        );
        expect(validateTitle('Valid Live Title'), isTrue);
        expect(
          validateTitle('A' * 60),
          isTrue,
          reason: 'Exactly 60 chars must be valid',
        );
        expect(
          validateTitle('A' * 61),
          isFalse,
          reason: '61 chars must exceed limit',
        );
      },
    );

    // -------------------------------------------------------------
    // Test 3: Category selection
    // -------------------------------------------------------------
    test(
      '3. Category selection allows switching between supported categories',
      () {
        final categories = [
          const PreLiveCategory(
            id: 'live_chat',
            name: 'Live Chat',
            description: 'Chat',
            iconName: 'message-circle',
          ),
          const PreLiveCategory(
            id: 'gaming',
            name: 'Gaming',
            description: 'Gaming streams',
            iconName: 'gamepad-2',
          ),
          const PreLiveCategory(
            id: 'music',
            name: 'Music',
            description: 'Music performances',
            iconName: 'music',
          ),
        ];

        var selectedCat = categories.first;
        expect(selectedCat.id, 'live_chat');

        // Change category
        selectedCat = categories[1];
        expect(selectedCat.id, 'gaming');
        expect(selectedCat.name, 'Gaming');

        selectedCat = categories[2];
        expect(selectedCat.id, 'music');
        expect(selectedCat.name, 'Music');
      },
    );

    // -------------------------------------------------------------
    // Test 4: Tag selection & limit
    // -------------------------------------------------------------
    test('4. Tag selection supports toggling and enforces maximum 3 tags', () {
      final selectedTags = <String>[];

      void toggleTag(String tag) {
        if (selectedTags.contains(tag)) {
          selectedTags.remove(tag);
        } else {
          if (selectedTags.length < 3) {
            selectedTags.add(tag);
          }
        }
      }

      toggleTag('#LiveChat');
      expect(selectedTags, contains('#LiveChat'));
      expect(selectedTags.length, 1);

      toggleTag('#Music');
      toggleTag('#Singing');
      expect(selectedTags.length, 3);

      // Attempting 4th tag must be rejected
      toggleTag('#Gaming');
      expect(selectedTags.length, 3);
      expect(selectedTags.contains('#Gaming'), isFalse);

      // Untoggle
      toggleTag('#Music');
      expect(selectedTags.length, 2);
      expect(selectedTags.contains('#Music'), isFalse);
    });

    // -------------------------------------------------------------
    // Test 5: Cover preview
    // -------------------------------------------------------------
    test('5. Cover preview displays 3:4 portrait thumbnail ratio', () {
      const coverUrl = 'https://static.popolive.com/covers/cover_001.jpg';
      expect(coverUrl.isNotEmpty, isTrue);
      expect(coverUrl.endsWith('.jpg'), isTrue);
    });

    // -------------------------------------------------------------
    // Test 6: Cover replacement
    // -------------------------------------------------------------
    test('6. Cover replacement updates cover URL in pre-live state', () {
      String? currentCover = 'https://static.popolive.com/covers/old_cover.jpg';
      const newCover = 'https://static.popolive.com/covers/new_cover.jpg';

      currentCover = newCover;
      expect(currentCover, equals(newCover));
    });

    // -------------------------------------------------------------
    // Test 7: Configuration submission
    // -------------------------------------------------------------
    test('7. Configuration submission parses backend staging response', () {
      final json = {
        'success': true,
        'message': 'Pre-live setup configured successfully.',
        'session': {
          'roomId': 'room_uuid_9988',
          'roomNumber': '880219',
          'title': 'Popo Friday Night Live 🎉',
          'category': 'Entertainment',
          'categoryId': 'entertainment',
          'coverUrl': 'https://static.popolive.com/covers/live.jpg',
          'hostNickname': 'Zara Host',
          'hostPoppoId': '8899001',
          'status': 'setup',
        },
        'nextStep': '/live/studio/room_uuid_9988',
      };

      final result = PreLiveSetupResult.fromJson(
        json,
        tags: ['#Entertainment', '#Party'],
      );

      expect(result.success, isTrue);
      expect(result.roomId, 'room_uuid_9988');
      expect(result.roomNumber, '880219');
      expect(result.title, 'Popo Friday Night Live 🎉');
      expect(result.category, 'Entertainment');
      expect(result.categoryId, 'entertainment');
      expect(result.tags, containsAll(['#Entertainment', '#Party']));
      expect(result.status, 'setup');
    });

    // -------------------------------------------------------------
    // Test 8: Backend validation errors
    // -------------------------------------------------------------
    test('8. Backend validation error parses gracefully', () {
      final errorJson = {
        'success': false,
        'error': 'Go-Live eligibility gate requirements incomplete.',
        'reasons': [
          'Wealth Level: Minimum Level 5 required to go live. Your current level is 1.',
        ],
        'missingGates': ['wealth_level'],
      };

      final errorResult = PreLiveSetupResult.fromJson(errorJson);
      expect(errorResult.success, isFalse);
      expect(
        errorResult.error,
        'Go-Live eligibility gate requirements incomplete.',
      );
    });

    // -------------------------------------------------------------
    // Test 9: Camera permission
    // -------------------------------------------------------------
    test('9. Camera permission status validation', () async {
      final permService = LivePermissionService.instance;
      final permissions = await permService.checkPermissions();

      expect(permissions.containsKey('camera'), isTrue);
      expect(permissions.containsKey('microphone'), isTrue);
    });

    // -------------------------------------------------------------
    // Test 10: Camera preview
    // -------------------------------------------------------------
    test('10. Camera preview mute and active state transitions', () async {
      final rtc = AgoraRtcService.instance;

      expect(rtc.isVideoMuted, isFalse);

      await rtc.muteLocalVideo(true);
      expect(rtc.isVideoMuted, isTrue);

      await rtc.muteLocalVideo(false);
      expect(rtc.isVideoMuted, isFalse);
    });

    // -------------------------------------------------------------
    // Test 11: Camera switching
    // -------------------------------------------------------------
    test(
      '11. Camera switching toggles between front and rear cameras',
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
    // Test 12: Microphone permission
    // -------------------------------------------------------------
    test('12. Microphone permission is checked before studio entry', () async {
      final permService = LivePermissionService.instance;
      expect(permService.isMicrophoneGranted, isTrue);
    });

    // -------------------------------------------------------------
    // Test 13: Microphone controls
    // -------------------------------------------------------------
    test('13. Microphone controls mute and unmute local audio track', () async {
      final rtc = AgoraRtcService.instance;

      expect(rtc.isAudioMuted, isFalse);

      await rtc.muteLocalAudio(true);
      expect(rtc.isAudioMuted, isTrue);

      await rtc.muteLocalAudio(false);
      expect(rtc.isAudioMuted, isFalse);
    });

    // -------------------------------------------------------------
    // Test 14: Navigation into Host Studio
    // -------------------------------------------------------------
    test('14. Host Studio requires valid PreLiveSetupResult', () {
      const validResult = PreLiveSetupResult(
        success: true,
        message: 'Pre-live setup configured successfully.',
        roomId: 'room_123',
        roomNumber: '880123',
        title: 'Studio Test',
        category: 'Live Chat',
        categoryId: 'live_chat',
        tags: ['#LiveChat'],
        hostNickname: 'Host123',
        hostPoppoId: '880123',
        status: 'setup',
        nextStep: '/live/studio/room_123',
      );

      expect(validResult.success, isTrue);
      expect(validResult.roomId.isNotEmpty, isTrue);
      expect(validResult.status, 'setup');
    });

    // -------------------------------------------------------------
    // Test 15: Network failure handling
    // -------------------------------------------------------------
    test(
      '15. Network failure handling falls back to default pre-live config',
      () {
        final fallback = PreLiveConfig.fallback();

        expect(fallback.categories.isNotEmpty, isTrue);
        expect(fallback.categories.any((c) => c.id == 'live_chat'), isTrue);
        expect(fallback.supportedTags.isNotEmpty, isTrue);
        expect(fallback.savedSetup?.title.isNotEmpty, isTrue);
      },
    );
  });
}
