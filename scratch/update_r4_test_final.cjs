const fs = require('fs');

// Remove scratch_debug_test.dart if exists
if (fs.existsSync('apps/mobile/test/scratch_debug_test.dart')) {
  fs.unlinkSync('apps/mobile/test/scratch_debug_test.dart');
}

const file = 'apps/mobile/test/r4_centers_and_children_test.dart';
const testCode = `import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/daily_tasks/daily_host_tasks_screen.dart';
import 'package:popo_live/screens/task_level/task_level_screen.dart';
import 'package:popo_live/screens/new_host_pack/new_host_pack_screen.dart';
import 'package:popo_live/screens/earning_identity/earning_identity_screen.dart';
import 'package:popo_live/screens/live/go_live_gate_screen.dart';
import 'package:popo_live/screens/live/watch_history_screen.dart';
import 'package:popo_live/screens/agency_management/agency_management_screen.dart';
import 'package:popo_live/screens/agency_management/coin_seller_screen.dart';
import 'package:popo_live/screens/agency_management/withdrawal_screen.dart';
import 'package:popo_live/screens/profile/me_screen.dart';
import 'package:popo_live/screens/profile/settings_screen.dart';
import 'package:popo_live/screens/profile/edit_profile_screen.dart';
import 'package:popo_live/screens/profile/public_profile_screen.dart';
import 'package:popo_live/screens/recognition/recognition_screen.dart';

final Uint8List _kTransparentImageBytes = Uint8List.fromList(<int>[
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
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

  group('POPO LIVE - SECTION 6 (R4) VERIFICATION TEST SUITE', () {
    // -------------------------------------------------------------------------
    // 1. STREAMER CENTER CHILDREN
    // -------------------------------------------------------------------------

    testWidgets('1. DailyHostTasksScreen displays fixture tasks, progress, and badges',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: DailyHostTasksScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Daily Host Tasks'), findsOneWidget);
      expect(find.text('Live Streaming'), findsWidgets);
      expect(find.text('Go Live for 60 Minutes'), findsOneWidget);
    });

    testWidgets('2. TaskLevelScreen displays fixture level info and progress bar',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: TaskLevelScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Host Task Level'), findsOneWidget);
      expect(find.text('Rising Star Creator'), findsWidgets);
      expect(find.textContaining('pts to Level'), findsOneWidget);
    });

    testWidgets('3. NewHostPackScreen displays starter pack and handles claim action',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      expect(DesignFixtures.isStarterPackClaimed, isFalse);

      await tester.pumpWidget(
        const MaterialApp(home: NewHostPackScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('New-Host Pack'), findsOneWidget);
      expect(find.text('Claim Starter Pack Now'), findsOneWidget);

      await tester.tap(find.text('Claim Starter Pack Now'));
      await tester.pumpAndSettle();

      expect(DesignFixtures.isStarterPackClaimed, isTrue);
      expect(find.text('Pack Claimed'), findsOneWidget);
    });

    testWidgets('4. EarningIdentityScreen displays verified identity details',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: EarningIdentityScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Earning Identity'), findsOneWidget);
      expect(find.text('Amina Noor'), findsWidgets);
      expect(find.text('VERIFIED'), findsWidgets);
    });

    testWidgets('5. GoLiveGateScreen enforces wealth level 5 requirement',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: GoLiveGateScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Go Live Gate'), findsOneWidget);
      expect(find.text('Broadcaster Onboarding'), findsOneWidget);
      expect(find.textContaining('Minimum Level 5 required'), findsOneWidget);
      expect(find.byKey(const Key('gate_back_button')), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // 2. BUILDER CENTER CHILDREN
    // -------------------------------------------------------------------------

    testWidgets('6. AgencyManagementScreen displays fixture agency details and member list',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: AgencyManagementScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Agency Management'), findsOneWidget);
      expect(find.text('Indus Star Media Agency'), findsOneWidget);
      expect(find.textContaining('AGY-78601'), findsOneWidget);
      expect(find.textContaining('Kamran Malik'), findsWidgets);

      // Tap HOSTS tab
      await tester.tap(find.text('HOSTS'));
      await tester.pumpAndSettle();

      expect(find.text('Amina Noor'), findsWidgets);
      expect(find.text('Sana Ali'), findsWidgets);
    });

    testWidgets('7. CoinSellerScreen displays authorized seller profile and inventory',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: CoinSellerScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Coin Seller Portal'), findsOneWidget);
      expect(find.text('Karachi TopUp Express'), findsOneWidget);
      expect(find.textContaining('+92 300 8765432'), findsOneWidget);
      expect(find.text('SELLER COIN INVENTORY'), findsOneWidget);
    });

    testWidgets('8. WithdrawalScreen handles points input validation and simulation submission',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: WithdrawalScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Earnings Withdrawal'), findsOneWidget);
      expect(find.text('WITHDRAWAL POINTS BALANCE'), findsOneWidget);
      expect(find.text('Withdrawal Points Amount'), findsOneWidget);
      expect(find.text(r'25,000 ($25)'), findsOneWidget);

      // Quick chip selection
      await tester.tap(find.text(r'25,000 ($25)'));
      await tester.pumpAndSettle();

      // Submit withdrawal
      await tester.tap(find.text(r'Withdraw $25.00 USD'));
      await tester.pumpAndSettle();

      expect(find.text('Withdrawal Submitted'), findsOneWidget);
      expect(find.text('Done'), findsOneWidget);

      await tester.tap(find.text('Done'));
      await tester.pumpAndSettle();
    });

    testWidgets('9. WatchHistoryScreen displays real list of fixture rooms with details',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: WatchHistoryScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('watch_history_title')), findsOneWidget);
      expect(find.text('Broadcast Watch History'), findsOneWidget);
      expect(find.text('Karachi Nights 🎶 Acoustic Live Session'), findsOneWidget);
      expect(find.text('Amina Noor'), findsWidgets);
    });

    // -------------------------------------------------------------------------
    // 3. SETTINGS & PROFILE SCREENS
    // -------------------------------------------------------------------------

    testWidgets('10. SettingsScreen displays user info card and blocked users with unblock capability',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      expect(DesignFixtures.blockedUsers.length, equals(2));

      await tester.pumpWidget(
        const MaterialApp(home: SettingsScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('settings_user_info_card')), findsOneWidget);
      expect(find.text('Amina Noor'), findsOneWidget);
      expect(find.textContaining('883901'), findsOneWidget);
      expect(find.text('Wealth Lv.12'), findsOneWidget);
      expect(find.text('Host Lv.18'), findsOneWidget);

      // Open Blocked Users sheet
      expect(find.byKey(const Key('settings_blocked_users_card')), findsOneWidget);
      await tester.tap(find.byKey(const Key('settings_blocked_users_card')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('blocked_users_sheet')), findsOneWidget);
      expect(find.text('SpamBot_99'), findsOneWidget);

      // Tap Unblock button
      await tester.tap(find.text('Unblock').first);
      await tester.pumpAndSettle();

      expect(DesignFixtures.blockedUsers.length, equals(1));
    });

    testWidgets('11. EditProfileScreen pre-populates fixture data and persists updates',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: EditProfileScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Edit Profile'), findsOneWidget);
      expect(find.text('Amina Noor'), findsOneWidget);

      // Enter new nickname
      await tester.enterText(find.byType(TextField).first, 'Amina_Star');
      await tester.pumpAndSettle();

      // Tap Save
      await tester.tap(find.text('Save Changes'));
      await tester.pumpAndSettle();

      expect(DesignFixtures.currentUserProfile.nickname, equals('Amina_Star'));
    });

    testWidgets('12. PublicProfileScreen renders fixture profile and toggles follow state',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: PublicProfileScreen(userId: 'u_sana_ali')),
      );
      await tester.pumpAndSettle();

      expect(find.text('Sana Ali'), findsOneWidget);

      // Sana Ali is initially followed in fixtures: displays Unfollow
      expect(find.text('Unfollow'), findsOneWidget);
      expect(DesignFixtures.isUserFollowed('u_sana_ali'), isTrue);

      await tester.tap(find.text('Unfollow'));
      await tester.pumpAndSettle();

      expect(DesignFixtures.isUserFollowed('u_sana_ali'), isFalse);
      expect(find.text('Follow'), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // 4. ME PAGE INTEGRATION: Streamer Center & Builder Center
    // -------------------------------------------------------------------------

    testWidgets('13. Me page Streamer Center tool tiles open required children',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: MeScreen()),
      );
      await tester.pumpAndSettle();

      // Scroll down to Streamer Center
      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -750));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_streamer_center_entry')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('me_streamer_center_destination')), findsOneWidget);
      expect(find.text('Daily Tasks'), findsOneWidget);
      expect(find.text('Task Level'), findsOneWidget);
      expect(find.text('Starter Pack'), findsOneWidget);
      expect(find.text('Earning KYC'), findsOneWidget);
      expect(find.text('Go Live Studio'), findsOneWidget);

      // Tap Starter Pack inside Streamer Center
      await tester.tap(find.text('Starter Pack'));
      await tester.pumpAndSettle();

      expect(find.byType(NewHostPackScreen), findsOneWidget);
    });

    testWidgets('14. Me page Honor Level and Level open RecognitionScreen (not TaskLevelScreen)',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        const MaterialApp(home: MeScreen()),
      );
      await tester.pumpAndSettle();

      // Scroll to Honor Level feature icon
      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -350));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_feature_honor_level')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(RecognitionScreen), findsOneWidget);
      expect(find.byType(TaskLevelScreen), findsNothing);

      await tester.tap(find.byIcon(Icons.arrow_back_ios_new_rounded).first);
      await tester.pumpAndSettle();

      // Scroll to lower Level row
      await tester.drag(find.byType(SingleChildScrollView), const Offset(0, -1100));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_lower_level')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(RecognitionScreen), findsOneWidget);
      expect(find.byType(TaskLevelScreen), findsNothing);
    });
  });
}
`;

fs.writeFileSync(file, testCode, 'utf8');
console.log('Updated r4_centers_and_children_test.dart with exact expectations');
