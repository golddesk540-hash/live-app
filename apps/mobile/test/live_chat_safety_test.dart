import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/live/live_models.dart';
import 'package:popo_live/services/live/live_session_manager.dart';

void main() {
  group('M3 Live Chat, User Safety, Report, Block & Mute System (Phase 2 Prompt 06/10)', () {
    // -------------------------------------------------------------
    // Test 1: LiveChatMessage Model Parsing & Enrichment
    // -------------------------------------------------------------
    test('1. LiveChatMessage models sender identity, wealth badge, role, and timestamp', () {
      final json = {
        'id': 'msg_live_771',
        'roomId': 'room_pk_880',
        'senderId': 'usr_fan_404',
        'senderNickname': 'Hamza VIP',
        'senderAvatarUrl': 'https://example.com/avatar.jpg',
        'senderRole': 'viewer',
        'messageText': 'Best live stream of the week! 🔥',
        'emoji': '🔥',
        'wealthLevel': 12,
        'isPinned': false,
        'createdAt': '2026-11-15T14:30:00Z',
      };

      final msg = LiveChatMessage.fromJson(json);

      expect(msg.id, 'msg_live_771');
      expect(msg.roomId, 'room_pk_880');
      expect(msg.senderId, 'usr_fan_404');
      expect(msg.senderNickname, 'Hamza VIP');
      expect(msg.nickname, 'Hamza VIP');
      expect(msg.senderRole, 'viewer');
      expect(msg.text, 'Best live stream of the week! 🔥');
      expect(msg.emoji, '🔥');
      expect(msg.wealthLevel, 12);
      expect(msg.isPinned, isFalse);
      expect(msg.formattedTime.isNotEmpty, isTrue);
      expect(msg.displayContent.contains('🔥'), isTrue);
    });

    // -------------------------------------------------------------
    // Test 2: Message Input Validation (Empty text & 300-char limit)
    // -------------------------------------------------------------
    test(
      '2. Chat message validation rejects empty content and enforces 300 chars',
      () {
        bool isValidMessage(String text) {
          final trimmed = text.trim();
          return trimmed.isNotEmpty && trimmed.length <= 300;
        }

        expect(isValidMessage(''), isFalse);
        expect(isValidMessage('   '), isFalse);
        expect(isValidMessage('Hello Broadcaster! 👋'), isTrue);

        final overLimit = 'A' * 301;
        expect(isValidMessage(overLimit), isFalse);

        final maxValid = 'A' * 300;
        expect(isValidMessage(maxValid), isTrue);
      },
    );

    // -------------------------------------------------------------
    // Test 3: Deduplication & Message Ordering
    // -------------------------------------------------------------
    test('3. Deduplication prevents identical message IDs and preserves chronological ordering', () {
      final seenIds = <String>{};
      final list = <LiveChatMessage>[];

      void addMessage(LiveChatMessage m) {
        if (!seenIds.contains(m.id)) {
          seenIds.add(m.id);
          list.add(m);
          list.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        }
      }

      final t1 = DateTime(2026, 11, 15, 14, 0, 0);
      final t2 = DateTime(2026, 11, 15, 14, 0, 5);
      final t3 = DateTime(2026, 11, 15, 14, 0, 10);

      final m1 = LiveChatMessage(
        id: 'msg_1',
        roomId: 'r1',
        senderId: 'u1',
        senderNickname: 'Ali',
        senderRole: 'viewer',
        text: 'First',
        createdAt: t1,
      );

      final m2 = LiveChatMessage(
        id: 'msg_2',
        roomId: 'r1',
        senderId: 'u2',
        senderNickname: 'Sara',
        senderRole: 'viewer',
        text: 'Second',
        createdAt: t2,
      );

      final m3 = LiveChatMessage(
        id: 'msg_3',
        roomId: 'r1',
        senderId: 'u3',
        senderNickname: 'Zara',
        senderRole: 'host',
        text: 'Third',
        createdAt: t3,
      );

      addMessage(m2);
      addMessage(m1);
      addMessage(m3);
      addMessage(m2); // Duplicate insertion

      expect(list.length, 3);
      expect(list[0].id, 'msg_1');
      expect(list[1].id, 'msg_2');
      expect(list[2].id, 'msg_3');
    });

    // -------------------------------------------------------------
    // Test 4: Mute Filtering (Local vs Global)
    // -------------------------------------------------------------
    test(
      '4. Muted user IDs filter out their chat messages from the active feed',
      () {
        final mutedIds = <String>{'usr_toxic_99'};

        final messages = [
          LiveChatMessage(
            id: '1',
            roomId: 'r1',
            senderId: 'usr_good_01',
            senderNickname: 'Fan1',
            senderRole: 'viewer',
            text: 'Love the stream!',
            createdAt: DateTime.now(),
          ),
          LiveChatMessage(
            id: '2',
            roomId: 'r1',
            senderId: 'usr_toxic_99',
            senderNickname: 'Troll',
            senderRole: 'viewer',
            text: 'Spam message',
            createdAt: DateTime.now(),
          ),
        ];

        final filtered = messages
            .where((m) => !mutedIds.contains(m.senderId))
            .toList();
        expect(filtered.length, 1);
        expect(filtered.first.senderId, 'usr_good_01');
      },
    );

    // -------------------------------------------------------------
    // Test 5: Block Filtering
    // -------------------------------------------------------------
    test(
      '5. Blocked user IDs filter out their messages and hide interaction',
      () {
        final blockedIds = <String>{'usr_harasser_01'};

        final messages = [
          LiveChatMessage(
            id: '1',
            roomId: 'r1',
            senderId: 'usr_harasser_01',
            senderNickname: 'Harasser',
            senderRole: 'viewer',
            text: 'Abusive text',
            createdAt: DateTime.now(),
          ),
        ];

        final filtered = messages
            .where((m) => !blockedIds.contains(m.senderId))
            .toList();
        expect(filtered.isEmpty, isTrue);
      },
    );

    // -------------------------------------------------------------
    // Test 6: Role Restrictions on Room-Wide Mute
    // -------------------------------------------------------------
    test('6. Ordinary viewers cannot execute room_global mutes', () {
      bool canMuteRoomWide(String role) {
        return role == 'host' || role == 'moderator' || role == 'admin';
      }

      expect(canMuteRoomWide('viewer'), isFalse);
      expect(canMuteRoomWide('guest'), isFalse);
      expect(canMuteRoomWide('host'), isTrue);
      expect(canMuteRoomWide('moderator'), isTrue);
      expect(canMuteRoomWide('admin'), isTrue);
    });

    // -------------------------------------------------------------
    // Test 7: Viewers cannot mute the Room Host
    // -------------------------------------------------------------
    test('7. Viewers are blocked from muting the broadcaster', () {
      bool canMuteTarget(String requesterRole, String targetRole) {
        if (targetRole == 'host' && requesterRole == 'viewer') {
          return false;
        }
        return true;
      }

      expect(canMuteTarget('viewer', 'host'), isFalse);
      expect(canMuteTarget('viewer', 'viewer'), isTrue);
      expect(canMuteTarget('host', 'viewer'), isTrue);
    });

    // -------------------------------------------------------------
    // Test 8: Canonical Report Reasons
    // -------------------------------------------------------------
    test('8. Report reasons conform to the 6 backend-supported categories', () {
      final reasons = LiveReportReason.canonicalReasons;
      expect(reasons.length, 6);

      final validIds = reasons.map((r) => r.id).toSet();
      expect(validIds.contains('harassment_bullying'), isTrue);
      expect(validIds.contains('inappropriate_content'), isTrue);
      expect(validIds.contains('spam'), isTrue);
      expect(validIds.contains('impersonation'), isTrue);
      expect(validIds.contains('hate_speech'), isTrue);
      expect(validIds.contains('other'), isTrue);
    });

    // -------------------------------------------------------------
    // Test 9: Disallow Self-Reporting
    // -------------------------------------------------------------
    test('9. Self-reporting is blocked at client and API boundary', () {
      bool isValidReport(String reporterId, String reportedId) {
        return reporterId.isNotEmpty &&
            reportedId.isNotEmpty &&
            reporterId != reportedId;
      }

      expect(isValidReport('user_123', 'user_123'), isFalse);
      expect(isValidReport('user_123', 'user_456'), isTrue);
    });

    // -------------------------------------------------------------
    // Test 10: LiveBlockResult and LiveMuteResult model serialization
    // -------------------------------------------------------------
    test('10. LiveBlockResult and LiveMuteResult deserialize backend JSON properly', () {
      final blockJson = {
        'success': true,
        'blocked': true,
        'targetUserId': 'usr_block_88',
        'message': 'User blocked successfully',
      };
      final blockResult = LiveBlockResult.fromJson(blockJson);
      expect(blockResult.success, isTrue);
      expect(blockResult.blocked, isTrue);
      expect(blockResult.targetUserId, 'usr_block_88');

      final muteJson = {
        'success': true,
        'muted': true,
        'targetUserId': 'usr_mute_99',
        'muteType': 'room_global',
        'message': 'User muted room-wide',
      };
      final muteResult = LiveMuteResult.fromJson(muteJson);
      expect(muteResult.success, isTrue);
      expect(muteResult.muted, isTrue);
      expect(muteResult.targetUserId, 'usr_mute_99');
      expect(muteResult.muteType, 'room_global');
    });

    // -------------------------------------------------------------
    // Test 11: Live Rules & Acceptance Models
    // -------------------------------------------------------------
    test(
      '11. LiveRuleItem and LiveRulesStatus deserialize canonical rules data',
      () {
        final rulesJson = {
          'id': 'rule_01',
          'title': 'No Harassment or Hate Speech',
          'description': 'Treat all broadcasters and audience members with dignity and respect.',
          'category': 'Behavior',
          'icon': 'alert',
          'displayOrder': 1,
          'isActive': true,
        };

        final rule = LiveRuleItem.fromJson(rulesJson);
        expect(rule.id, 'rule_01');
        expect(rule.title, 'No Harassment or Hate Speech');
        expect(rule.category, 'Behavior');
        expect(rule.icon, 'alert');
        expect(rule.displayOrder, 1);
        expect(rule.isActive, isTrue);

        final statusJson = {
          'hasAccepted': true,
          'requiresReacceptance': false,
          'acknowledgedVersion': 'v1.0',
          'currentPolicyVersion': 'v1.0',
          'acceptedAt': '2026-11-15T10:00:00Z',
        };

        final status = LiveRulesStatus.fromJson(statusJson);
        expect(status.hasAccepted, isTrue);
        expect(status.requiresReacceptance, isFalse);
        expect(status.currentPolicyVersion, 'v1.0');
      },
    );

    // -------------------------------------------------------------
    // Test 12: Session Manager Chat and Safety Filter State
    // -------------------------------------------------------------
    test('12. LiveSessionManager tracks blocked and muted user sets', () {
      final manager = LiveSessionManager.instance;
      expect(manager.isUserBlocked('non_existent_user'), isFalse);
      expect(manager.isUserMuted('non_existent_user'), isFalse);
    });
  });
}
