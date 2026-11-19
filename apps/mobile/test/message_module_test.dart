import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/inbox/inbox_screen.dart';
import 'package:popo_live/screens/messages/message_state.dart';

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
  0x82,
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

void main() {
  setUpAll(() {
    HttpOverrides.global = _TestHttpOverrides();
  });

  tearDownAll(() {
    HttpOverrides.global = null;
  });

  setUp(() {
    DesignFixtures.currentState = DesignFixtureState.filled;
    MessageStateManager.instance.resetToFixtures();
  });

  group('POPO LIVE - PHASE 4 (D3) - MESSAGE & CHAT MODULE TEST SUITE', () {
    testWidgets(
        '1. Message Inbox screen renders header, title, and plus action',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('message_inbox_title')), findsOneWidget);
      expect(find.text('Message'), findsOneWidget);
      expect(find.byKey(const Key('message_plus_button')), findsOneWidget);
      expect(find.byKey(const Key('message_search_input')), findsOneWidget);
    });

    testWidgets(
        '2. Search functionality filters chats, shows clear button and handles empty matches',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Search for specific fixture user Sana Ali
      final searchInput = find.byKey(const Key('message_search_input'));
      await tester.enterText(searchInput, 'Sana');
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('chat_row_th_01')), findsOneWidget);
      expect(find.text('Sana Ali'), findsWidgets);
      expect(find.byKey(const Key('chat_row_th_02')), findsNothing);

      // Search non-existent query
      await tester.enterText(searchInput, 'NonExistentQueryXYZ');
      await tester.pumpAndSettle();

      expect(find.textContaining('No chats or people match'), findsOneWidget);

      // Clear search
      final clearBtn = find.byKey(const Key('message_search_clear'));
      expect(clearBtn, findsOneWidget);
      await tester.tap(clearBtn);
      await tester.pumpAndSettle();

      // All 12 chats restored
      expect(find.byKey(const Key('chat_row_th_01')), findsOneWidget);
      expect(find.byKey(const Key('chat_row_th_02')), findsOneWidget);
      expect(find.byKey(const Key('chat_row_th_12')), findsOneWidget);
    });

    testWidgets(
        '3. Plus action opens contact picker sheet and allows selection',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Plus action
      await tester.tap(find.byKey(const Key('message_plus_button')));
      await tester.pumpAndSettle();

      expect(find.text('New Message'), findsOneWidget);
      expect(find.byKey(const Key('contact_search_input')), findsOneWidget);
      expect(
          find.byKey(const Key('contact_picker_close_button')), findsOneWidget);

      // Tap close button
      await tester.tap(find.byKey(const Key('contact_picker_close_button')));
      await tester.pumpAndSettle();

      expect(find.text('New Message'), findsNothing);
    });

    testWidgets(
        '4. People row displays horizontal list and tapping opens profile',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('people_horizontal_list')), findsOneWidget);
      expect(find.text('People'), findsOneWidget);

      // Tap on Sana Ali in people row
      final sanaAvatar = find.byKey(const Key('people_avatar_u_sana_ali'));
      expect(sanaAvatar, findsOneWidget);
      await tester.tap(sanaAvatar);
      await tester.pumpAndSettle();

      // Profile modal appears
      expect(find.text('Direct Message'), findsOneWidget);
      expect(find.text('Close'), findsOneWidget);

      // Close profile modal
      await tester.tap(find.text('Close'));
      await tester.pumpAndSettle();
    });

    testWidgets(
        '5. Exactly 4 Official notification rows display in required order',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Official Notifications'), findsOneWidget);

      // Exact 4 official categories in strict required order:
      // 1. Achievements, 2. System, 3. Account Security, 4. New Followers
      final achieveFinder = find.byKey(const Key('official_row_Achievements'));
      final sysFinder = find.byKey(const Key('official_row_System'));
      final secFinder = find.byKey(const Key('official_row_Account Security'));
      final folFinder = find.byKey(const Key('official_row_New Followers'));

      expect(achieveFinder, findsOneWidget);
      expect(sysFinder, findsOneWidget);
      expect(secFinder, findsOneWidget);
      expect(folFinder, findsOneWidget);

      // Verify vertical ordering (top of Achievements < System < Security < Followers)
      final achieveY = tester.getTopLeft(achieveFinder).dy;
      final sysY = tester.getTopLeft(sysFinder).dy;
      final secY = tester.getTopLeft(secFinder).dy;
      final folY = tester.getTopLeft(folFinder).dy;

      expect(achieveY < sysY, isTrue);
      expect(sysY < secY, isTrue);
      expect(secY < folY, isTrue);
    });

    testWidgets(
        '6. Official rows navigate to populated notice screens with back navigation',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Open Achievements notice screen
      await tester.tap(find.byKey(const Key('official_row_Achievements')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('official_notice_title')), findsOneWidget);
      expect(find.text('Achievements'), findsOneWidget);
      expect(find.textContaining('Million Diamond Milestone Unlocked!'),
          findsOneWidget);
      expect(find.byKey(const Key('mark_all_read_button')), findsOneWidget);

      // Back to Message Inbox
      await tester.tap(find.byKey(const Key('official_notice_back_button')));
      await tester.pumpAndSettle();
      expect(find.text('Message'), findsOneWidget);

      // 2. Open Account Security notice screen
      await tester.tap(find.byKey(const Key('official_row_Account Security')));
      await tester.pumpAndSettle();

      expect(find.text('Account Security'), findsOneWidget);
      expect(
          find.textContaining('New Device Sign-in Verified'), findsOneWidget);

      // Back to Message Inbox
      await tester.tap(find.byKey(const Key('official_notice_back_button')));
      await tester.pumpAndSettle();
      expect(find.text('Message'), findsOneWidget);
    });

    testWidgets(
        '7. Exactly 12 fixture chat records appear with consistent information',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('recent_chats_list')), findsOneWidget);
      expect(find.text('12 conversations'), findsOneWidget);

      // Verify all 12 threads exist
      for (int i = 1; i <= 12; i++) {
        final id = 'th_${i.toString().padLeft(2, '0')}';
        expect(find.byKey(Key('chat_row_$id')), findsOneWidget);
      }

      // Check specific information on first thread (Sana Ali)
      expect(find.byKey(const Key('chat_peer_name_th_01')), findsOneWidget);
      expect(find.text('Sana Ali'), findsWidgets);
      expect(find.byKey(const Key('chat_unread_badge_th_01')), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets(
        '8. Tapping chat opens ChatThreadScreen with existing messages and header',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Open Sana Ali's chat
      await tester.tap(find.byKey(const Key('chat_row_th_01')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('chat_thread_peer_name')), findsOneWidget);
      expect(find.text('Sana Ali'), findsOneWidget);
      expect(find.text('Online'), findsOneWidget);
      expect(find.byKey(const Key('chat_thread_message_list')), findsOneWidget);
      expect(find.byKey(const Key('chat_thread_input')), findsOneWidget);
      expect(find.byKey(const Key('chat_thread_send_button')), findsOneWidget);

      // Verify existing starter messages
      expect(
          find.textContaining(
              'Are we doing the dual acoustic PK battle tomorrow night?'),
          findsOneWidget);
    });

    testWidgets(
        '9. Sending message in chat appends message immediately and updates inbox preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Open chat thread
      await tester.tap(find.byKey(const Key('chat_row_th_01')));
      await tester.pumpAndSettle();

      // Enter message and send
      final inputFinder = find.byKey(const Key('chat_thread_input'));
      await tester.enterText(
          inputFinder, 'Sounds great! I will be ready tomorrow! 🎸');
      await tester.tap(find.byKey(const Key('chat_thread_send_button')));
      await tester.pumpAndSettle();

      // Newly sent message appears immediately in thread
      expect(find.text('Sounds great! I will be ready tomorrow! 🎸'),
          findsOneWidget);

      // Pop back to Message Inbox
      await tester.tap(find.byKey(const Key('chat_thread_back_button')));
      await tester.pumpAndSettle();

      // Verify inbox preview updated with sent message and unread cleared
      expect(find.text('Sounds great! I will be ready tomorrow! 🎸'),
          findsOneWidget);
      expect(find.byKey(const Key('chat_unread_badge_th_01')), findsNothing);
    });

    testWidgets('10. Empty state renders PopoEmptyState correctly',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      DesignFixtures.currentState = DesignFixtureState.empty;
      MessageStateManager.instance.resetToFixtures();

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('message_empty_state')), findsOneWidget);
      expect(find.text('No Messages Yet'), findsOneWidget);
    });

    testWidgets(
        '11. Error state renders PopoErrorState correctly with retry action',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      DesignFixtures.currentState = DesignFixtureState.error;
      MessageStateManager.instance.resetToFixtures();

      await tester.pumpWidget(
        const MaterialApp(
          home: MessageInboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('message_error_state')), findsOneWidget);
      expect(find.text('Inbox Sync Failed'), findsOneWidget);
      expect(find.text('Pull down to refresh'), findsOneWidget);
    });

    testWidgets('12. InboxScreen alias supports polymorphism and routing',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: InboxScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('message_inbox_title')), findsOneWidget);
      expect(find.text('Message'), findsOneWidget);
    });
  });
}
