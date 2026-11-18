import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/l10n/strings.dart';
import 'package:popo_live/screens/discovery/explore_home_screen.dart';
import 'package:popo_live/screens/discovery/room_card.dart';
import 'package:popo_live/screens/discovery/country_chips.dart';
import 'package:popo_live/screens/recognition/recognition_screen.dart';
import 'package:popo_live/screens/live/go_live_gate_screen.dart';
import 'package:popo_live/screens/live/viewer_room_screen.dart';
import 'package:popo_live/widgets/popo_empty_state.dart';
import 'package:popo_live/widgets/popo_error_state.dart';

/// Transparent 1x1 PNG bytes for network image mock in tests
final Uint8List _kTransparentImageBytes = Uint8List.fromList(<int>[
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D,
  0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
  0x60, 0x82
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
    return Stream<List<int>>.value(_kTransparentImageBytes).listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }
}

void main() {
  setUpAll(() {
    HttpOverrides.global = _TestHttpOverrides();
  });

  setUp(() {
    DesignFixtures.reset();
    DesignFixtures.setFilled();
  });

  void setMobileScreenSize(WidgetTester tester) {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
  }

  group('Phase 3 (D2) Prompt 1 - Complete Explore Home Screen Tests', () {
    testWidgets('1. Explore screen displays exactly 3 functional tabs: Following, Explore, For You',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Verify the 3 tabs are present
      expect(find.text(PopoStrings.get('tab_follow')), findsOneWidget);
      expect(find.text(PopoStrings.get('tab_explore')), findsOneWidget);
      expect(find.text(PopoStrings.get('tab_for_you')), findsOneWidget);

      // Verify Explore (index 1) is active by default
      expect(find.text('Karachi Nights 🎶 Acoustic Live Session'), findsOneWidget);

      // Switch to Following tab (index 0)
      await tester.tap(find.text(PopoStrings.get('tab_follow')));
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.textContaining('Followed Creators'), findsOneWidget);

      // Switch to For You tab (index 2)
      await tester.tap(find.text(PopoStrings.get('tab_for_you')));
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.text('Recommended For You'), findsOneWidget);

      // Switch back to Explore tab (index 1)
      await tester.tap(find.text(PopoStrings.get('tab_explore')));
      await tester.pump(const Duration(milliseconds: 400));
      expect(find.text('Karachi Nights 🎶 Acoustic Live Session'), findsOneWidget);
    });

    testWidgets('2. Country chips filter live rooms and handle empty selections gracefully',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Verify CountryChips widget exists
      expect(find.byType(CountryChips), findsOneWidget);

      // Initial state: ALL selected, shows all 8 rooms
      expect(find.byType(RoomCard), findsNWidgets(8));

      // Filter by PK (Pakistan)
      final pkChip = find.text('Pakistan');
      if (pkChip.evaluate().isNotEmpty) {
        await tester.tap(pkChip);
        await tester.pump(const Duration(milliseconds: 300));
        expect(find.byType(RoomCard), findsNWidgets(8));
      }

      // Filter by USA (0 rooms in fixture)
      final usaChip = find.text('USA');
      if (usaChip.evaluate().isNotEmpty) {
        await tester.tap(usaChip);
        await tester.pump(const Duration(milliseconds: 300));

        // Verifies graceful empty state handling
        expect(find.text('No Live Streams Found'), findsOneWidget);
        expect(find.text('Show All Rooms'), findsOneWidget);

        // Tap "Show All Rooms" to reset filter
        await tester.tap(find.text('Show All Rooms'));
        await tester.pump(const Duration(milliseconds: 300));
        expect(find.byType(RoomCard), findsNWidgets(8));
      }
    });

    testWidgets('3. Honor tile renders with level and navigates to RecognitionScreen',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Verify Honor tile elements
      expect(find.text(PopoStrings.get('honor_title')), findsOneWidget);
      expect(find.text('Lv.10'), findsOneWidget);

      // Tap Honor tile to verify navigation
      await tester.tap(find.text(PopoStrings.get('honor_title')));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      // Verify RecognitionScreen pushed
      expect(find.byType(RecognitionScreen), findsOneWidget);
    });

    testWidgets('4. Activity Center tile and PK ranking banner render with fixture event data',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Verify Activity Center tile
      expect(find.text(PopoStrings.get('activity_center')), findsOneWidget);
      expect(find.text('HOT'), findsOneWidget);

      // Verify PK Ranking Banner elements
      expect(find.text(PopoStrings.get('pk_ranking_title')), findsOneWidget);
      expect(find.text('VS'), findsOneWidget);
      expect(find.text('Amina Noor'), findsAtLeastNWidgets(1));
      expect(find.text('Sana Ali'), findsAtLeastNWidgets(1));
      expect(find.text('#1'), findsOneWidget);
      expect(find.text('#2'), findsOneWidget);
    });

    testWidgets('5. Exactly 8 live rooms render from D0 fixture with all required card components',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Verify exactly 8 room cards are rendered
      expect(find.byType(RoomCard), findsNWidgets(8));

      // Verify fictional fixture room titles
      expect(find.text('Karachi Nights 🎶 Acoustic Live Session'), findsOneWidget);
      expect(find.text('Chai & Midnight Chill Talk ☕🌙'), findsOneWidget);
      expect(find.text('Gaming Marathon & Battle Arena 🎮🔥'), findsOneWidget);
      expect(find.text('Lahore Beats & Eastern Classical 🪕✨'), findsOneWidget);
      expect(find.text('Standup Comedy & Talent Hunt 😂🎭'), findsOneWidget);
      expect(find.text('Sufi Soul & Poetry Night 📜🕊️'), findsOneWidget);
      expect(find.text('Karachi Street Food & Kitchen Diaries 🍲🌶️'), findsOneWidget);
      expect(find.text('Late Night Fitness & Cardio Motivation 🏋️‍♂️⚡'), findsOneWidget);

      // Verify LIVE badge, Category pills, and PK badge
      expect(find.text('LIVE'), findsAtLeastNWidgets(8));
      expect(find.text('SINGING'), findsOneWidget);
      expect(find.text('CHITCHAT'), findsOneWidget);
      expect(find.text('GAMING'), findsOneWidget);
      expect(find.text('PK'), findsAtLeastNWidgets(2)); // room_002 and room_005
    });

    testWidgets('6. Tapping a room card navigates to ViewerRoomScreen',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Tap first room card (Karachi Nights)
      await tester.tap(find.text('Karachi Nights 🎶 Acoustic Live Session'));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      // Verify navigation to ViewerRoomScreen
      expect(find.byType(ViewerRoomScreen), findsOneWidget);
    });

    testWidgets('7. Prominent pink LIVE button navigates to GoLiveGateScreen',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Find the pink LIVE button
      final liveBtn = find.text(PopoStrings.get('go_live_btn'));
      expect(liveBtn, findsOneWidget);

      // Tap pink LIVE button
      await tester.tap(liveBtn);
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 300));

      // Verify navigation to GoLiveGateScreen
      expect(find.byType(GoLiveGateScreen), findsOneWidget);
    });

    testWidgets('8. Empty and Error design states render correctly on Explore',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      // Test Empty State
      DesignFixtures.setEmpty();
      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(PopoEmptyState), findsOneWidget);
      expect(find.text(DesignFixtures.liveRoomsEmpty.title), findsOneWidget);

      // Test Error State
      DesignFixtures.setError();
      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(PopoErrorState), findsOneWidget);
      expect(find.text(DesignFixtures.liveRoomsError.title), findsOneWidget);
    });
  });
}
