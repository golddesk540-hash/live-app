import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/app.dart';
import 'package:popo_live/widgets/popo_primary_button.dart';
import 'package:popo_live/widgets/popo_secondary_button.dart';
import 'package:popo_live/widgets/popo_card.dart';
import 'package:popo_live/widgets/popo_icon_button.dart';
import 'package:popo_live/widgets/popo_section_header.dart';
import 'package:popo_live/widgets/popo_empty_state.dart';
import 'package:popo_live/l10n/strings.dart';

void main() {
  setUp(() {
    PopoStrings.setLanguage('en');
  });

  group('M0 AppShell & Navigation Tests', () {
    testWidgets('AppShell renders with five bottom navigation tabs', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const PopoLiveApp());
      await tester.pumpAndSettle();

      // Verify 5 bottom tabs exist
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Party'), findsOneWidget);
      expect(find.text('Go Live'), findsOneWidget);
      expect(find.text('Inbox'), findsOneWidget);
      expect(find.text('Me'), findsOneWidget);

      // Verify Home is selected by default
      expect(find.text('Explore'), findsWidgets);
    });

    testWidgets('Tapping Party tab displays locked Sprint 2 banner', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const PopoLiveApp());
      await tester.pumpAndSettle();

      // Tap Party tab
      await tester.tap(find.text('Party'));
      await tester.pumpAndSettle();

      // Verify locked banner
      expect(find.text('Sprint Feature'), findsOneWidget);
      expect(find.text('Back to Explore'), findsOneWidget);

      // Tap Back to Explore
      await tester.tap(find.text('Back to Explore'));
      await tester.pumpAndSettle();

      // Should be back at Home tab
      expect(find.text('Popo Live'), findsOneWidget);
    });

    testWidgets('Language switcher toggles English and Urdu', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(const PopoLiveApp());
      await tester.pumpAndSettle();

      // Default is English
      expect(find.text('Home'), findsOneWidget);

      // Tap language switch button in AppBar
      final langButton = find.byTooltip('Switch Language (English / اردو)');
      expect(langButton, findsOneWidget);
      await tester.tap(langButton);
      await tester.pumpAndSettle();

      // Verify Urdu is active
      expect(find.text('ہوم'), findsOneWidget);
      expect(find.text('پارٹی'), findsOneWidget);

      // Toggle back to English
      await tester.tap(langButton);
      await tester.pumpAndSettle();
      expect(find.text('Home'), findsOneWidget);
    });
  });

  group('M0 Reusable UI Component Tests', () {
    testWidgets('PopoPrimaryButton triggers callback on tap', (
      WidgetTester tester,
    ) async {
      bool tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PopoPrimaryButton(
              text: 'Confirm Action',
              onPressed: () => tapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Confirm Action'), findsOneWidget);
      await tester.tap(find.text('Confirm Action'));
      expect(tapped, isTrue);
    });

    testWidgets('PopoSecondaryButton renders outline style', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PopoSecondaryButton(text: 'Cancel', onPressed: () {}),
          ),
        ),
      );

      expect(find.text('Cancel'), findsOneWidget);
    });

    testWidgets('PopoCard displays child content with dark surface', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: PopoCard(child: Text('Card Content'))),
        ),
      );

      expect(find.text('Card Content'), findsOneWidget);
    });

    testWidgets('PopoIconButton displays badge counter', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PopoIconButton(
              icon: Icons.notifications,
              badgeCount: 5,
              onPressed: () {},
            ),
          ),
        ),
      );

      expect(find.text('5'), findsOneWidget);
    });

    testWidgets('PopoSectionHeader displays title, badge, and action', (
      WidgetTester tester,
    ) async {
      bool actionTapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PopoSectionHeader(
              title: 'Popular Hosts',
              badgeText: 'HOT',
              actionText: 'See All',
              onActionTap: () => actionTapped = true,
            ),
          ),
        ),
      );

      expect(find.text('Popular Hosts'), findsOneWidget);
      expect(find.text('HOT'), findsOneWidget);
      expect(find.text('See All'), findsOneWidget);

      await tester.tap(find.text('See All'));
      expect(actionTapped, isTrue);
    });

    testWidgets('PopoEmptyState displays title, message, and CTA', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PopoEmptyState(
              icon: Icons.inbox,
              title: 'No Messages',
              message: 'Your inbox is currently empty.',
              actionText: 'Refresh',
              onActionTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('No Messages'), findsOneWidget);
      expect(find.text('Your inbox is currently empty.'), findsOneWidget);
      expect(find.text('Refresh'), findsOneWidget);
    });
  });
}
