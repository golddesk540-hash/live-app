import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/profile/me_screen.dart';
import 'package:popo_live/screens/profile/settings_screen.dart';
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
    DesignFixtures.reset();
    DesignFixtures.currentState = DesignFixtureState.filled;
  });

  tearDown(() {
    DesignFixtures.reset();
  });

  group('POPO LIVE - PHASE 5 (D4) PROMPT 1: ME / PROFILE MAIN PAGE TEST SUITE',
      () {
    testWidgets('1. Me tab opens the correct profile page from AppShell',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: AppShell(initialIndex: 4),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(MeScreen), findsOneWidget);
      expect(find.byKey(const Key('me_title')), findsOneWidget);
    });

    testWidgets('2. Profile avatar displays correctly with glowing ring',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_avatar')), findsOneWidget);
      expect(find.byType(CircleAvatar), findsWidgets);
    });

    testWidgets('3. User name displays correctly from D0 fixture',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_nickname')), findsOneWidget);
      expect(find.text(DesignFixtures.currentUserProfile.nickname),
          findsOneWidget);
    });

    testWidgets('4. Country flag displays correctly', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_flag')), findsOneWidget);
      expect(find.textContaining('🇵🇰'), findsOneWidget);
      expect(find.textContaining('Pakistan'), findsOneWidget);
    });

    testWidgets('5. VIP badge displays correctly with crown icon',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_vip_badge')), findsOneWidget);
      expect(find.text('VIP ${DesignFixtures.currentUserProfile.vipLevel}'),
          findsWidgets);
      expect(find.textContaining('👑'), findsWidgets);
    });

    testWidgets('6. Both level badges (Wealth and Shining) display correctly',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Wealth level
      expect(find.byKey(const Key('me_wealth_badge')), findsOneWidget);
      expect(find.text('Lv.${DesignFixtures.currentUserProfile.wealthLevel}'),
          findsOneWidget);

      // Shining / Host level
      expect(find.byKey(const Key('me_shining_badge')), findsOneWidget);
      expect(find.text('Lv.${DesignFixtures.currentUserProfile.hostLevel}'),
          findsOneWidget);
    });

    testWidgets('7. User ID displays correctly from fixture', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_user_id')), findsOneWidget);
      expect(find.textContaining(DesignFixtures.currentUserProfile.poppoId),
          findsOneWidget);
    });

    testWidgets(
        '8. Copy ID functionality works and shows confirmation SnackBar',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: MeScreen()),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_copy_id_button')), findsOneWidget);
      await tester.tap(find.byKey(const Key('me_copy_id_button')));
      await tester.pump();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.textContaining(DesignFixtures.currentUserProfile.poppoId),
          findsWidgets);
    });

    testWidgets('9. Friends count displays correctly and opens preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_friends_count')), findsOneWidget);
      expect(find.text('${DesignFixtures.currentUserProfile.friendsCount}'),
          findsOneWidget);

      await tester.tap(find.byKey(const Key('me_friends_entry')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Friends'), findsWidgets);
      // Close sheet
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('10. Following count displays correctly and opens preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_following_count')), findsOneWidget);
      expect(find.text('${DesignFixtures.currentUserProfile.followingCount}'),
          findsOneWidget);

      await tester.tap(find.byKey(const Key('me_following_entry')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Following'), findsWidgets);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('11. Followers count displays correctly and opens preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_followers_count')), findsOneWidget);
      expect(find.text('14,200'), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_followers_entry')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Followers'), findsWidgets);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('12. Visitors count displays correctly and opens preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_visitors_count')), findsOneWidget);
      expect(find.text('18,950'), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_visitors_entry')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Visitors'), findsWidgets);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('13. Coins balance displays correctly and opens coins preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_coins_card')), findsOneWidget);
      expect(find.byKey(const Key('me_coins_title')), findsOneWidget);
      expect(find.byKey(const Key('me_coins_balance')), findsOneWidget);
      expect(find.text('154,200'), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_coins_card')));
      await tester.pumpAndSettle();

      expect(find.text('Popo Coins Wallet'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets(
        '14. Points balance displays correctly and opens points preview',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_points_card')), findsOneWidget);
      expect(find.byKey(const Key('me_points_title')), findsOneWidget);
      expect(find.byKey(const Key('me_points_balance')), findsOneWidget);
      expect(find.text('420,500'), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_points_card')));
      await tester.pumpAndSettle();

      expect(find.text('Host Points & Earnings'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('15. VIP banner displays correctly and opens VIP privileges',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_vip_banner')), findsOneWidget);
      expect(find.byKey(const Key('me_vip_status_text')), findsOneWidget);
      expect(find.text('VIP 3 • Crown Sovereign'), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_vip_banner')));
      await tester.pumpAndSettle();

      expect(find.text('VIP 3 Privileges'), findsOneWidget);
      expect(find.text('Exclusive Room Entrance Banner'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('16. Scan entry in header opens Scan QR Code sheet',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_scan_button')), findsOneWidget);
      await tester.tap(find.byKey(const Key('me_scan_button')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_scan_sheet')), findsOneWidget);
      expect(find.text('Scan QR Code'), findsOneWidget);
      expect(find.text('Align QR inside the box'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('17. Settings entry in header navigates to SettingsScreen',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_settings_button')), findsOneWidget);
      await tester.tap(find.byKey(const Key('me_settings_button')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(SettingsScreen), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets(
        '18. Scrolling works and displays features grid and lower modules',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      // Scroll down to see features and lower modules
      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -400));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_features_grid')), findsOneWidget);
      expect(find.text('Reward'), findsOneWidget);
      expect(find.text('Rank'), findsOneWidget);
      expect(find.text('Store'), findsOneWidget);
      expect(find.text('Invite'), findsOneWidget);
      expect(find.text('Guardian'), findsOneWidget);
      expect(find.text('Honor Level'), findsOneWidget);
      expect(find.text('Fan Club'), findsOneWidget);
      expect(find.text('Medal Wall'), findsOneWidget);

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -300));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_lower_modules_section')), findsOneWidget);
      expect(find.text('Streamer Center'), findsOneWidget);
      expect(find.text('Builder Center'), findsOneWidget);
      expect(find.text('Help & Customer Service'), findsOneWidget);
    });

    testWidgets('19. Fixture empty and error states render correctly',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      // 1. Error state
      DesignFixtures.currentState = DesignFixtureState.error;
      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_error_state')), findsOneWidget);
      expect(find.text(DesignFixtures.userProfileError.title), findsOneWidget);

      // 2. Empty state
      DesignFixtures.currentState = DesignFixtureState.empty;
      await tester.pumpWidget(
        const MaterialApp(
          home: MeScreen(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_empty_state')), findsOneWidget);
      expect(find.text('Guest Profile'), findsOneWidget);
    });

    testWidgets('20. AppShell 5-tab navigation remains fully functional',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(
          home: AppShell(initialIndex: 0),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // Switch to Me tab (index 4)
      await tester.tap(find.text('Me'));
      await tester.pumpAndSettle();

      expect(find.byType(MeScreen), findsOneWidget);
      expect(find.text('Amina Noor'), findsOneWidget);

      // Switch to Explore tab (index 1)
      await tester.tap(find.text('Explore').last);
      await tester.pumpAndSettle();

      // Switch to Square tab (index 2)
      await tester.tap(find.text('Square'));
      await tester.pumpAndSettle();

      // Switch back to Me tab (index 4)
      await tester.tap(find.text('Me'));
      await tester.pumpAndSettle();

      expect(find.byType(MeScreen), findsOneWidget);
      expect(find.text('Amina Noor'), findsOneWidget);
    });
  });
}
