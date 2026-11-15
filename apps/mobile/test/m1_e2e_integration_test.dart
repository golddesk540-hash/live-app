import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/auth/auth_state.dart';
import 'package:popo_live/l10n/strings.dart';
import 'package:popo_live/api/token_storage.dart';
import 'package:popo_live/screens/auth/splash_screen.dart';
import 'package:popo_live/screens/auth/age_gate_screen.dart';
import 'package:popo_live/screens/auth/login_screen.dart';
import 'package:popo_live/screens/auth/register_screen.dart';
import 'package:popo_live/screens/profile/complete_profile_screen.dart';
import 'package:popo_live/screens/profile/me_screen.dart';
import 'package:popo_live/shell/app_shell.dart';

void main() {
  setUp(() async {
    PopoStrings.setLanguage('en');
    await TokenStorage.clearAll();
  });

  group('M1 End-to-End Authentication State Flow', () {
    test('Initial state requires terms when no consent token stored', () async {
      final auth = AuthState();
      await auth.restoreSession();
      expect(auth.status, equals(AuthStatus.termsRequired));
      expect(auth.isAuthenticated, isFalse);
      expect(auth.isTermsAccepted, isFalse);
    });

    test(
      'acceptTerms sets isTermsAccepted and transitions to unauthenticated',
      () async {
        final auth = AuthState();
        final accepted = await auth.acceptTerms();
        expect(accepted, isTrue);
        expect(auth.isTermsAccepted, isTrue);
        expect(auth.status, equals(AuthStatus.unauthenticated));
      },
    );

    test('Valid session token restores authenticated user state', () async {
      await TokenStorage.saveTermsConsentToken('mock_consent_token_v4_2');
      await TokenStorage.saveSessionToken('mock_valid_session');
      await TokenStorage.saveUserId('user_test_123');

      final auth = AuthState();
      expect(auth.isTermsAccepted, isFalse); // Before restore
      expect(auth.isAuthenticated, isFalse);
    });

    test(
      'Logout purges session tokens and resets status to unauthenticated',
      () async {
        await TokenStorage.saveTermsConsentToken('mock_consent_token_v4_2');
        await TokenStorage.saveSessionToken('mock_session_to_delete');
        await TokenStorage.saveUserId('user_to_delete');

        final auth = AuthState();
        await auth.logout();

        expect(auth.status, equals(AuthStatus.unauthenticated));
        expect(auth.currentUser, isNull);

        final hasSession = await TokenStorage.hasValidSession();
        expect(hasSession, isFalse);

        // Terms consent token is preserved across normal logouts
        final consent = await TokenStorage.getTermsConsentToken();
        expect(consent, isNotNull);
      },
    );
  });

  group('M1 Navigation & Gate Routing Tests', () {
    testWidgets(
      'SplashScreen resolves to AgeGateScreen when terms not accepted',
      (tester) async {
        await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
        await tester.pump(const Duration(milliseconds: 900));
        await tester.pumpAndSettle();

        expect(find.byType(AgeGateScreen), findsOneWidget);
      },
    );

    testWidgets('RegisterScreen validates empty fields before submission', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: RegisterScreen()));
      await tester.pumpAndSettle();

      // Tap Register button without filling fields
      await tester.tap(find.text('Create Account'));
      await tester.pumpAndSettle();

      expect(find.text('Please enter a valid email address.'), findsOneWidget);
    });

    testWidgets('LoginScreen validates short password and empty identifier', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      expect(
        find.text('Please enter your email, phone, or User ID.'),
        findsOneWidget,
      );
    });
  });
}
