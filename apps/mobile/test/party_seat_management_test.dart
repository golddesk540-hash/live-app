import '../lib/models/party/party_models.dart';

int _passCount = 0;
int _failCount = 0;

void test(String name, void Function() body) {
  try {
    body();
    _passCount++;
    print('  ✓ $name');
  } catch (e, stack) {
    _failCount++;
    print('  ✗ FAIL: $name\n    $e\n$stack');
  }
}

void expect(dynamic actual, dynamic matcher) {
  if (matcher == _isTrue) {
    if (actual != true) throw Exception('Expected true, got $actual');
  } else if (matcher == _isFalse) {
    if (actual != false) throw Exception('Expected false, got $actual');
  } else if (matcher == _isNull) {
    if (actual != null) throw Exception('Expected null, got $actual');
  } else if (matcher == _isNotNull) {
    if (actual == null) throw Exception('Expected non-null value, got null');
  } else {
    if (actual != matcher) {
      throw Exception('Expected $matcher, got $actual');
    }
  }
}

const _isTrue = '__TRUE__';
const _isFalse = '__FALSE__';
const _isNull = '__NULL__';
const _isNotNull = '__NOT_NULL__';

dynamic get isTrue => _isTrue;
dynamic get isFalse => _isFalse;
dynamic get isNull => _isNull;
dynamic get isNotNull => _isNotNull;

void main() {
  print(
    '======================================================================',
  );
  print('POPO LIVE — PHASE 2 — PROMPT 09/10: 9-SEAT MANAGEMENT UNIT TESTS');
  print(
    '======================================================================\n',
  );

  // -------------------------------------------------------------
  // Test 1: PartySeat Occupied vs Available Status
  // -------------------------------------------------------------
  test('1. PartySeat correctly recognizes occupied vs available state', () {
    final occupiedJson = {
      'id': 'seat-7001-2',
      'roomNumber': '7001',
      'seatNumber': 2,
      'participantId': 'user_vip_42',
      'participantName': 'Zara_Live',
      'participantAvatar': '/assets/avatars/zara.png',
      'isHost': false,
      'isMuted': false,
      'isCameraOn': true,
      'isHostMuted': false,
      'status': 'occupied',
      'occupiedAt': '2026-11-16T08:00:00Z',
    };

    final availableJson = {
      'id': 'seat-7001-3',
      'roomNumber': '7001',
      'seatNumber': 3,
      'participantId': null,
      'participantName': null,
      'isHost': false,
      'isMuted': false,
      'isCameraOn': false,
      'status': 'available',
    };

    final occupiedSeat = PartySeat.fromJson(occupiedJson);
    final availableSeat = PartySeat.fromJson(availableJson);

    expect(occupiedSeat.isOccupied, isTrue);
    expect(occupiedSeat.isAvailable, isFalse);
    expect(occupiedSeat.seatNumber, 2);
    expect(occupiedSeat.participantName, 'Zara_Live');
    expect(occupiedSeat.isCameraOn, isTrue);

    expect(availableSeat.isOccupied, isFalse);
    expect(availableSeat.isAvailable, isTrue);
    expect(availableSeat.seatNumber, 3);
    expect(availableSeat.participantId, isNull);
  });

  // -------------------------------------------------------------
  // Test 2: Host Seat (Seat #1) Protection & Recognition
  // -------------------------------------------------------------
  test(
    '2. Seat 1 is recognized as Host Seat even without explicit isHost flag',
    () {
      final seat1Json = {
        'id': 'seat-7001-1',
        'roomNumber': '7001',
        'seatNumber': 1,
        'participantId': 'host_7001',
        'participantName': 'Maria Host',
        'status': 'occupied',
      };

      final seat1 = PartySeat.fromJson(seat1Json);
      expect(seat1.seatNumber, 1);
      expect(seat1.isHost, isTrue);
      expect(seat1.isOccupied, isTrue);
      expect(seat1.participantName, 'Maria Host');
    },
  );

  // -------------------------------------------------------------
  // Test 3: Host Remote Mute State Synchronization
  // -------------------------------------------------------------
  test(
    '3. PartySeat correctly reflects isHostMuted state when host mutes guest',
    () {
      final hostMutedJson = {
        'id': 'seat-7001-4',
        'roomNumber': '7001',
        'seatNumber': 4,
        'participantId': 'user_noisy',
        'participantName': 'Noisy Guest',
        'isMuted': true,
        'isHostMuted': true,
        'status': 'occupied',
      };

      final seat = PartySeat.fromJson(hostMutedJson);
      expect(seat.seatNumber, 4);
      expect(seat.isMuted, isTrue);
      expect(seat.isHostMuted, isTrue);
    },
  );

  // -------------------------------------------------------------
  // Test 4: PartySeatRequest Model & Lifecycle Status
  // -------------------------------------------------------------
  test(
    '4. PartySeatRequest correctly parses pending request and status checks',
    () {
      final requestJson = {
        'id': 'req-9876',
        'roomNumber': '7001',
        'seatNumber': 5,
        'userId': 'viewer_101',
        'userName': 'Ahmed Singer',
        'userAvatar': '/assets/avatars/ahmed.png',
        'status': 'pending',
        'createdAt': '2026-11-16T08:05:00Z',
        'expiresAt': '2026-11-16T08:07:00Z',
      };

      final req = PartySeatRequest.fromJson(requestJson);
      expect(req.id, 'req-9876');
      expect(req.roomNumber, '7001');
      expect(req.seatNumber, 5);
      expect(req.userId, 'viewer_101');
      expect(req.userName, 'Ahmed Singer');
      expect(req.status, 'pending');
      expect(req.isPending, isTrue);
      expect(req.createdAt != null, isTrue);
      expect(req.expiresAt != null, isTrue);
    },
  );

  // -------------------------------------------------------------
  // Test 5: PartySeatInvitation Model & Lifecycle Status
  // -------------------------------------------------------------
  test(
    '5. PartySeatInvitation correctly parses host invitation to audience',
    () {
      final inviteJson = {
        'id': 'inv-4433',
        'roomNumber': '7001',
        'seatNumber': 6,
        'hostId': 'host_7001',
        'invitedUserId': 'vip_listener_99',
        'invitedUserName': 'Fatima VIP',
        'invitedUserAvatar': '/assets/avatars/fatima.png',
        'status': 'pending',
        'createdAt': '2026-11-16T08:10:00Z',
        'expiresAt': '2026-11-16T08:12:00Z',
      };

      final inv = PartySeatInvitation.fromJson(inviteJson);
      expect(inv.id, 'inv-4433');
      expect(inv.roomNumber, '7001');
      expect(inv.seatNumber, 6);
      expect(inv.hostId, 'host_7001');
      expect(inv.invitedUserId, 'vip_listener_99');
      expect(inv.invitedUserName, 'Fatima VIP');
      expect(inv.status, 'pending');
      expect(inv.isPending, isTrue);
    },
  );

  // -------------------------------------------------------------
  // Test 6: PartyAudienceMember Model Parsing & Presence
  // -------------------------------------------------------------
  test(
    '6. PartyAudienceMember correctly parses listener details and level',
    () {
      final audienceJson = {
        'id': 'aud-1',
        'roomNumber': '7001',
        'userId': 'aud_user_77',
        'userName': 'Sam Listener',
        'userAvatar': '/assets/avatars/sam.png',
        'userLevel': 15,
        'isActive': true,
        'joinedAt': '2026-11-16T08:01:00Z',
      };

      final member = PartyAudienceMember.fromJson(audienceJson);
      expect(member.id, 'aud-1');
      expect(member.roomNumber, '7001');
      expect(member.userId, 'aud_user_77');
      expect(member.userName, 'Sam Listener');
      expect(member.userLevel, 15);
      expect(member.isActive, isTrue);
      expect(member.joinedAt != null, isTrue);
    },
  );

  // -------------------------------------------------------------
  // Test 7: PartyChatMessage Role Badging & Formatting
  // -------------------------------------------------------------
  test('7. PartyChatMessage identifies host, speaker, and audience roles', () {
    final hostMsgJson = {
      'id': 'msg-1',
      'roomNumber': '7001',
      'senderId': 'host_7001',
      'senderName': 'Host Maria',
      'senderRole': 'host',
      'seatNumber': 1,
      'messageText': 'Welcome to the 9-Seat Party Room! 🎉',
      'createdAt': '2026-11-16T08:02:00Z',
    };

    final speakerMsgJson = {
      'id': 'msg-2',
      'roomNumber': '7001',
      'senderId': 'speaker_2',
      'senderName': 'Zara Guest',
      'senderRole': 'speaker',
      'seatNumber': 2,
      'messageText': 'Thanks for having me on Seat 2! 🎵',
      'createdAt': '2026-11-16T08:03:00Z',
    };

    final audienceMsgJson = {
      'id': 'msg-3',
      'roomNumber': '7001',
      'senderId': 'aud_user_9',
      'senderName': 'Casual Listener',
      'senderRole': 'audience',
      'messageText': 'Love this conversation! ❤️',
      'createdAt': '2026-11-16T08:04:00Z',
    };

    final hostMsg = PartyChatMessage.fromJson(hostMsgJson);
    final speakerMsg = PartyChatMessage.fromJson(speakerMsgJson);
    final audMsg = PartyChatMessage.fromJson(audienceMsgJson);

    expect(hostMsg.isHost, isTrue);
    expect(hostMsg.seatNumber, 1);

    expect(speakerMsg.isSpeaker, isTrue);
    expect(speakerMsg.isHost, isFalse);
    expect(speakerMsg.seatNumber, 2);

    expect(audMsg.isHost, isFalse);
    expect(audMsg.isSpeaker, isFalse);
    expect(audMsg.seatNumber, isNull);
  });

  // -------------------------------------------------------------
  // Test 8: PartyMediaToken Agora RTC Token Parsing
  // -------------------------------------------------------------
  test('8. PartyMediaToken correctly parses token configuration and mode', () {
    final tokenJson = {
      'isConfigured': true,
      'appId': 'agora_test_appid_123',
      'channelName': 'party_7001',
      'uid': 700003,
      'token': 'rtc_token_valid_hash_xyz',
      'role': 'publisher',
      'expiresInSeconds': 86400,
      'mode': 'agora_cloud_rtc',
      'message': 'Secure Agora RTC token generated successfully.',
    };

    final token = PartyMediaToken.fromJson(tokenJson);
    expect(token.isConfigured, isTrue);
    expect(token.appId, 'agora_test_appid_123');
    expect(token.channelName, 'party_7001');
    expect(token.uid, 700003);
    expect(token.token, 'rtc_token_valid_hash_xyz');
    expect(token.role, 'publisher');
    expect(token.mode, 'agora_cloud_rtc');
  });

  // -------------------------------------------------------------
  // Test 9: Serialization & Round-Trip Fidelity
  // -------------------------------------------------------------
  test(
    '9. All party seat models serialize to JSON and recover identical data',
    () {
      const originalSeat = PartySeat(
        id: 'seat-7001-7',
        roomNumber: '7001',
        seatNumber: 7,
        participantId: 'user_roundtrip',
        participantName: 'Roundtrip Tester',
        isHost: false,
        isMuted: true,
        isCameraOn: false,
        isHostMuted: false,
        status: 'occupied',
      );

      final json = originalSeat.toJson();
      final restored = PartySeat.fromJson(json);

      expect(restored.id, originalSeat.id);
      expect(restored.roomNumber, originalSeat.roomNumber);
      expect(restored.seatNumber, originalSeat.seatNumber);
      expect(restored.participantId, originalSeat.participantId);
      expect(restored.participantName, originalSeat.participantName);
      expect(restored.isMuted, originalSeat.isMuted);
      expect(restored.status, originalSeat.status);
    },
  );

  print(
    '\n======================================================================',
  );
  print('UNIT TESTS COMPLETE: $_passCount PASSED, $_failCount FAILED');
  print(
    '======================================================================\n',
  );

  if (_failCount > 0) {
    throw Exception('$_failCount unit tests failed');
  }
}
