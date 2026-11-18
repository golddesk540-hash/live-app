import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/live/viewer_room_screen.dart';
import 'package:popo_live/screens/pk/pk_battle_type_screen.dart';
import 'package:popo_live/screens/pk/pk_invite_screen.dart';
import 'package:popo_live/screens/pk/pk_result_screen.dart';
import 'package:popo_live/screens/pk/pk_score_screen.dart';

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
    DesignFixtures.setState(DesignFixtureState.filled);
  });

  group('PK Battle System (1v1) — Individual Screens Verification', () {
    testWidgets('1. PK Type Screen displays 1v1 format only, no 4-host option',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        MaterialApp(
          home: PkBattleTypeScreen(
            room: DesignFixtures.liveRooms.first,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Select PK Type'), findsOneWidget);
      expect(find.byKey(const Key('pk_type_1v1_card')), findsOneWidget);
      expect(find.text('1v1 PK Faceoff'), findsOneWidget);
      expect(find.byKey(const Key('pk_type_continue_button')), findsOneWidget);

      // STRICT REQUIREMENT: 4-host PK must NOT exist
      expect(find.textContaining('4-Host'), findsNothing);
      expect(find.textContaining('4 Host'), findsNothing);
      expect(find.textContaining('Four Host'), findsNothing);
      expect(find.textContaining('4v4'), findsNothing);
    });

    testWidgets('2. PK Invite Screen lists opponents, allows single selection only',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        MaterialApp(
          home: PkInviteScreen(
            currentRoom: DesignFixtures.liveRooms.first,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Invite PK Opponent (1v1)'), findsOneWidget);
      expect(find.byKey(const Key('pk_opponent_list')), findsOneWidget);
      expect(find.byKey(const Key('pk_invitation_status_banner')), findsOneWidget);

      // Opponents from fixture (Sana Ali, Bilal Ahmed, etc.)
      expect(find.text('Sana Ali'), findsOneWidget);
      expect(find.text('Bilal Ahmed'), findsOneWidget);

      // Tap invite on Bilal Ahmed
      final inviteBilal = find.byKey(const Key('invite_host_room_003'));
      expect(inviteBilal, findsOneWidget);
      await tester.tap(inviteBilal);
      await tester.pumpAndSettle();

      // Start button is active and displays selected opponent
      expect(find.byKey(const Key('pk_invite_start_button')), findsOneWidget);
      expect(find.textContaining('vs Bilal Ahmed'), findsOneWidget);
    });

    testWidgets('3. PK Score Screen displays both hosts, scores, timer, reactions, and boosts',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final hostA = DesignFixtures.liveRooms[0];
      final hostB = DesignFixtures.liveRooms[1];

      await tester.pumpWidget(
        MaterialApp(
          home: PkScoreScreen(
            hostARoom: hostA,
            hostBRoom: hostB,
            initialScoreA: 14500,
            initialScoreB: 12200,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('1v1 PK Battle Arena'), findsOneWidget);
      expect(find.byKey(const Key('pk_battle_status')), findsOneWidget);
      expect(find.byKey(const Key('pk_countdown_timer')), findsOneWidget);

      // Check scores
      expect(find.byKey(const Key('host_a_score')), findsOneWidget);
      expect(find.byKey(const Key('host_b_score')), findsOneWidget);
      expect(find.text('14,500'), findsOneWidget);
      expect(find.text('12,200'), findsOneWidget);

      // Test Cheer / Boost Host A (+500)
      final boostA = find.byKey(const Key('boost_host_a_button'));
      expect(boostA, findsOneWidget);
      await tester.tap(boostA);
      await tester.pumpAndSettle();
      expect(find.text('15,000'), findsOneWidget);

      // Test Reaction interaction (Fire)
      final fireBtn = find.byKey(const Key('pk_reaction_fire'));
      expect(fireBtn, findsOneWidget);
      await tester.tap(fireBtn);
      await tester.pumpAndSettle();
      expect(find.textContaining('Reaction sent!'), findsOneWidget);

      // Finalize button exists
      expect(find.byKey(const Key('end_pk_battle_button')), findsOneWidget);
    });

    testWidgets('4. PK Result Screen declares winner and handles return to Live Viewer',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final hostA = DesignFixtures.liveRooms[0];
      final hostB = DesignFixtures.liveRooms[1];

      await tester.pumpWidget(
        MaterialApp(
          home: PkResultScreen(
            hostARoom: hostA,
            hostBRoom: hostB,
            winnerRoom: hostA,
            loserRoom: hostB,
            winnerScore: 18500,
            loserScore: 14200,
            scoreA: 18500,
            scoreB: 14200,
            isTie: false,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('VICTORY'), findsOneWidget);
      expect(find.textContaining('Won the PK Faceoff!'), findsOneWidget);
      expect(find.text('PK CHAMPION'), findsOneWidget);
      expect(find.text('SCORE BREAKDOWN'), findsOneWidget);
      expect(find.text('18,500'), findsOneWidget);
      expect(find.text('14,200'), findsOneWidget);

      expect(find.byKey(const Key('return_to_live_viewer_button')), findsOneWidget);
    });

    testWidgets('5. PK Result Screen handles Draw / Tied score appropriately',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      final hostA = DesignFixtures.liveRooms[0];
      final hostB = DesignFixtures.liveRooms[1];

      await tester.pumpWidget(
        MaterialApp(
          home: PkResultScreen(
            hostARoom: hostA,
            hostBRoom: hostB,
            winnerRoom: hostA,
            loserRoom: hostB,
            winnerScore: 15000,
            loserScore: 15000,
            scoreA: 15000,
            scoreB: 15000,
            isTie: true,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('🤝 DRAW / TIED BATTLE'), findsOneWidget);
      expect(find.text('Both Broadcasters Finished Equal!'), findsOneWidget);
    });
  });

  group('PK Battle System (1v1) — End-to-End Navigation Journey', () {
    testWidgets(
        'Live Viewer → PK Button → PK Type → Invite → Score → Reactions → Result → Return to Live Viewer',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      // 1. Open Live Viewer Screen
      await tester.pumpWidget(
        MaterialApp(
          home: ViewerRoomScreen(
            roomId: 'room_001',
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find PK Entry Button on Live Viewer
      final pkEntryBtn = find.byKey(const Key('pk_entry_button'));
      expect(pkEntryBtn, findsOneWidget);

      // Tap PK Entry Button -> Opens PK Type Screen
      await tester.tap(pkEntryBtn);
      await tester.pumpAndSettle();
      expect(find.text('Select PK Type'), findsOneWidget);
      expect(find.byKey(const Key('pk_type_1v1_card')), findsOneWidget);

      // 2. Tap Continue on PK Type Screen -> Opens PK Invite Screen
      final continueTypeBtn = find.byKey(const Key('pk_type_continue_button'));
      expect(continueTypeBtn, findsOneWidget);
      await tester.tap(continueTypeBtn);
      await tester.pumpAndSettle();
      expect(find.text('Invite PK Opponent (1v1)'), findsOneWidget);

      // 3. Select Opponent & Tap Start Battle -> Opens PK Score Screen
      final startBattleBtn = find.byKey(const Key('pk_invite_start_button'));
      expect(startBattleBtn, findsOneWidget);
      await tester.tap(startBattleBtn);
      await tester.pumpAndSettle();
      expect(find.text('1v1 PK Battle Arena'), findsOneWidget);
      expect(find.byKey(const Key('host_a_score')), findsOneWidget);

      // 4. Send Reaction (Heart)
      final heartBtn = find.byKey(const Key('pk_reaction_heart'));
      expect(heartBtn, findsOneWidget);
      await tester.tap(heartBtn);
      await tester.pumpAndSettle();
      expect(find.textContaining('Reaction sent!'), findsOneWidget);

      // 5. Finalize Battle -> Opens PK Result Screen
      final finalizeBtn = find.byKey(const Key('end_pk_battle_button'));
      expect(finalizeBtn, findsOneWidget);
      await tester.tap(finalizeBtn);
      await tester.pumpAndSettle();
      expect(find.text('VICTORY'), findsOneWidget);

      // 6. Tap Return to Live Viewer -> Back to Live Viewer with original room preserved!
      final returnBtn = find.byKey(const Key('return_to_live_viewer_button'));
      expect(returnBtn, findsOneWidget);
      await tester.tap(returnBtn);
      await tester.pumpAndSettle();

      // Back on Viewer Room Screen!
      expect(find.byKey(const Key('pk_entry_button')), findsOneWidget);
      expect(find.byKey(const Key('open_gift_sheet_button')), findsOneWidget);
    });

    testWidgets('Back navigation returns step-by-step from PK Invite to Live Viewer',
        (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        MaterialApp(
          home: ViewerRoomScreen(
            roomId: 'room_001',
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Open PK Type
      await tester.tap(find.byKey(const Key('pk_entry_button')));
      await tester.pumpAndSettle();
      expect(find.text('Select PK Type'), findsOneWidget);

      // Open PK Invite
      await tester.tap(find.byKey(const Key('pk_type_continue_button')));
      await tester.pumpAndSettle();
      expect(find.text('Invite PK Opponent (1v1)'), findsOneWidget);

      // Back to PK Type
      await tester.tap(find.byKey(const Key('pk_invite_back_button')));
      await tester.pumpAndSettle();
      expect(find.text('Select PK Type'), findsOneWidget);

      // Back to Live Viewer
      await tester.tap(find.byKey(const Key('pk_type_back_button')));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('pk_entry_button')), findsOneWidget);
    });
  });
}
