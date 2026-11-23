import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/profile/me_screen.dart';
import 'package:popo_live/screens/profile/user_relation_list_screen.dart';
import 'package:popo_live/widgets/popo_empty_state.dart';
import 'package:popo_live/widgets/popo_error_state.dart';

final Uint8List _kTransparentImageBytes = Uint8List.fromList(<int>[
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D,
  0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42,
  0x60, 0x82,
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

void _resetViewport(WidgetTester tester) {
  tester.view.resetPhysicalSize();
  tester.view.resetDevicePixelRatio();
}

Widget _wrapWithApp(Widget child) {
  return MaterialApp(
    theme: ThemeData.dark(),
    home: child,
  );
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
  });

  tearDown(() {
    DesignFixtures.reset();
  });

  group('POPO LIVE — B0 PROMPT 1: FOUR PEOPLE LISTS WIRING VERIFICATION', () {
    testWidgets('1. Friends count tap opens UserRelationListScreen with Friends type and title', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      await tester.pumpWidget(_wrapWithApp(const MeScreen()));
      await tester.pumpAndSettle();

      final friendsEntry = find.byKey(const Key('me_friends_entry'));
      expect(friendsEntry, findsOneWidget);
      await tester.tap(friendsEntry);
      await tester.pumpAndSettle();

      expect(find.byType(UserRelationListScreen), findsOneWidget);
      final listScreen = tester.widget<UserRelationListScreen>(find.byType(UserRelationListScreen));
      expect(listScreen.type, equals(UserRelationType.friends));
      expect(listScreen.count, equals(DesignFixtures.currentUserProfile.friendsCount));

      expect(find.text('Friends (36)'), findsOneWidget);
      expect(find.text('36 Friends'), findsOneWidget);
      expect(find.textContaining('Phase D5'), findsNothing);
    });

    testWidgets('2. Following count tap opens UserRelationListScreen with Following type and title', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      await tester.pumpWidget(_wrapWithApp(const MeScreen()));
      await tester.pumpAndSettle();

      final followingEntry = find.byKey(const Key('me_following_entry'));
      expect(followingEntry, findsOneWidget);
      await tester.tap(followingEntry);
      await tester.pumpAndSettle();

      expect(find.byType(UserRelationListScreen), findsOneWidget);
      final listScreen = tester.widget<UserRelationListScreen>(find.byType(UserRelationListScreen));
      expect(listScreen.type, equals(UserRelationType.following));
      expect(listScreen.count, equals(DesignFixtures.currentUserProfile.followingCount));

      expect(find.text('Following (84)'), findsOneWidget);
      expect(find.text('84 Following'), findsOneWidget);
      expect(find.textContaining('Phase D5'), findsNothing);
    });

    testWidgets('3. Followers count tap opens UserRelationListScreen with Followers type and title', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      await tester.pumpWidget(_wrapWithApp(const MeScreen()));
      await tester.pumpAndSettle();

      final followersEntry = find.byKey(const Key('me_followers_entry'));
      expect(followersEntry, findsOneWidget);
      await tester.tap(followersEntry);
      await tester.pumpAndSettle();

      expect(find.byType(UserRelationListScreen), findsOneWidget);
      final listScreen = tester.widget<UserRelationListScreen>(find.byType(UserRelationListScreen));
      expect(listScreen.type, equals(UserRelationType.followers));
      expect(listScreen.count, equals(DesignFixtures.currentUserProfile.followersCount));

      expect(find.text('Followers (14,200)'), findsOneWidget);
      expect(find.text('14,200 Followers'), findsOneWidget);
      expect(find.textContaining('Phase D5'), findsNothing);
    });

    testWidgets('4. Visitors count tap opens UserRelationListScreen with Visitors type and title', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      await tester.pumpWidget(_wrapWithApp(const MeScreen()));
      await tester.pumpAndSettle();

      final visitorsEntry = find.byKey(const Key('me_visitors_entry'));
      expect(visitorsEntry, findsOneWidget);
      await tester.tap(visitorsEntry);
      await tester.pumpAndSettle();

      expect(find.byType(UserRelationListScreen), findsOneWidget);
      final listScreen = tester.widget<UserRelationListScreen>(find.byType(UserRelationListScreen));
      expect(listScreen.type, equals(UserRelationType.visitors));
      expect(listScreen.count, equals(DesignFixtures.currentUserProfile.visitorCount));

      expect(find.text('Visitors (18,950)'), findsOneWidget);
      expect(find.text('18,950 Visitors'), findsOneWidget);
      expect(find.textContaining('Phase D5'), findsNothing);
    });

    testWidgets('5. Back navigation returns from UserRelationListScreen to MeScreen', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      await tester.pumpWidget(_wrapWithApp(const MeScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('me_friends_entry')));
      await tester.pumpAndSettle();
      expect(find.byType(UserRelationListScreen), findsOneWidget);

      final backButton = find.byIcon(Icons.arrow_back_ios_new_rounded);
      expect(backButton, findsOneWidget);
      await tester.tap(backButton);
      await tester.pumpAndSettle();

      expect(find.byType(UserRelationListScreen), findsNothing);
      expect(find.byType(MeScreen), findsOneWidget);
    });

    testWidgets('6. Filled fixture state renders real person rows with canonical names and follow toggle', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      await tester.pumpWidget(_wrapWithApp(
        const UserRelationListScreen(
          type: UserRelationType.friends,
          count: 36,
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Sana Ali'), findsOneWidget);
      expect(find.text('Bilal Ahmed'), findsOneWidget);
      expect(find.text('Zainab Khan'), findsOneWidget);
      expect(find.text('Hamza Tariq'), findsOneWidget);

      expect(find.text('Pakistan'), findsWidgets);

      final followingButton = find.text('Following').first;
      expect(followingButton, findsOneWidget);
      await tester.tap(followingButton);
      await tester.pumpAndSettle();

      expect(find.textContaining('Unfollowed'), findsOneWidget);
    });

    testWidgets('7. Empty fixture state displays PopoEmptyState', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      DesignFixtures.setEmpty();

      await tester.pumpWidget(_wrapWithApp(
        const UserRelationListScreen(
          type: UserRelationType.friends,
          count: 0,
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(PopoEmptyState), findsOneWidget);
      expect(find.text('No Friends Yet'), findsOneWidget);
      expect(find.text('Connect and follow users back to form mutual friendships.'), findsOneWidget);
    });

    testWidgets('8. Error fixture state displays PopoErrorState', (tester) async {
      _setPhoneViewport(tester);
      addTearDown(() => _resetViewport(tester));

      DesignFixtures.setError();

      await tester.pumpWidget(_wrapWithApp(
        const UserRelationListScreen(
          type: UserRelationType.friends,
          count: 36,
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(PopoErrorState), findsOneWidget);
      expect(find.text('Friends Unavailable'), findsOneWidget);
      expect(find.text('Unable to synchronize Friends list from network. Please check your connection and retry.'), findsOneWidget);
    });
  });
}
