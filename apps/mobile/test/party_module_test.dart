import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/party/create_party_screen.dart';
import 'package:popo_live/screens/party/party_discovery_screen.dart';
import 'package:popo_live/screens/party/party_room_screen.dart';

/// 1x1 transparent PNG for mock HTTP image responses
final Uint8List _kTransparentImageBytes = Uint8List.fromList(<int>[
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x06,
  0x00,
  0x00,
  0x00,
  0x1F,
  0x15,
  0xC4,
  0x89,
  0x00,
  0x00,
  0x00,
  0x0A,
  0x49,
  0x44,
  0x41,
  0x54,
  0x78,
  0x9C,
  0x63,
  0x00,
  0x01,
  0x00,
  0x00,
  0x05,
  0x00,
  0x01,
  0x0D,
  0x0A,
  0x2D,
  0xB4,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
  0x42,
  0x60,
  0x82
]);

class _TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) => _MockHttpClient();
}

class _MockHttpClient extends Fake implements HttpClient {
  @override
  bool autoUncompress = true;

  @override
  Future<HttpClientRequest> getUrl(Uri url) async => _MockHttpClientRequest();

  @override
  Future<HttpClientRequest> postUrl(Uri url) async => _MockHttpClientRequest();

  @override
  Future<HttpClientRequest> openUrl(String method, Uri url) async =>
      _MockHttpClientRequest();

  @override
  void close({bool force = false}) {}
}

class _MockHttpClientRequest extends Fake implements HttpClientRequest {
  @override
  final HttpHeaders headers = _MockHttpHeaders();

  @override
  void add(List<int> data) {}

  @override
  void write(Object? obj) {}

  @override
  void writeln([Object? obj = ""]) {}

  @override
  Future<HttpClientResponse> close() async => _MockHttpClientResponse();
}

class _MockHttpHeaders extends Fake implements HttpHeaders {
  @override
  void set(String name, Object value, {bool preserveHeaderCase = false}) {}
}

class _MockHttpClientResponse extends Fake implements HttpClientResponse {
  @override
  int get statusCode => 200;

  @override
  int get contentLength => _kTransparentImageBytes.length;

  @override
  HttpClientResponseCompressionState get compressionState =>
      HttpClientResponseCompressionState.notCompressed;

  @override
  StreamSubscription<List<int>> listen(
    void Function(List<int> event)? onData, {
    Function? onError,
    void Function()? onDone,
    bool? cancelOnError,
  }) {
    return Stream<List<int>>.fromIterable([_kTransparentImageBytes]).listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }
}

void _setPhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 1.0;
}

Widget _buildTestApp(Widget home) {
  return MaterialApp(
    home: home,
  );
}

void main() {
  setUpAll(() {
    HttpOverrides.global = _TestHttpOverrides();
  });

  setUp(() {
    DesignFixtures.currentState = DesignFixtureState.filled;
  });

  tearDown(() {
    DesignFixtures.currentState = DesignFixtureState.filled;
  });

  group('POPO LIVE - PHASE 4 (D3) - PARTY MODULE TEST SUITE', () {
    // -------------------------------------------------------------
    // Test 1: Following and Party tabs switch smoothly
    // -------------------------------------------------------------
    testWidgets('1. Following and Party tabs switch smoothly',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      // Verify TabBar exists with Following and Party
      expect(find.byKey(const Key('party_tab_bar')), findsOneWidget);
      expect(find.byKey(const Key('party_tab_following')), findsOneWidget);
      expect(find.byKey(const Key('party_tab_party')), findsOneWidget);

      // Default is Party tab (initialIndex: 1)
      expect(find.byKey(const Key('party_country_chip_ALL')), findsOneWidget);

      // Switch to Following tab
      await tester.tap(find.byKey(const Key('party_tab_following')));
      await tester.pumpAndSettle();

      // Verify followed room cards are displayed
      expect(
          find.byKey(const Key('party_room_card_party_001')), findsOneWidget);

      // Switch back to Party tab
      await tester.tap(find.byKey(const Key('party_tab_party')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('party_country_chip_ALL')), findsOneWidget);
    });

    // -------------------------------------------------------------
    // Test 2: Country selection chips filter Party rooms
    // -------------------------------------------------------------
    testWidgets('2. Country chips filter Party rooms correctly',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      // ALL should display all 6 rooms
      expect(
          find.byKey(const Key('party_room_card_party_001')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_002')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_003')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_004')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_005')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_006')), findsOneWidget);

      // Tap Pakistan (PK) chip - all 6 fixture rooms belong to PK region
      await tester.tap(find.byKey(const Key('party_country_chip_PK')));
      await tester.pumpAndSettle();

      expect(
          find.byKey(const Key('party_room_card_party_001')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_002')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_006')), findsOneWidget);

      // Tap United Arab Emirates (AE) chip - zero rooms in AE in fixture dataset
      await tester.tap(find.byKey(const Key('party_country_chip_AE')));
      await tester.pumpAndSettle();

      // Empty country state must be displayed
      expect(find.byKey(const Key('party_empty_country_state')), findsOneWidget);
      expect(find.byKey(const Key('party_room_card_party_001')), findsNothing);

      // Tap Turkey (TR) chip - zero rooms in TR in fixture dataset
      await tester.tap(find.byKey(const Key('party_country_chip_TR')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('party_empty_country_state')), findsOneWidget);
      expect(find.byKey(const Key('party_room_card_party_001')), findsNothing);

      // Tap ALL to restore all rooms
      await tester.tap(find.byKey(const Key('party_country_chip_ALL')));
      await tester.pumpAndSettle();
      expect(
          find.byKey(const Key('party_room_card_party_001')), findsOneWidget);
      expect(
          find.byKey(const Key('party_room_card_party_006')), findsOneWidget);
    });

    // -------------------------------------------------------------
    // Test 3: Party room cards display correct fixture information
    // -------------------------------------------------------------
    testWidgets('3. Party room cards show title, host, country and seat count',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      // Check party_001 details
      expect(find.text('Late Night Tea House & Chai Pe Charcha ☕'),
          findsOneWidget);
      expect(find.text('Amina Noor'), findsOneWidget);
      expect(find.text('5/9 Seats'), findsOneWidget);
      expect(find.text('ChitChat'), findsWidgets);
      expect(find.text('LIVE AUDIO'), findsWidgets);
    });

    // -------------------------------------------------------------
    // Test 4: Orange PARTY button opens Create Party screen
    // -------------------------------------------------------------
    testWidgets('4. Orange PARTY button opens CreatePartyScreen',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('orange_party_button')), findsOneWidget);
      expect(find.text('PARTY'), findsOneWidget);

      await tester.tap(find.byKey(const Key('orange_party_button')));
      await tester.pumpAndSettle();

      // Create Party screen is pushed
      expect(find.text('Create 9-Seat Party Lounge'), findsOneWidget);
      expect(find.byKey(const Key('create_party_title_input')), findsOneWidget);
      expect(
          find.byKey(const Key('confirm_create_party_button')), findsOneWidget);
    });

    // -------------------------------------------------------------
    // Test 5: Create Party screen validates title and creates room
    // -------------------------------------------------------------
    testWidgets('5. CreatePartyScreen validates title and creates local room',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      FixturePartyRoom? createdRoom;

      await tester.pumpWidget(
        _buildTestApp(
          CreatePartyScreen(
            onRoomCreated: (room) => createdRoom = room,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify category chips
      expect(find.text('Chill & Chat'), findsOneWidget);
      expect(find.text('9 SEATS'), findsOneWidget);

      // Clear title to test empty validation
      await tester.enterText(
          find.byKey(const Key('create_party_title_input')), '');
      await tester.tap(find.byKey(const Key('confirm_create_party_button')));
      await tester.pumpAndSettle();

      expect(find.text('Party title cannot be empty.'), findsOneWidget);
      expect(createdRoom, isNull);

      // Enter valid title and submit
      await tester.enterText(
        find.byKey(const Key('create_party_title_input')),
        'Karachi Acoustic Showcase 🎸',
      );
      await tester.tap(find.byKey(const Key('confirm_create_party_button')));
      await tester.pumpAndSettle();

      expect(createdRoom, isNotNull);
      expect(createdRoom!.title, 'Karachi Acoustic Showcase 🎸');
      expect(createdRoom!.maxSeats, 9);
      expect(createdRoom!.seats.length, 9);
      expect(createdRoom!.seats[0].isHost, isTrue);
      expect(createdRoom!.seats[1].isOccupied, isFalse);
    });

    // -------------------------------------------------------------
    // Test 6: Party Room screen displays header and exactly 9 seats
    // -------------------------------------------------------------
    testWidgets('6. PartyRoomScreen displays header and exactly 9 seats',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      final room = DesignFixtures.partyRooms.first; // party_001

      await tester.pumpWidget(_buildTestApp(PartyRoomScreen(room: room)));
      await tester.pumpAndSettle();

      // Header verification: exact room title
      expect(find.text('Late Night Tea House & Chai Pe Charcha ☕'),
          findsOneWidget);
      expect(find.text('Amina Noor'), findsWidgets);
      expect(find.text('#771001'), findsOneWidget);
      expect(find.byKey(const Key('party_room_close_button')), findsOneWidget);

      // Exactly 9 seats must exist
      for (int i = 1; i <= 9; i++) {
        expect(find.byKey(Key('party_seat_$i')), findsOneWidget);
      }

      // Seat 1 must show HOST badge
      expect(find.text('HOST'), findsWidgets);
    });

    // -------------------------------------------------------------
    // Test 7: Requesting an available seat occupies it locally
    // -------------------------------------------------------------
    testWidgets('7. Available seat request occupies seat locally',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      // party_002: Host is Zainab Khan, current user is audience member, seats 4..9 are empty
      final room = DesignFixtures.partyRooms[1];

      await tester.pumpWidget(_buildTestApp(PartyRoomScreen(room: room)));
      await tester.pumpAndSettle();

      // Seat 4 is initially empty
      expect(find.byKey(const Key('seat_request_button_4')), findsOneWidget);

      // Tap Seat 4 to open seat request sheet
      await tester.tap(find.byKey(const Key('party_seat_4')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Seat #4'), findsWidgets);
      expect(
          find.byKey(const Key('confirm_seat_request_button')), findsOneWidget);

      // Confirm taking Seat 4
      await tester.tap(find.byKey(const Key('confirm_seat_request_button')));
      await tester.pumpAndSettle();

      // User occupies Seat 4
      expect(find.text('You'), findsOneWidget);
      expect(find.textContaining('Seat #4 occupied'), findsOneWidget);

      // Microphone button is now active
      expect(find.text('Mic On'), findsOneWidget);
    });

    // -------------------------------------------------------------
    // Test 8: Occupied seats cannot be requested
    // -------------------------------------------------------------
    testWidgets('8. Occupied seats show profile and cannot be requested',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      final room =
          DesignFixtures.partyRooms.first; // party_001, seat 2 is Sana Ali

      await tester.pumpWidget(_buildTestApp(PartyRoomScreen(room: room)));
      await tester.pumpAndSettle();

      // Tap occupied Seat 2
      await tester.tap(find.byKey(const Key('party_seat_2')));
      await tester.pumpAndSettle();

      // Modal shows profile info and notice that occupied seat cannot be requested
      expect(find.byKey(const Key('party_seat_profile_2')), findsOneWidget);
      expect(
        find.text(
            'This seat is currently occupied. Occupied seats cannot be requested.'),
        findsOneWidget,
      );
      expect(
          find.byKey(const Key('confirm_seat_request_button')), findsNothing);
    });

    // -------------------------------------------------------------
    // Test 9: Microphone controls toggle state and respect permission
    // -------------------------------------------------------------
    testWidgets(
        '9. Microphone controls toggle state and handle permission denial',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      // party_002: Host is Zainab Khan, user is unseated audience initially
      final room = DesignFixtures.partyRooms[1];

      await tester.pumpWidget(_buildTestApp(PartyRoomScreen(room: room)));
      await tester.pumpAndSettle();

      // User is not seated initially
      expect(find.text('Take Seat'), findsOneWidget);

      // Tapping mic while unseated shows feedback
      await tester.tap(find.byKey(const Key('party_mic_button')));
      await tester.pumpAndSettle();
      expect(
        find.text('You must take an available seat to speak in the lounge.'),
        findsOneWidget,
      );

      // Take Seat 5
      await tester.tap(find.byKey(const Key('party_seat_5')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('confirm_seat_request_button')));
      await tester.pumpAndSettle();
      // Wait for occupation SnackBar to dismiss so mic button is uncovered
      await tester.pump(const Duration(seconds: 3));
      await tester.pumpAndSettle();

      // Now user is seated and mic is active
      expect(find.text('Mic On'), findsOneWidget);

      // Toggle mic to Muted
      await tester.tap(find.byKey(const Key('party_mic_button')));
      await tester.pumpAndSettle();
      expect(find.text('Muted'), findsOneWidget);

      // Dismiss mute SnackBar
      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();

      // Toggle mic back to Mic On
      await tester.tap(find.byKey(const Key('party_mic_button')));
      await tester.pumpAndSettle();
      expect(find.text('Mic On'), findsOneWidget);

      // Dismiss unmute SnackBar
      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();

      // Simulate permission denial
      await tester.tap(find.byKey(const Key('toggle_mic_permission_button')));
      await tester.pumpAndSettle();
      await tester.pump(const Duration(seconds: 3));
      await tester.pumpAndSettle();

      // Tapping mic with permission denied shows error notice
      await tester.tap(find.byKey(const Key('party_mic_button')));
      await tester.pumpAndSettle();
      expect(
        find.textContaining('Microphone permission is denied'),
        findsOneWidget,
      );
    });

    // -------------------------------------------------------------
    // Test 10: Chat displays fixture messages and sends local messages
    // -------------------------------------------------------------
    testWidgets('10. Chat displays fixture messages and posts local messages',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      final room = DesignFixtures.partyRooms.first;

      await tester.pumpWidget(_buildTestApp(PartyRoomScreen(room: room)));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('party_chat_list')), findsOneWidget);
      expect(find.textContaining('Welcome to "Late Night Tea House'),
          findsOneWidget);

      // Send local chat message
      await tester.enterText(
        find.byKey(const Key('party_chat_input')),
        'Awesome 9-seat party lounge! ☕🎵',
      );
      await tester.tap(find.byKey(const Key('party_chat_send_button')));
      await tester.pumpAndSettle();

      // Message immediately visible
      expect(find.text('Awesome 9-seat party lounge! ☕🎵'), findsOneWidget);
    });

    // -------------------------------------------------------------
    // Test 11: Close button returns to Party Discovery
    // -------------------------------------------------------------
    testWidgets('11. Close button pops PartyRoomScreen back to discovery',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      // Open room card
      await tester.tap(find.byKey(const Key('party_room_card_party_001')));
      await tester.pumpAndSettle();

      // In room screen
      expect(find.byKey(const Key('party_room_close_button')), findsOneWidget);

      // Tap close
      await tester.tap(find.byKey(const Key('party_room_close_button')));
      await tester.pumpAndSettle();

      // Back in Party Discovery
      expect(find.byKey(const Key('party_tab_bar')), findsOneWidget);
    });

    // -------------------------------------------------------------
    // Test 12: Filled, empty and error states render correctly
    // -------------------------------------------------------------
    testWidgets('12. Filled, empty, and error fixture states render correctly',
        (WidgetTester tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => tester.view.resetPhysicalSize());

      // 1. Error state
      DesignFixtures.currentState = DesignFixtureState.error;
      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('party_error_state')), findsOneWidget);
      expect(
        find.textContaining('Failed to connect to party room audio cluster'),
        findsOneWidget,
      );

      // 2. Empty state
      DesignFixtures.currentState = DesignFixtureState.empty;
      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('party_empty_state')), findsOneWidget);
      expect(find.text('No Party Rooms Available'), findsOneWidget);

      // 3. Filled state
      DesignFixtures.currentState = DesignFixtureState.filled;
      await tester.pumpWidget(_buildTestApp(const PartyDiscoveryScreen()));
      await tester.pumpAndSettle();

      expect(
          find.byKey(const Key('party_room_card_party_001')), findsOneWidget);
    });
  });
}
