import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/discovery/explore_home_screen.dart';
import 'package:popo_live/screens/live/cover_upload_screen.dart';
import 'package:popo_live/screens/live/face_verification_screen.dart';
import 'package:popo_live/screens/live/go_live_gate_screen.dart';
import 'package:popo_live/screens/live/host_studio_screen.dart';
import 'package:popo_live/screens/live/live_end_screen.dart';
import 'package:popo_live/screens/live/pre_live_setup_screen.dart';

/// 1x1 transparent PNG for mock HTTP image responses
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

void _setPhoneViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.0;
}

void main() {
  setUpAll(() {
    HttpOverrides.global = _TestHttpOverrides();
  });

  setUp(() {
    DesignFixtures.setDesignState(DesignState.filled);
  });

  group('Go Live System — Phase 3 (D2) Prompt 3 Individual Screens', () {
    testWidgets('1. Gate Screen displays permissions, eligibility, and back navigation',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: GoLiveGateScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Header and title
      expect(find.text('Broadcaster Eligibility & Setup'), findsOneWidget);
      expect(find.text('Amina Noor'), findsOneWidget);

      // Permission tiles
      expect(find.byKey(const Key('camera_permission_tile')), findsOneWidget);
      expect(find.byKey(const Key('mic_permission_tile')), findsOneWidget);

      // Eligibility info
      expect(find.textContaining('Wealth Level Lv.5+ Required'), findsOneWidget);
      expect(find.textContaining('Your Current Level: Lv.10'), findsOneWidget);
      expect(find.textContaining('Host Identity Verification: Verified'), findsOneWidget);

      // Continue CTA button exists
      expect(find.byKey(const Key('gate_continue_button')), findsOneWidget);
      expect(find.byKey(const Key('gate_back_button')), findsOneWidget);
    });

    testWidgets('2. Face Screen displays preview, flip camera toggle, and continue button',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: FaceVerificationScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Face & Camera Verification'), findsOneWidget);
      expect(find.textContaining('Camera (Front)'), findsOneWidget);
      expect(find.textContaining('Mic Active'), findsOneWidget);
      expect(find.textContaining('Face Biometric Verified'), findsOneWidget);

      // Flip camera
      final flipFinder = find.byKey(const Key('flip_camera_button'));
      expect(flipFinder, findsOneWidget);
      await tester.tap(flipFinder);
      await tester.pumpAndSettle();
      expect(find.textContaining('Camera (Rear)'), findsOneWidget);

      expect(find.byKey(const Key('face_continue_button')), findsOneWidget);
      expect(find.byKey(const Key('face_back_button')), findsOneWidget);
    });

    testWidgets('3. Cover Screen displays presets, category selection, and title input',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: CoverUploadScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Room Cover & Title'), findsOneWidget);
      expect(find.byKey(const Key('room_title_input')), findsOneWidget);
      expect(find.byKey(const Key('cover_preset_cover_01')), findsOneWidget);
      expect(find.byKey(const Key('cover_preset_cover_02')), findsOneWidget);

      // Title editing
      await tester.enterText(
          find.byKey(const Key('room_title_input')), 'Amina Special Acoustic Night');
      await tester.pumpAndSettle();
      expect(find.text('Amina Special Acoustic Night'), findsOneWidget);

      expect(find.byKey(const Key('cover_continue_button')), findsOneWidget);
    });

    testWidgets('4. Pre-Live Screen displays summary, hardware controls, and Start Live',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: PreLiveSetupScreen(
            title: 'Karachi Nights 🎶 Acoustic Live Session',
            category: 'Singing',
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Pre-Live Confirmation'), findsOneWidget);
      expect(find.byKey(const Key('pre_live_title_text')), findsOneWidget);
      expect(find.byKey(const Key('pre_live_category_chip')), findsOneWidget);
      expect(find.text('720p HD (1280 × 720)'), findsOneWidget);
      expect(find.text('Popo Live Fixture Engine'), findsOneWidget);

      // Hardware status tiles
      expect(find.byKey(const Key('camera_status_tile')), findsOneWidget);
      expect(find.byKey(const Key('mic_status_tile')), findsOneWidget);

      expect(find.byKey(const Key('start_live_button')), findsOneWidget);
    });

    testWidgets('5. Studio Screen displays ● LIVE badge, viewers, chat composer, and controls',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: HostStudioScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('● LIVE'), findsOneWidget);
      expect(find.text('1,420'), findsOneWidget);
      expect(find.textContaining('Demonstration Broadcast Mode (Fixture Engine)'), findsOneWidget);

      // Incoming fixture chat messages
      expect(find.textContaining('So excited for Karachi Nights!'), findsOneWidget);
      expect(find.textContaining('Greetings from Lahore!'), findsOneWidget);

      // Host chat input
      final inputFinder = find.byKey(const Key('studio_chat_input'));
      expect(inputFinder, findsOneWidget);
      await tester.enterText(inputFinder, 'Welcome everyone to the stream! ❤️');
      await tester.tap(find.byKey(const Key('studio_chat_send_button')));
      await tester.pumpAndSettle();
      expect(find.text('Welcome everyone to the stream! ❤️'), findsOneWidget);

      // Controls
      expect(find.byKey(const Key('mic_toggle_button')), findsOneWidget);
      expect(find.byKey(const Key('camera_toggle_button')), findsOneWidget);
      expect(find.byKey(const Key('flip_camera_studio_button')), findsOneWidget);
      expect(find.byKey(const Key('end_live_button')), findsOneWidget);

      // End Live Confirmation Dialog
      await tester.tap(find.byKey(const Key('end_live_button')));
      await tester.pumpAndSettle();
      expect(find.text('End Live Broadcast?'), findsOneWidget);
      expect(find.byKey(const Key('cancel_end_live_button')), findsOneWidget);
      expect(find.byKey(const Key('confirm_end_live_button')), findsOneWidget);

      // Dismiss dialog
      await tester.tap(find.byKey(const Key('cancel_end_live_button')));
      await tester.pumpAndSettle();
      expect(find.text('End Live Broadcast?'), findsNothing);
    });

    testWidgets('6. End Live Screen displays metrics and Return to Explore',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: LiveEndScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Live Broadcast Ended'), findsOneWidget);
      expect(find.text('Total Viewers'), findsOneWidget);
      expect(find.text('1,420'), findsOneWidget);
      expect(find.text('New Followers'), findsOneWidget);
      expect(find.text('+48'), findsOneWidget);
      expect(find.text('Gifts Received'), findsOneWidget);
      expect(find.text('12'), findsOneWidget);
      expect(find.text('Demo Diamonds'), findsOneWidget);
      expect(find.text('32,400'), findsOneWidget);
      expect(find.byKey(const Key('return_to_explore_button')), findsOneWidget);
    });
  });

  group('Go Live System — Complete 6-Screen End-to-End Navigation Journey', () {
    testWidgets(
        'Explore → Pink LIVE → Gate → Face → Cover → Pre-Live → Studio → End Screen → Return to Explore',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      // 1. Start on Explore Home Screen
      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Verify on Explore Home
      expect(find.byKey(const Key('explore_tab_bar')), findsOneWidget);
      final pinkLiveBtn = find.byKey(const Key('pink_live_button'));
      expect(pinkLiveBtn, findsOneWidget);

      // Tap Pink LIVE Button -> Opens Gate Screen
      await tester.tap(pinkLiveBtn);
      await tester.pumpAndSettle();
      expect(find.text('Broadcaster Eligibility & Setup'), findsOneWidget);

      // 2. Gate Screen -> Tap Continue -> Opens Face Screen
      final gateContinue = find.byKey(const Key('gate_continue_button'));
      expect(gateContinue, findsOneWidget);
      await tester.tap(gateContinue);
      await tester.pumpAndSettle();
      expect(find.text('Face & Camera Verification'), findsOneWidget);

      // 3. Face Screen -> Tap Continue -> Opens Cover Screen
      final faceContinue = find.byKey(const Key('face_continue_button'));
      expect(faceContinue, findsOneWidget);
      await tester.tap(faceContinue);
      await tester.pumpAndSettle();
      expect(find.text('Room Cover & Title'), findsOneWidget);

      // 4. Cover Screen -> Tap Continue -> Opens Pre-Live Screen
      final coverContinue = find.byKey(const Key('cover_continue_button'));
      expect(coverContinue, findsOneWidget);
      await tester.tap(coverContinue);
      await tester.pumpAndSettle();
      expect(find.text('Pre-Live Confirmation'), findsOneWidget);

      // 5. Pre-Live Screen -> Tap Start Live -> Opens Studio Screen
      final startLive = find.byKey(const Key('start_live_button'));
      expect(startLive, findsOneWidget);
      await tester.tap(startLive);
      await tester.pumpAndSettle();
      expect(find.text('● LIVE'), findsOneWidget);
      expect(find.text('1,420'), findsOneWidget);

      // 6. Studio Screen -> Tap End Live Button -> Show Dialog -> Confirm End -> Opens End Screen
      final endLiveBtn = find.byKey(const Key('end_live_button'));
      expect(endLiveBtn, findsOneWidget);
      await tester.tap(endLiveBtn);
      await tester.pumpAndSettle();

      final confirmEndBtn = find.byKey(const Key('confirm_end_live_button'));
      expect(confirmEndBtn, findsOneWidget);
      await tester.tap(confirmEndBtn);
      await tester.pumpAndSettle();

      // Verify on Live End Screen
      expect(find.text('Live Broadcast Ended'), findsOneWidget);
      expect(find.text('32,400'), findsOneWidget);

      // 7. End Screen -> Tap Return to Explore Button -> Back on Explore Home Screen!
      final returnBtn = find.byKey(const Key('return_to_explore_button'));
      expect(returnBtn, findsOneWidget);
      await tester.tap(returnBtn);
      await tester.pumpAndSettle();

      // Fully returned to Explore Home Screen!
      expect(find.byKey(const Key('explore_tab_bar')), findsOneWidget);
      expect(find.byKey(const Key('pink_live_button')), findsOneWidget);
    });

    testWidgets('Back navigation returns cleanly step-by-step from Pre-Live to Gate',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: ExploreHomeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Open Gate
      await tester.tap(find.byKey(const Key('pink_live_button')));
      await tester.pumpAndSettle();
      expect(find.text('Broadcaster Eligibility & Setup'), findsOneWidget);

      // Open Face
      await tester.tap(find.byKey(const Key('gate_continue_button')));
      await tester.pumpAndSettle();
      expect(find.text('Face & Camera Verification'), findsOneWidget);

      // Open Cover
      await tester.tap(find.byKey(const Key('face_continue_button')));
      await tester.pumpAndSettle();
      expect(find.text('Room Cover & Title'), findsOneWidget);

      // Back to Face
      await tester.tap(find.byKey(const Key('cover_back_button')));
      await tester.pumpAndSettle();
      expect(find.text('Face & Camera Verification'), findsOneWidget);

      // Back to Gate
      await tester.tap(find.byKey(const Key('face_back_button')));
      await tester.pumpAndSettle();
      expect(find.text('Broadcaster Eligibility & Setup'), findsOneWidget);

      // Back to Explore
      await tester.tap(find.byKey(const Key('gate_back_button')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('explore_tab_bar')), findsOneWidget);
    });
  });
}
