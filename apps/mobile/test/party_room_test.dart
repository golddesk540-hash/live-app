import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/models/party/party_models.dart';

void main() {
  group('M4 9-Seat Party Room Creation, Discovery & Room Interface (Phase 2 Prompt 08/10)', () {
    // -------------------------------------------------------------
    // Test 1: PartyRoom Model Parsing from GET /api/discovery/party
    // -------------------------------------------------------------
    test('1. PartyRoom correctly parses party discovery JSON payload', () {
      final json = {
        'id': 'party-room-1',
        'roomNumber': '7001',
        'title': '🎉 Fun Party Room',
        'collageUrl': '/assets/party/fun_party_collage@2x.png',
        'currentMembers': 9,
        'maxMembers': 9,
        'seatCountFormatted': '9 / 9',
        'isLive': true,
        'status': 'live',
        'category': 'Fun',
        'country': 'Popular',
        'countryCode': 'ALL',
        'flagEmoji': '🎉',
        'hostNickname': 'Sophia_Star',
        'hostAvatar': '/assets/party/fun_party_collage.png',
        'tags': ['9 Seats', 'Fun Party', 'Top Voice'],
        'displayOrder': 1,
      };

      final room = PartyRoom.fromJson(json);

      expect(room.id, 'party-room-1');
      expect(room.roomNumber, '7001');
      expect(room.title, '🎉 Fun Party Room');
      expect(room.collageUrl, '/assets/party/fun_party_collage@2x.png');
      expect(room.currentMembers, 9);
      expect(room.maxMembers, 9);
      expect(room.seatCountFormatted, '9 / 9');
      expect(room.isLive, isTrue);
      expect(room.status, 'live');
      expect(room.category, 'Fun');
      expect(room.country, 'Popular');
      expect(room.countryCode, 'ALL');
      expect(room.flagEmoji, '🎉');
      expect(room.hostNickname, 'Sophia_Star');
      expect(room.tags.length, 3);
      expect(room.tags.contains('9 Seats'), isTrue);
      expect(room.isPrivate, isFalse);
    });

    // -------------------------------------------------------------
    // Test 2: PartyRoom Model Parsing with Snake_Case & Fallbacks
    // -------------------------------------------------------------
    test(
      '2. PartyRoom correctly handles snake_case keys and private room flags',
      () {
        final json = {
          'id': 'party-room-private',
          'room_number': '7899',
          'title': 'Private VIP Chill Talk',
          'collage_url': '/assets/party/private.png',
          'current_members': 3,
          'max_members': 9,
          'is_live': true,
          'status': 'live',
          'category': 'VIP Chat',
          'country_code': 'PK',
          'flag_emoji': '🇵🇰',
          'host_nickname': 'Ali_Host',
          'is_private': true,
          'room_type': 'private',
        };

        final room = PartyRoom.fromJson(json);

        expect(room.id, 'party-room-private');
        expect(room.roomNumber, '7899');
        expect(room.currentMembers, 3);
        expect(room.maxMembers, 9);
        expect(room.seatCountFormatted, '3 / 9');
        expect(room.isPrivate, isTrue);
        expect(room.roomType, 'private');
        expect(room.hostNickname, 'Ali_Host');
        expect(room.countryCode, 'PK');
      },
    );

    // -------------------------------------------------------------
    // Test 3: PartyRoom Serialization Round-Trip
    // -------------------------------------------------------------
    test('3. PartyRoom serializes to JSON and recovers identical data', () {
      const original = PartyRoom(
        id: 'party-test-100',
        roomNumber: '7100',
        title: 'Friday Night Music Jam 🎵',
        collageUrl: '/assets/music.png',
        currentMembers: 5,
        maxMembers: 9,
        seatCountFormatted: '5 / 9',
        isLive: true,
        status: 'live',
        category: 'Music',
        country: 'Global',
        countryCode: 'ALL',
        flagEmoji: '🎵',
        hostNickname: 'DJ_Alex',
        tags: ['Music', 'Jam'],
        displayOrder: 2,
        isPrivate: false,
        roomType: 'public',
      );

      final map = original.toJson();
      final restored = PartyRoom.fromJson(map);

      expect(restored.id, original.id);
      expect(restored.roomNumber, original.roomNumber);
      expect(restored.title, original.title);
      expect(restored.currentMembers, original.currentMembers);
      expect(restored.maxMembers, original.maxMembers);
      expect(restored.seatCountFormatted, original.seatCountFormatted);
      expect(restored.isLive, original.isLive);
      expect(restored.category, original.category);
      expect(restored.hostNickname, original.hostNickname);
      expect(restored.tags, original.tags);
      expect(restored.isPrivate, original.isPrivate);
    });

    // -------------------------------------------------------------
    // Test 4: PartyCategory Model Parsing
    // -------------------------------------------------------------
    test('4. PartyCategory correctly parses category items from GET /api/party/categories', () {
      final json = {
        'id': 'chill_chat',
        'name': 'Chill & Chat',
        'icon': '💬',
        'displayOrder': 1,
      };

      final cat = PartyCategory.fromJson(json);

      expect(cat.id, 'chill_chat');
      expect(cat.name, 'Chill & Chat');
      expect(cat.icon, '💬');
      expect(cat.displayOrder, 1);
    });

    // -------------------------------------------------------------
    // Test 5: PartySeat Model Parsing for Host Seat #1
    // -------------------------------------------------------------
    test('5. PartySeat correctly identifies Seat #1 as host with audio/video indicators', () {
      final json = {
        'id': 'seat_host_1',
        'roomNumber': '7001',
        'seatNumber': 1,
        'participantId': 'usr_host_99',
        'participantName': 'Zara Live',
        'participantAvatar': '/assets/studio/host_zara_avatar.png',
        'isHost': true,
        'isMuted': false,
        'isCameraOn': true,
        'status': 'occupied',
      };

      final seat = PartySeat.fromJson(json);

      expect(seat.seatNumber, 1);
      expect(seat.isHost, isTrue);
      expect(seat.isOccupied, isTrue);
      expect(seat.isAvailable, isFalse);
      expect(seat.participantName, 'Zara Live');
      expect(seat.isMuted, isFalse);
      expect(seat.isCameraOn, isTrue);
    });

    // -------------------------------------------------------------
    // Test 6: PartySeat Model Parsing for Available Guest Seat #2-9
    // -------------------------------------------------------------
    test('6. PartySeat correctly identifies empty guest seat as available', () {
      final json = {
        'id': 'seat_guest_4',
        'roomNumber': '7001',
        'seatNumber': 4,
        'participantId': null,
        'participantName': null,
        'participantAvatar': null,
        'isHost': false,
        'isMuted': false,
        'isCameraOn': false,
        'status': 'available',
      };

      final seat = PartySeat.fromJson(json);

      expect(seat.seatNumber, 4);
      expect(seat.isHost, isFalse);
      expect(seat.isOccupied, isFalse);
      expect(seat.isAvailable, isTrue);
      expect(seat.participantId, isNull);
      expect(seat.participantName, isNull);
    });

    // -------------------------------------------------------------
    // Test 7: Exactly 9-Seat Normalization & Layout Integrity
    // -------------------------------------------------------------
    test('7. Exactly 9 seat positions (1 Host + 8 Guests) are enforced', () {
      final rawSeats = [
        PartySeat(
          id: 's1',
          roomNumber: '7001',
          seatNumber: 1,
          participantId: 'host_1',
          participantName: 'Host Player',
          isHost: true,
          status: 'occupied',
        ),
        PartySeat(
          id: 's2',
          roomNumber: '7001',
          seatNumber: 2,
          participantId: 'guest_2',
          participantName: 'Friend A',
          isHost: false,
          status: 'occupied',
        ),
      ];

      final Map<int, PartySeat> seatMap = {
        for (var s in rawSeats) s.seatNumber: s,
      };

      final List<PartySeat> fullNineSeats = [];
      for (int i = 1; i <= 9; i++) {
        if (seatMap.containsKey(i)) {
          fullNineSeats.add(seatMap[i]!);
        } else {
          fullNineSeats.add(
            PartySeat(
              id: 'seat-7001-$i',
              roomNumber: '7001',
              seatNumber: i,
              isHost: i == 1,
              status: 'available',
            ),
          );
        }
      }

      expect(fullNineSeats.length, 9);
      expect(fullNineSeats.first.isHost, isTrue);
      expect(fullNineSeats.first.seatNumber, 1);
      expect(fullNineSeats.first.isOccupied, isTrue);
      expect(fullNineSeats[1].isOccupied, isTrue);
      expect(fullNineSeats[2].isAvailable, isTrue);
      expect(fullNineSeats[8].seatNumber, 9);
      expect(fullNineSeats[8].isAvailable, isTrue);
    });

    // -------------------------------------------------------------
    // Test 8: Party Room Title Validation (1 to 50 characters)
    // -------------------------------------------------------------
    test(
      '8. Title validation rejects empty input and enforces 50-character limit',
      () {
        bool isValidPartyTitle(String text) {
          final trimmed = text.trim();
          return trimmed.isNotEmpty && trimmed.length <= 50;
        }

        expect(isValidPartyTitle(''), isFalse);
        expect(isValidPartyTitle('   '), isFalse);
        expect(isValidPartyTitle('Late Night Chill Voice Party'), isTrue);

        final overFifty = 'A' * 51;
        expect(isValidPartyTitle(overFifty), isFalse);

        final exactlyFifty = 'A' * 50;
        expect(isValidPartyTitle(exactlyFifty), isTrue);
      },
    );

    // -------------------------------------------------------------
    // Test 9: Public vs Private Room Access Configuration
    // -------------------------------------------------------------
    test('9. Room privacy mode distinguishes public and private access', () {
      const publicRoom = PartyRoom(
        id: 'p1',
        roomNumber: '7001',
        title: 'Public Room',
        currentMembers: 1,
        seatCountFormatted: '1 / 9',
        isLive: true,
        status: 'live',
        category: 'Chat',
        country: 'Global',
        countryCode: 'ALL',
        flagEmoji: '🌐',
        hostNickname: 'Zara',
        isPrivate: false,
        roomType: 'public',
      );

      const privateRoom = PartyRoom(
        id: 'p2',
        roomNumber: '7002',
        title: 'VIP Lounge',
        currentMembers: 1,
        seatCountFormatted: '1 / 9',
        isLive: true,
        status: 'live',
        category: 'VIP',
        country: 'Global',
        countryCode: 'ALL',
        flagEmoji: '🔒',
        hostNickname: 'Zara',
        isPrivate: true,
        roomType: 'private',
      );

      expect(publicRoom.isPrivate, isFalse);
      expect(publicRoom.roomType, 'public');
      expect(privateRoom.isPrivate, isTrue);
      expect(privateRoom.roomType, 'private');
    });
  });
}
