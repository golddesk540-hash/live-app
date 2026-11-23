import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/l10n/strings.dart';
import 'package:popo_live/shell/app_shell.dart';
import 'package:popo_live/widgets/popo_bottom_navigation.dart';
import 'package:popo_live/screens/discovery/explore_home_screen.dart';
import 'package:popo_live/screens/party/party_discovery_screen.dart';
import 'package:popo_live/screens/square/square_discovery_screen.dart';
import 'package:popo_live/screens/inbox/inbox_screen.dart';
import 'package:popo_live/screens/profile/me_screen.dart';

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
  group('Section 3, R1 - Mobile Bottom Navigation Bar Tests', () {
    testWidgets(
        'PopoBottomNavigation renders exactly 5 uniform tabs in correct order (Live, Party, Square, Message, Me)',
        (WidgetTester tester) async {
      int selectedTab = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: StatefulBuilder(
            builder: (context, setState) {
              return Scaffold(
                bottomNavigationBar: PopoBottomNavigation(
                  currentIndex: selectedTab,
                  onTabSelected: (index) {
                    setState(() {
                      selectedTab = index;
                    });
                  },
                ),
              );
            },
          ),
        ),
      );

      // Verify the 5 labels appear in the widget tree in exact order
      expect(find.text(PopoStrings.tabLive), findsOneWidget);
      expect(find.text(PopoStrings.tabParty), findsOneWidget);
      expect(find.text(PopoStrings.tabSquare), findsOneWidget);
      expect(find.text(PopoStrings.tabMessage), findsOneWidget);
      expect(find.text(PopoStrings.tabMe), findsOneWidget);

      // Verify NO raised / floating Go Live button exists
      expect(find.text(PopoStrings.tabGoLive), findsNothing);
      expect(find.byIcon(Icons.videocam_rounded), findsNothing);

      // Verify the 5 tab icons exist
      expect(
          find.byIcon(Icons.live_tv_rounded), findsOneWidget); // Active Tab 0
      expect(find.byIcon(Icons.auto_awesome_outlined),
          findsOneWidget); // Inactive Tab 1 (Party)
      expect(find.byIcon(Icons.grid_view_outlined),
          findsOneWidget); // Inactive Tab 2 (Square inside circle)
      expect(find.byIcon(Icons.chat_bubble_outline_rounded),
          findsOneWidget); // Inactive Tab 3 (Message)
      expect(find.byIcon(Icons.shopping_bag_outlined),
          findsOneWidget); // Inactive Tab 4 (Me - shopping bag)

      // Test tapping each tab triggers onTabSelected with correct index
      // Tap Party (index 1)
      await tester.tap(find.text(PopoStrings.tabParty));
      await tester.pumpAndSettle();
      expect(selectedTab, 1);

      // Tap Square (index 2)
      await tester.tap(find.text(PopoStrings.tabSquare));
      await tester.pumpAndSettle();
      expect(selectedTab, 2);

      // Tap Message (index 3)
      await tester.tap(find.text(PopoStrings.tabMessage));
      await tester.pumpAndSettle();
      expect(selectedTab, 3);

      // Tap Me (index 4) - verify active shopping bag icon is displayed
      await tester.tap(find.text(PopoStrings.tabMe));
      await tester.pumpAndSettle();
      expect(selectedTab, 4);
      expect(find.byIcon(Icons.shopping_bag_rounded), findsOneWidget);

      // Tap Live (index 0)
      await tester.tap(find.text(PopoStrings.tabLive));
      await tester.pumpAndSettle();
      expect(selectedTab, 0);
    });

    testWidgets(
        'PopoBottomNavigation bilingual localization (English & Urdu)',
        (WidgetTester tester) async {
      // English check
      PopoStrings.setLanguage('en');
      expect(PopoStrings.tabLive, 'Live');
      expect(PopoStrings.tabParty, 'Party');
      expect(PopoStrings.tabSquare, 'Square');
      expect(PopoStrings.tabMessage, 'Message');
      expect(PopoStrings.tabMe, 'Me');

      // Urdu check
      PopoStrings.setLanguage('ur');
      expect(PopoStrings.tabLive, 'لائیو');
      expect(PopoStrings.tabParty, 'پارٹی');
      expect(PopoStrings.tabSquare, 'اسکوائر');
      expect(PopoStrings.tabMessage, 'پیغامات');
      expect(PopoStrings.tabMe, 'میری پروفائل');

      // Reset to English
      PopoStrings.setLanguage('en');
    });

    testWidgets(
        'PopoBottomNavigation displays badge on Message tab when messageBadgeCount > 0',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            bottomNavigationBar: PopoBottomNavigation(
              currentIndex: 0,
              onTabSelected: (_) {},
              messageBadgeCount: 5,
            ),
          ),
        ),
      );

      expect(find.text('5'), findsOneWidget);
    });

    testWidgets(
        'AppShell houses all 5 destination widgets in IndexedStack in exact order',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(
        const MaterialApp(
          home: AppShell(initialIndex: 0),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Verify IndexedStack is used for state preservation
      final indexedStackFinder = find.byType(IndexedStack);
      expect(indexedStackFinder, findsOneWidget);

      final IndexedStack indexedStack = tester.widget(indexedStackFinder);
      expect(indexedStack.children.length, 5);

      // Verify the exact 5 destination types in order: Live -> Explore -> Square -> Message -> Me
      expect(indexedStack.children[0] is ExploreHomeScreen, true);
      expect(indexedStack.children[1] is PartyDiscoveryScreen, true);
      expect(indexedStack.children[2] is SquareDiscoveryScreen, true);
      expect(indexedStack.children[3] is InboxScreen, true);
      expect(indexedStack.children[4] is MeScreen, true);

      // Verify initialIndex is 0 (Live)
      expect(indexedStack.index, 0);

      // Verify bottom nav bar is present
      expect(find.byType(PopoBottomNavigation), findsOneWidget);
    });
  });
}
