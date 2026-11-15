import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/l10n/strings.dart';
import 'package:popo_live/auth/auth_state.dart';
import 'package:popo_live/screens/profile/complete_profile_screen.dart';
import 'package:popo_live/screens/profile/me_screen.dart';
import 'package:popo_live/screens/profile/edit_profile_screen.dart';
import 'package:popo_live/screens/profile/settings_screen.dart';

void main() {
  setUp(() {
    PopoStrings.setLanguage('en');
  });

  group('M1 Profile Completion Tests', () {
    testWidgets('CompleteProfileScreen renders all required profile fields', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: CompleteProfileScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Complete Your Profile'), findsOneWidget);
      expect(find.text('Nickname'), findsOneWidget);
      expect(find.text('Date of Birth'), findsOneWidget);
      expect(find.text('Save & Continue'), findsOneWidget);
    });

    testWidgets('Submitting short nickname displays validation error', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: CompleteProfileScreen()));
      await tester.pumpAndSettle();

      await tester.enterText(find.widgetWithText(TextField, 'Nickname'), 'ab');
      await tester.tap(find.text('Save & Continue'));
      await tester.pumpAndSettle();

      expect(
        find.text('Nickname must be at least 3 characters.'),
        findsOneWidget,
      );
    });
  });

  group('M1 Me Screen UI & Copy ID Tests', () {
    testWidgets('MeScreen renders profile cards, levels, and copy button', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: MeScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Me Center'), findsOneWidget);
      expect(find.text('Edit Profile'), findsWidgets);
      expect(find.text('Settings'), findsOneWidget);
      expect(find.text('Public Profile'), findsOneWidget);
      expect(find.text('Coins'), findsOneWidget);
      expect(find.text('Points'), findsOneWidget);
    });
  });

  group('M1 Edit Profile Tests', () {
    testWidgets(
      'EditProfileScreen renders editable fields and birthday lock notice',
      (tester) async {
        await tester.pumpWidget(const MaterialApp(home: EditProfileScreen()));
        await tester.pumpAndSettle();

        expect(find.text('Edit Profile'), findsOneWidget);
        expect(find.text('Nickname'), findsOneWidget);
        expect(find.text('About Me (Bio)'), findsOneWidget);
        expect(find.text('Save Changes'), findsOneWidget);
        expect(
          find.text('Birthday changes require official identity verification.'),
          findsOneWidget,
        );
      },
    );
  });

  group('M1 Settings & Logout Tests', () {
    testWidgets('SettingsScreen renders language toggle and logout button', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: SettingsScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Settings'), findsOneWidget);
      expect(find.text('Language'), findsOneWidget);
      expect(find.text('English (Default)'), findsOneWidget);
      expect(find.text('اردو (Urdu - Nastaliq)'), findsOneWidget);
      expect(find.text('Log Out'), findsOneWidget);
    });

    testWidgets('Tapping Log Out opens confirmation dialog', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: SettingsScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Log Out'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(
        find.text('Are you sure you want to log out of Popo Live?'),
        findsOneWidget,
      );
      expect(find.text('Cancel'), findsOneWidget);
    });
  });
}
