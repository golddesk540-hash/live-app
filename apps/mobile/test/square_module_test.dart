import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/square/square_discovery_screen.dart';
import 'package:popo_live/screens/square/square_state.dart';
import 'package:popo_live/shell/app_shell.dart';

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
    SquareStateManager.instance.resetToFixtures();
  });

  group('POPO LIVE - PHASE 4 (D3) - SQUARE SOCIAL SYSTEM TEST SUITE', () {
    testWidgets('1. Square tab opens correctly from central navigation',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: AppShell(initialIndex: 2),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('square_feed_title')), findsOneWidget);
      expect(find.byKey(const Key('create_post_fab')), findsOneWidget);
      expect(
          find.byKey(const Key('square_create_post_button')), findsOneWidget);
    });

    testWidgets('2. Feed displays fixture posts with cards, avatars, and text',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('square_feed_list')), findsOneWidget);

      // Verify first fixture post (Amina Noor)
      expect(find.byKey(const Key('post_author_name_post_01')), findsOneWidget);
      expect(find.text('Amina Noor'), findsOneWidget);
      expect(
        find.textContaining("Getting ready for tonight's acoustic session!"),
        findsOneWidget,
      );
      expect(find.byKey(const Key('post_image_post_01')), findsOneWidget);

      // Verify second fixture post (Sana Ali)
      expect(find.byKey(const Key('post_author_name_post_02')), findsOneWidget);
      expect(find.text('Sana Ali'), findsOneWidget);

      // Verify text-only post (post_05 - Hamza Tariq)
      expect(find.byKey(const Key('post_image_post_05')), findsNothing);
    });

    testWidgets(
        '3. Like and unlike toggles immediately update like count and visual state',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // post_01 starts with 142 likes and unliked
      expect(find.byKey(const Key('post_like_count_post_01')), findsOneWidget);
      expect(find.text('142'), findsOneWidget);

      final likeBtn = find.byKey(const Key('post_like_button_post_01'));
      expect(likeBtn, findsOneWidget);

      // Tap like
      await tester.tap(likeBtn);
      await tester.pumpAndSettle();

      // Count increases to 143
      expect(find.text('143'), findsOneWidget);

      // Tap unlike
      await tester.tap(likeBtn);
      await tester.pumpAndSettle();

      // Count returns to 142
      expect(find.text('142'), findsOneWidget);
    });

    testWidgets('4. Create Post screen opens and validates empty posts',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap FAB
      await tester.tap(find.byKey(const Key('create_post_fab')));
      await tester.pumpAndSettle();

      expect(find.text('Create Post'), findsOneWidget);
      expect(find.byKey(const Key('create_post_text_input')), findsOneWidget);
      expect(
          find.byKey(const Key('create_post_publish_button')), findsOneWidget);

      // Tap publish with empty content -> triggers validation error
      await tester.tap(find.byKey(const Key('create_post_publish_button')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('create_post_validation_error')),
          findsOneWidget);
      expect(
        find.textContaining('Please write something or attach an image'),
        findsOneWidget,
      );

      // Cancel button pops back
      await tester.tap(find.byKey(const Key('create_post_cancel_button')));
      await tester.pumpAndSettle();

      expect(find.text('Create Post'), findsNothing);
      expect(find.text('Square'), findsOneWidget);
    });

    testWidgets('5. Publishing text-only post prepends it to feed immediately',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Open Create Post
      await tester.tap(find.byKey(const Key('create_post_fab')));
      await tester.pumpAndSettle();

      // Enter text
      final inputFinder = find.byKey(const Key('create_post_text_input'));
      await tester.enterText(
        inputFinder,
        'Hosting an exclusive Karachi acoustic after-party! 🎸 Join in!',
      );
      await tester.pumpAndSettle();

      // Tap publish
      await tester.tap(find.byKey(const Key('create_post_publish_button')));
      await tester.pumpAndSettle();

      // Feed displays newly published post immediately at top!
      expect(
        find.text(
            'Hosting an exclusive Karachi acoustic after-party! 🎸 Join in!'),
        findsOneWidget,
      );
      expect(find.text('Just now'), findsOneWidget);
    });

    testWidgets('6. Publishing image post with preset selector works',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Open Create Post
      await tester.tap(find.byKey(const Key('square_create_post_button')));
      await tester.pumpAndSettle();

      // Attach image preset
      await tester.tap(find.byKey(const Key('create_post_add_image_button')));
      await tester.pumpAndSettle();

      expect(find.text('Select Media Attachment'), findsOneWidget);
      await tester.tap(find.byKey(const Key('preset_image_Acoustic Stage')));
      await tester.pumpAndSettle();

      // Preview is displayed
      expect(
          find.byKey(const Key('create_post_image_preview')), findsOneWidget);

      // Enter caption
      await tester.enterText(
        find.byKey(const Key('create_post_text_input')),
        'Live stage vibes tonight! ✨',
      );
      await tester.pumpAndSettle();

      // Publish
      await tester.tap(find.byKey(const Key('create_post_publish_button')));
      await tester.pumpAndSettle();

      // Verified on feed
      expect(find.text('Live stage vibes tonight! ✨'), findsOneWidget);
    });

    testWidgets(
        '7. Comments screen displays existing comments and post preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Tap comment button on post_01
      await tester.tap(find.byKey(const Key('post_comment_button_post_01')));
      await tester.pumpAndSettle();

      expect(find.text('Comments (2)'), findsOneWidget);
      expect(find.byKey(const Key('comments_back_button')), findsOneWidget);
      expect(find.byKey(const Key('comments_list')), findsOneWidget);

      // Verify existing comments
      expect(find.byKey(const Key('comment_author_com_01_1')), findsOneWidget);
      expect(find.text('Sana Ali'), findsOneWidget);
      expect(
        find.text('Definitely start with the Sufi melody! Can’t wait! 🎤'),
        findsOneWidget,
      );

      // Back to feed
      await tester.tap(find.byKey(const Key('comments_back_button')));
      await tester.pumpAndSettle();

      expect(find.text('Square'), findsOneWidget);
    });

    testWidgets('8. Submitting a new comment updates comment count immediately',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Initial comment count is 2
      expect(
          find.byKey(const Key('post_comment_count_post_01')), findsOneWidget);
      expect(find.text('2'), findsWidgets);

      // Open comments
      await tester.tap(find.byKey(const Key('post_comment_button_post_01')));
      await tester.pumpAndSettle();

      // Type comment
      final commentInput = find.byKey(const Key('comment_input_field'));
      await tester.enterText(
          commentInput, 'Awesome stream! Looking forward to the duet! 🎵');
      await tester.tap(find.byKey(const Key('comment_send_button')));
      await tester.pumpAndSettle();

      // New comment appears in list
      expect(
        find.text('Awesome stream! Looking forward to the duet! 🎵'),
        findsOneWidget,
      );
      expect(find.text('Comments (3)'), findsOneWidget);

      // Back to feed
      await tester.tap(find.byKey(const Key('comments_back_button')));
      await tester.pumpAndSettle();

      // Comment count on feed card is now 3
      expect(find.text('3'), findsWidgets);
    });

    testWidgets('9. Empty comments state displays friendly message',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // post_04 has 0 initial comments
      // Scroll down if needed or open post_04 comments
      await tester.tap(find.byKey(const Key('post_comment_button_post_04')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('comments_empty_state')), findsOneWidget);
      expect(find.text('No comments yet.'), findsOneWidget);
      expect(find.text('Be the first to share your thoughts!'), findsOneWidget);
    });

    testWidgets('10. Empty feed state renders PopoEmptyState', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      DesignFixtures.currentState = DesignFixtureState.empty;
      SquareStateManager.instance.resetToFixtures();

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('square_empty_state')), findsOneWidget);
      expect(find.text('No Posts Yet'), findsOneWidget);
    });

    testWidgets('11. Error feed state renders PopoErrorState with retry action',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      DesignFixtures.currentState = DesignFixtureState.error;
      SquareStateManager.instance.resetToFixtures();

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('square_error_state')), findsOneWidget);
      expect(find.text('Square Feed Unavailable'), findsOneWidget);
      expect(find.text('Pull down to refresh'), findsOneWidget);
    });

    testWidgets('12. Share button triggers confirmation snackbar',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: SquareDiscoveryScreen(),
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('post_share_button_post_01')));
      await tester.pumpAndSettle();

      expect(find.textContaining('copied to clipboard!'), findsOneWidget);
    });
  });
}
