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

void main() {
  group('Phase 2 (D1) Prompt 1 - Mobile Bottom Navigation Bar Tests', () {
    testWidgets('PopoBottomNavigation renders exactly 5 uniform tabs in correct order',
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

      // Verify the 5 labels appear in the widget tree
      expect(find.text(PopoStrings.tabLive), findsOneWidget);
      expect(find.text(PopoStrings.tabExplore), findsOneWidget);
      expect(find.text(PopoStrings.tabSquare), findsOneWidget);
      expect(find.text(PopoStrings.tabMessage), findsOneWidget);
      expect(find.text(PopoStrings.tabMe), findsOneWidget);

      // Verify NO raised / floating Go Live button exists
      expect(find.text(PopoStrings.tabGoLive), findsNothing);
      expect(find.byIcon(Icons.videocam_rounded), findsNothing);

      // Verify the 5 tab icons exist
      expect(find.byIcon(Icons.live_tv_rounded), findsOneWidget); // Active Tab 0
      expect(find.byIcon(Icons.auto_awesome_outlined), findsOneWidget); // Inactive Tab 1
      expect(find.byIcon(Icons.grid_view_outlined), findsOneWidget); // Inactive Tab 2
      expect(find.byIcon(Icons.chat_bubble_outline_rounded), findsOneWidget); // Inactive Tab 3
      expect(find.byIcon(Icons.person_outline_rounded), findsOneWidget); // Inactive Tab 4

      // Test tapping each tab triggers onTabSelected with correct index
      // Tap Explore (index 1)
      await tester.tap(find.text(PopoStrings.tabExplore));
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

      // Tap Me (index 4)
      await tester.tap(find.text(PopoStrings.tabMe));
      await tester.pumpAndSettle();
      expect(selectedTab, 4);

      // Tap Live (index 0)
      await tester.tap(find.text(PopoStrings.tabLive));
      await tester.pumpAndSettle();
      expect(selectedTab, 0);
    });

    testWidgets('PopoBottomNavigation displays badge on Message tab when messageBadgeCount > 0',
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

    testWidgets('AppShell houses all 5 destination widgets in IndexedStack in exact order',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: AppShell(initialIndex: 0),
        ),
      );

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
