import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/live/viewer_room_screen.dart';

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
    return Stream<List<int>>.fromIterable([_kTransparentImageBytes]).listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }
}

Widget _buildViewerScreen({required String roomId}) {
  return MaterialApp(
    home: ViewerRoomScreen(roomId: roomId),
  );
}

void main() {
  setUpAll(() {
    HttpOverrides.global = _TestHttpOverrides();
  });

  setUp(() {
    DesignFixtures.setDesignState(DesignState.filled);
  });

  group('Phase 3 (D2) Prompt 2: Live Room Viewer Screen Tests', () {
    // ------------------------------------------------------------------------
    // Test 1: Dynamic Room Loading (room_001)
    // ------------------------------------------------------------------------
    testWidgets('1. Dynamic Room Loading: opens room_001 with Amina Noor & Karachi Nights',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      // Host name and title for room_001
      expect(find.text('Amina Noor'), findsOneWidget);
      expect(find.textContaining('Karachi Nights'), findsOneWidget);
      expect(find.text('🇵🇰'), findsOneWidget);
      expect(find.text('Lv.10'), findsOneWidget);
      expect(find.text('ID: 883901'), findsOneWidget);
      expect(find.text('1,420'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 2: Dynamic Room Loading (room_002) - Different Room Verification
    // ------------------------------------------------------------------------
    testWidgets('2. Dynamic Room Loading: opens room_002 with Sana Ali (not hardcoded)',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_002'));
      await tester.pumpAndSettle();

      // Host name for room_002 is Sana Ali
      expect(find.text('Sana Ali'), findsOneWidget);
      expect(find.text('ID: 883902'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 3: Follow Button Toggling
    // ------------------------------------------------------------------------
    testWidgets('3. Follow Button: toggles state between + Follow and Following',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      // Initially "+ Follow"
      expect(find.text('+ Follow'), findsOneWidget);
      expect(find.text('Following'), findsNothing);

      // Tap follow
      await tester.tap(find.byKey(const Key('follow_host_button')));
      await tester.pumpAndSettle();

      // State is now "Following"
      expect(find.text('Following'), findsOneWidget);
      expect(find.text('+ Follow'), findsNothing);

      // Tap again to unfollow
      await tester.tap(find.byKey(const Key('follow_host_button')));
      await tester.pumpAndSettle();

      expect(find.text('+ Follow'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 4: Live Chat Messages Displayed from Fixtures
    // ------------------------------------------------------------------------
    testWidgets('4. Live Chat: renders initial messages from fixture',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      // Check fixture messages
      expect(find.byKey(const Key('live_chat_list')), findsOneWidget);
      expect(find.textContaining('Sing the acoustic version'), findsOneWidget);
      expect(find.textContaining('Super Sports Car'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 5: Message Composer Appends Locally
    // ------------------------------------------------------------------------
    testWidgets('5. Chat Composer: sending chat message appends to chat list',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      // Enter text
      final inputFinder = find.byKey(const Key('live_chat_input'));
      expect(inputFinder, findsOneWidget);
      await tester.enterText(inputFinder, 'Awesome performance live! 🎉');
      await tester.pump();

      // Tap send
      final sendFinder = find.byKey(const Key('live_chat_send_button'));
      expect(sendFinder, findsOneWidget);
      await tester.tap(sendFinder);
      await tester.pumpAndSettle();

      // New message appears in list
      expect(find.text('Awesome performance live! 🎉'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 6: Gift Sheet Opens & Displays Fixture Gifts
    // ------------------------------------------------------------------------
    testWidgets('6. Gift Sheet: opens modal and renders fixture gifts with coin balance',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      // Open Gift Sheet
      final giftBtnFinder = find.byKey(const Key('open_gift_sheet_button'));
      expect(giftBtnFinder, findsOneWidget);
      await tester.tap(giftBtnFinder);
      await tester.pumpAndSettle();

      // Gift sheet elements
      expect(find.text('Send Gifts'), findsOneWidget);
      expect(find.byKey(const Key('gift_sheet_coin_balance')), findsOneWidget);
      expect(find.text('Rose Flower'), findsOneWidget);
      expect(find.text('Karachi Chai Cup'), findsOneWidget);
      expect(find.byKey(const Key('send_gift_button')), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 7: Gift Sending Deducts Coins and Posts in Chat
    // ------------------------------------------------------------------------
    testWidgets('7. Gift Sending: deducts coins, posts announcement in chat',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      final initialBalance = DesignFixtures.currentCoinBalance;

      // Open Gift Sheet
      await tester.tap(find.byKey(const Key('open_gift_sheet_button')));
      await tester.pumpAndSettle();

      // First gift is Rose Flower (10 coins)
      await tester.tap(find.byKey(const Key('gift_tile_gift_01')));
      await tester.pump();

      // Tap Send Gift
      await tester.tap(find.byKey(const Key('send_gift_button')));
      await tester.pumpAndSettle();

      // Balance was deducted by 10 coins
      expect(DesignFixtures.currentCoinBalance, initialBalance - 10);

      // Chat now has the gift message
      expect(find.textContaining('Sent Rose Flower'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 8: Insufficient Balance Guard
    // ------------------------------------------------------------------------
    testWidgets('8. Insufficient Balance Guard: blocks sending when coins are insufficient',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      // Deduct all coins to simulate near-zero balance
      final current = DesignFixtures.currentCoinBalance;
      DesignFixtures.deductCoins(current); // balance is now 0

      // Open Gift Sheet
      await tester.tap(find.byKey(const Key('open_gift_sheet_button')));
      await tester.pumpAndSettle();

      // Tap Rose Flower (10 coins)
      await tester.tap(find.byKey(const Key('gift_tile_gift_01')));
      await tester.pump();

      // Tap Send Gift
      await tester.tap(find.byKey(const Key('send_gift_button')));
      await tester.pumpAndSettle();

      // Error message is displayed
      expect(find.textContaining('Insufficient coins!'), findsOneWidget);

      // Sheet is still open
      expect(find.text('Send Gifts'), findsOneWidget);

      // Restore coins for subsequent tests
      DesignFixtures.addCoins(current);
    });

    // ------------------------------------------------------------------------
    // Test 9: Viewers / Top Contributors Sheet
    // ------------------------------------------------------------------------
    testWidgets('9. Viewers Sheet: opens top contributors list on viewer pill tap',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(_buildViewerScreen(roomId: 'room_001'));
      await tester.pumpAndSettle();

      // Tap Viewer Count Pill
      await tester.tap(find.byKey(const Key('viewer_count_pill')));
      await tester.pumpAndSettle();

      // Viewers bottom sheet open
      expect(find.byKey(const Key('viewers_sheet_title')), findsOneWidget);
      expect(find.text('Audience & Contributors'), findsOneWidget);

      // Verify top contributors from fixture
      expect(find.text('Bilal Ahmed'), findsOneWidget);
      expect(find.text('Faizan Sheikh'), findsOneWidget);
      expect(find.text('Tariq Jamil'), findsOneWidget);
      expect(find.text('#1'), findsOneWidget);
      expect(find.text('#2'), findsOneWidget);
      expect(find.text('#3'), findsOneWidget);
    });

    // ------------------------------------------------------------------------
    // Test 10: Close Button Pops Navigator Cleanly
    // ------------------------------------------------------------------------
    testWidgets('10. Close Button: pops the screen cleanly',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      bool didPop = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const ViewerRoomScreen(roomId: 'room_001'),
                  ),
                );
                didPop = true;
              },
              child: const Text('Open Room'),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Open Room
      await tester.tap(find.text('Open Room'));
      await tester.pumpAndSettle();

      expect(find.byType(ViewerRoomScreen), findsOneWidget);

      // Tap Close Button
      await tester.tap(find.byKey(const Key('close_viewer_button')));
      await tester.pumpAndSettle();

      expect(find.byType(ViewerRoomScreen), findsNothing);
      expect(didPop, isTrue);
    });
  });
}
