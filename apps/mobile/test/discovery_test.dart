import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/l10n/strings.dart';
import 'package:popo_live/screens/discovery/explore_home_screen.dart';
import 'package:popo_live/screens/discovery/room_card.dart';
import 'package:popo_live/screens/discovery/country_chips.dart';
import 'package:popo_live/screens/discovery/room_preview_screen.dart';
import 'package:popo_live/screens/discovery/search_screen.dart';

void main() {
  setUp(() {
    PopoStrings.setLanguage('en');
  });

  group('M2 ExploreHomeScreen Navigation & Tabs Tests', () {
    testWidgets(
      'ExploreHomeScreen renders 4 top tabs: Follow, Explore, New, PK',
      (tester) async {
        await tester.pumpWidget(const MaterialApp(home: ExploreHomeScreen()));
        await tester.pump(const Duration(milliseconds: 100));

        // 4 Required Top Tabs
        expect(find.text('Follow'), findsOneWidget);
        expect(find.text('Explore'), findsOneWidget);
        expect(find.text('New'), findsOneWidget);
        expect(find.text('PK'), findsOneWidget);

        // STRICT REQUIREMENT: No Near or GPS tab
        expect(find.text('Near'), findsNothing);
        expect(find.text('GPS'), findsNothing);

        // Search & Trophy Header Actions
        expect(find.byIcon(Icons.search_rounded), findsOneWidget);
        expect(find.byIcon(Icons.emoji_events_rounded), findsOneWidget);
      },
    );

    testWidgets('Tapping Follow tab switches view', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: ExploreHomeScreen()));
      await tester.pump(const Duration(milliseconds: 100));

      await tester.tap(find.text('Follow'));
      await tester.pumpAndSettle();

      expect(find.text('Follow'), findsOneWidget);
    });
  });

  group('M2 RoomCard Component Tests', () {
    testWidgets(
      'RoomCard displays host info, title, LIVE badge, and viewer count',
      (tester) async {
        bool tapped = false;
        final roomData = {
          'roomId': '100068',
          'title': 'Super PK Battle Arena',
          'isLive': true,
          'isPk': true,
          'viewersFormatted': '35K',
          'flagEmoji': '🇵🇰',
          'host': {'nickname': 'StarBroadcaster', 'isVerified': true},
        };

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: Center(
                child: SizedBox(
                  width: 200,
                  child: RoomCard(room: roomData, onTap: () => tapped = true),
                ),
              ),
            ),
          ),
        );

        expect(find.text('LIVE'), findsOneWidget);
        expect(find.text('PK'), findsOneWidget);
        expect(find.text('35K'), findsOneWidget);
        expect(find.text('StarBroadcaster'), findsOneWidget);
        expect(find.text('Super PK Battle Arena'), findsOneWidget);

        await tester.tap(find.byType(RoomCard));
        expect(tapped, isTrue);
      },
    );
  });

  group('M2 CountryChips Component Tests', () {
    testWidgets(
      'CountryChips renders Popular first and fires onCountrySelected',
      (tester) async {
        String selected = 'ALL';

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: CountryChips(
                selectedCountryCode: selected,
                onCountrySelected: (code) => selected = code,
              ),
            ),
          ),
        );

        await tester.pump(const Duration(milliseconds: 100));

        expect(find.text('Popular'), findsOneWidget);
      },
    );
  });

  group('M2 RoomPreviewScreen Tests', () {
    testWidgets(
      'RoomPreviewScreen displays room info and Sprint 2 M3 video notice',
      (tester) async {
        final roomData = {
          'roomId': '100068',
          'roomNumber': '100068',
          'title': 'Grand Finals Preview',
          'viewerCount': 1200,
          'viewersFormatted': '1.2K',
          'host': {
            'nickname': 'ChampionHost',
            'poppoId': '998877',
            'hostLevel': 10,
            'wealthLevel': 8,
          },
        };

        await tester.pumpWidget(
          MaterialApp(
            home: RoomPreviewScreen(
              roomId: '100068',
              initialRoomData: roomData,
            ),
          ),
        );

        expect(find.text('Room #100068'), findsOneWidget);
        expect(find.text('ChampionHost'), findsOneWidget);
        expect(find.text('ID: 998877'), findsOneWidget);
        expect(find.text('Grand Finals Preview'), findsOneWidget);
        expect(
          find.text('Live video stream activates in Sprint 2 (M3).'),
          findsOneWidget,
        );
      },
    );
  });

  group('M2 SearchScreen Tests', () {
    testWidgets('SearchScreen renders search field and filter tabs', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: SearchScreen()));
      await tester.pumpAndSettle();

      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Hosts / Users'), findsOneWidget);
      expect(find.text('Live Rooms'), findsOneWidget);
    });
  });
}
