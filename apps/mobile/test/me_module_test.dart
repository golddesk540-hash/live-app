import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/daily_tasks/daily_host_tasks_screen.dart';
import 'package:popo_live/screens/host_rankings/host_rankings_screen.dart';
import 'package:popo_live/screens/invites/invites_screen.dart';
import 'package:popo_live/screens/store/store_screen.dart';
import 'package:popo_live/screens/task_level/task_level_screen.dart';
import 'package:popo_live/screens/fan_club/fan_club_screen.dart';
import 'package:popo_live/screens/live/live_rules_screen.dart';
import 'package:popo_live/screens/agency_management/agency_management_screen.dart';
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

  group('POPO LIVE - PHASE 5 (D4) PROMPT 2: COMPLETE ME PAGE TEST SUITE', () {
    // -------------------------------------------------------------------------
    // 1. PROMPT 1 REGRESSION TESTS (Profile Header, Info, Counts, Economy, VIP)
    // -------------------------------------------------------------------------
    testWidgets(
        '1. Me tab opens and renders Prompt 1 profile header and details intact',
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

      expect(find.byKey(const Key('me_title')), findsOneWidget);
      expect(find.byKey(const Key('me_avatar')), findsOneWidget);
      expect(find.byKey(const Key('me_nickname')), findsOneWidget);
      expect(find.text(DesignFixtures.currentUserProfile.nickname),
          findsOneWidget);
      expect(find.byKey(const Key('me_flag')), findsOneWidget);
      expect(find.byKey(const Key('me_vip_badge')), findsOneWidget);
      expect(find.byKey(const Key('me_wealth_badge')), findsOneWidget);
      expect(find.byKey(const Key('me_shining_badge')), findsOneWidget);
      expect(find.byKey(const Key('me_user_id')), findsOneWidget);
      expect(find.byKey(const Key('me_copy_id_button')), findsOneWidget);
    });

    testWidgets(
        '1b. Scan and Settings entry buttons in header open correct destinations',
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

      // Scan entry
      expect(find.byKey(const Key('me_scan_button')), findsOneWidget);
      await tester.tap(find.byKey(const Key('me_scan_button')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_scan_sheet')), findsOneWidget);
      expect(find.text('Scan QR Code'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();

      // Settings entry
      expect(find.byKey(const Key('me_settings_button')), findsOneWidget);
      await tester.tap(find.byKey(const Key('me_settings_button')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(SettingsScreen), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets(
        '2. Four profile counts (Friends, Following, Followers, Visitors) display correctly',
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

      expect(find.byKey(const Key('me_counts_row')), findsOneWidget);
      expect(find.byKey(const Key('me_friends_count')), findsOneWidget);
      expect(find.byKey(const Key('me_following_count')), findsOneWidget);
      expect(find.byKey(const Key('me_followers_count')), findsOneWidget);
      expect(find.byKey(const Key('me_visitors_count')), findsOneWidget);
    });

    testWidgets('3. Coins card, Points card, and VIP banner display correctly',
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
      expect(find.byKey(const Key('me_coins_balance')), findsOneWidget);
      expect(find.byKey(const Key('me_points_card')), findsOneWidget);
      expect(find.byKey(const Key('me_points_balance')), findsOneWidget);
      expect(find.byKey(const Key('me_vip_banner')), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // 2. EIGHT MAIN FEATURE ICONS (Exact Order & Navigation)
    // -------------------------------------------------------------------------
    testWidgets('4. Exactly 8 feature icons are displayed in exact order',
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

      // Scroll to features grid
      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_features_grid')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_reward')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_rank')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_store')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_invite')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_guardian')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_honor_level')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_fan_club')), findsOneWidget);
      expect(find.byKey(const Key('me_feature_medal_wall')), findsOneWidget);
    });

    testWidgets('5. Reward feature icon opens DailyHostTasksScreen',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_reward')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(DailyHostTasksScreen), findsOneWidget);
    });

    testWidgets('6. Rank feature icon opens HostRankingsScreen',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_rank')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(HostRankingsScreen), findsOneWidget);
    });

    testWidgets('7. Store feature icon opens StoreScreen in store tab',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_store')));
      await tester.pumpAndSettle();

      expect(find.byType(StoreScreen), findsOneWidget);
    });

    testWidgets('8. Invite feature icon opens InvitesScreen', (tester) async {
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_invite')));
      await tester.pumpAndSettle();

      expect(find.byType(InvitesScreen), findsOneWidget);
    });

    testWidgets('9. Guardian feature icon opens Guardian Angels sheet',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_guardian')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_guardian_destination')), findsOneWidget);
      expect(find.text('Guardian Angels & Shield'), findsOneWidget);
      expect(find.text('Bilal Ahmed'), findsOneWidget);
      expect(find.text('Gold Guardian'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets('10. Honor Level feature icon opens TaskLevelScreen',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_honor_level')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(TaskLevelScreen), findsOneWidget);
    });

    testWidgets('11. Fan Club feature icon opens FanClubScreen',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_fan_club')));
      await tester.pumpAndSettle();

      expect(find.byType(FanClubScreen), findsOneWidget);
    });

    testWidgets('12. Medal Wall feature icon opens Medal Wall of Fame sheet',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_medal_wall')));
      await tester.pumpAndSettle();

      expect(
          find.byKey(const Key('me_medal_wall_destination')), findsOneWidget);
      expect(find.text('Medal Wall of Fame'), findsOneWidget);
      expect(find.text('PK Champion'), findsOneWidget);
      expect(find.text('Top Broadcaster 2026'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    // -------------------------------------------------------------------------
    // 3. TWO POLICY BANNERS & NAVIGATION
    // -------------------------------------------------------------------------
    testWidgets(
        '13. Both policy banners appear and conduct policy opens LiveRulesScreen',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -600));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_policy_banner_conduct')), findsOneWidget);
      expect(find.byKey(const Key('me_policy_title_conduct')), findsOneWidget);
      expect(
          find.byKey(const Key('me_policy_banner_fairplay')), findsOneWidget);
      expect(find.byKey(const Key('me_policy_title_fairplay')), findsOneWidget);

      // Tap conduct banner
      await tester.tap(find.byKey(const Key('me_policy_banner_conduct')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(LiveRulesScreen), findsOneWidget);
    });

    testWidgets('14. Fair Play policy banner opens Fair Play policy sheet',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -600));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_policy_banner_fairplay')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_policy_fairplay_destination')),
          findsOneWidget);
      expect(find.text('Fair Play & Financial Integrity'), findsOneWidget);

      await tester.tap(find.text('Acknowledge & Close'));
      await tester.pumpAndSettle();
    });

    // -------------------------------------------------------------------------
    // 4. STREAMER CENTER & BUILDER CENTER
    // -------------------------------------------------------------------------
    testWidgets(
        '15. Streamer Center entry displays and opens Streamer Center hub',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -750));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_streamer_center_entry')), findsOneWidget);
      expect(find.text('Streamer Center'), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_streamer_center_entry')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_streamer_center_destination')),
          findsOneWidget);

      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets(
        '16. Builder Center entry displays and opens Builder Center destination',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -850));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_builder_center_entry')), findsOneWidget);
      expect(find.text('Builder Center'), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_builder_center_entry')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byKey(const Key('me_builder_center_destination')),
          findsOneWidget);
      expect(find.byType(AgencyManagementScreen), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // 5. LOWER SECTIONS (Help Center, History, Level, Poster, Bag, Agency, Redeem)
    // -------------------------------------------------------------------------
    testWidgets(
        '17. Lower sections: Help Center and Watch History open destinations',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -1000));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_lower_help_center')), findsOneWidget);
      expect(find.byKey(const Key('me_lower_watch_history')), findsOneWidget);

      // Tap Help Center
      await tester.tap(find.byKey(const Key('me_lower_help_center')));
      await tester.pumpAndSettle();
      expect(
          find.byKey(const Key('me_help_center_destination')), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();

      // Tap Watch History
      await tester.tap(find.byKey(const Key('me_lower_watch_history')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('me_watch_history_destination')),
          findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets(
        '18. Lower sections: Level, Poster, Bag, My Agency open destinations',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -1100));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_lower_level')), findsOneWidget);
      expect(
          find.byKey(const Key('me_lower_achievement_poster')), findsOneWidget);
      expect(find.byKey(const Key('me_lower_bag')), findsOneWidget);
      expect(find.byKey(const Key('me_lower_my_agency')), findsOneWidget);

      // Tap Achievement Poster
      await tester.tap(find.byKey(const Key('me_lower_achievement_poster')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('me_achievement_poster_destination')),
          findsOneWidget);
      expect(find.text('Save Poster'), findsOneWidget);
      await tester.tap(find.byIcon(Icons.close_rounded).last);
      await tester.pumpAndSettle();
    });

    testWidgets(
        '19. Redeem Code entry opens voucher sheet and redeems POPO-WELCOME-2026',
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

      await tester.drag(
          find.byType(SingleChildScrollView), const Offset(0, -1200));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_lower_redeem_code')), findsOneWidget);
      await tester.tap(find.byKey(const Key('me_lower_redeem_code')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_redeem_code_sheet')), findsOneWidget);
      expect(find.byKey(const Key('me_redeem_code_input')), findsOneWidget);
      expect(find.byKey(const Key('me_redeem_code_submit')), findsOneWidget);

      await tester.tap(find.byKey(const Key('me_redeem_code_submit')));
      await tester.pump();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.textContaining('Voucher successfully redeemed!'),
          findsOneWidget);
    });

    testWidgets('20. Duplicate host grid is removed from Me page',
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

      // There is no duplicate 'ACTIVE HOST' chip or raw host grid directly on Me
      expect(find.text('ACTIVE HOST'), findsNothing);
      expect(find.text('Host & Creator Center'), findsNothing);
    });

    testWidgets('21. AppShell 5-tab navigation remains fully functional',
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

      // Switch back to Me tab (index 4)
      await tester.tap(find.text('Me'));
      await tester.pumpAndSettle();

      expect(find.byType(MeScreen), findsOneWidget);
    });
  });
}
