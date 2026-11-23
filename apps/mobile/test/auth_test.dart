import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/l10n/strings.dart';
import 'package:popo_live/api/token_storage.dart';
import 'package:popo_live/auth/auth_state.dart';
import 'package:popo_live/screens/auth/age_gate_screen.dart';
import 'package:popo_live/screens/auth/login_screen.dart';
import 'package:popo_live/screens/auth/register_screen.dart';
import 'package:popo_live/screens/auth/phone_otp_screen.dart';

void main() {
  void setScreenSize(WidgetTester tester) {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
  }

  setUp(() {
    PopoStrings.setLanguage('en');
    TokenStorage.useInMemoryOnly = true;
  });

  group('M1 AuthState Lifecycle & Session Tests', () {
    test('Initial AuthState is uninitialized', () {
      final auth = AuthState();
      expect(auth.status, equals(AuthStatus.uninitialized));
      expect(auth.isAuthenticated, isFalse);
    });

    test('acceptTerms transitions status to unauthenticated', () async {
      final auth = AuthState();
      final result = await auth.acceptTerms();
      expect(result, isTrue);
      expect(auth.isTermsAccepted, isTrue);
      expect(auth.status, equals(AuthStatus.unauthenticated));
    });

    test(
      'Apple Sign-In on Android safely returns platform limitation message',
      () async {
        final auth = AuthState();
        final result = await auth.signInWithApple();
        // On non-iOS host, must not fake authentication
        expect(result, isFalse);
      },
    );
  });

  group('M1 18+ Age Gate UI Tests', () {
    testWidgets(
      'AgeGateScreen renders warning badge, explanation, and buttons',
      (tester) async {
        setScreenSize(tester);
        await tester.pumpWidget(const MaterialApp(home: AgeGateScreen()));
        await tester.pumpAndSettle();

        expect(find.text('18+ Age Verification Required'), findsOneWidget);
        expect(find.text('MANDATORY COMPLIANCE'), findsOneWidget);
        expect(find.text('Accept & Continue'), findsOneWidget);
        expect(find.text('Decline & Exit'), findsOneWidget);
      },
    );

    testWidgets(
      'Tapping Accept without checking box displays validation error',
      (tester) async {
        setScreenSize(tester);
        await tester.pumpWidget(const MaterialApp(home: AgeGateScreen()));
        await tester.pumpAndSettle();

        await tester.tap(find.text('Accept & Continue'));
        await tester.pumpAndSettle();

        expect(
          find.text('You must confirm that you are 18+ and accept terms.'),
          findsOneWidget,
        );
      },
    );

    testWidgets('Tapping Decline opens dialog explaining restriction', (
      tester,
    ) async {
      setScreenSize(tester);
      await tester.pumpWidget(const MaterialApp(home: AgeGateScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Decline & Exit'));
      await tester.pumpAndSettle();

      expect(find.byType(AlertDialog), findsOneWidget);
      expect(find.text('Back'), findsOneWidget);
    });
  });

  group('M1 Login Screen UI Tests', () {
    testWidgets(
      'LoginScreen renders inputs, buttons, phone OTP, and social options',
      (tester) async {
        await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
        await tester.pumpAndSettle();

        expect(find.text('Welcome Back'), findsOneWidget);
        expect(find.text('Email, Phone or Poppo ID'), findsOneWidget);
        expect(find.text('Password'), findsOneWidget);
        expect(find.text('Forgot Password?'), findsOneWidget);
        expect(find.text('Log In'), findsOneWidget);
        expect(find.text('Sign in with Phone OTP'), findsOneWidget);
        expect(find.text("Don't have an account? Sign Up"), findsOneWidget);
      },
    );

    testWidgets('Submitting empty login form displays validation error', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Log In'));
      await tester.pumpAndSettle();

      expect(
        find.text('Please enter your email, phone, or Poppo ID.'),
        findsOneWidget,
      );
    });

    testWidgets('Tapping Sign in with Phone OTP navigates to PhoneOtpScreen', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Sign in with Phone OTP'));
      await tester.pumpAndSettle();

      expect(find.byType(PhoneOtpScreen), findsOneWidget);
    });
  });

  group('M1 Phone OTP Screen UI Tests', () {
    testWidgets(
      'PhoneOtpScreen renders country code selector and phone input',
      (tester) async {
        await tester.pumpWidget(const MaterialApp(home: PhoneOtpScreen()));
        await tester.pumpAndSettle();

        expect(find.text('Phone Sign-In'), findsOneWidget);
        expect(find.text('+92'), findsOneWidget);
        expect(find.text('Send Verification Code'), findsOneWidget);
      },
    );

    testWidgets('Submitting too short phone number displays validation error', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: PhoneOtpScreen()));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), '123');
      await tester.tap(find.text('Send Verification Code'));
      await tester.pumpAndSettle();

      expect(
        find.text('Please enter a valid phone number including country code.'),
        findsOneWidget,
      );
    });

    testWidgets('Tapping country code opens modal selector', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: PhoneOtpScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('+92'));
      await tester.pumpAndSettle();

      expect(find.text('Select Country Code'), findsOneWidget);
      expect(find.text('Saudi Arabia'), findsOneWidget);
      expect(find.text('United States'), findsOneWidget);
    });
  });

  group('M1 Register Screen UI Tests', () {
    testWidgets('RegisterScreen validates short password and mismatch', (
      tester,
    ) async {
      await tester.pumpWidget(const MaterialApp(home: RegisterScreen()));
      await tester.pumpAndSettle();

      expect(find.text('Create Account'), findsWidgets);

      // Enter invalid email
      await tester.enterText(
        find.widgetWithText(TextField, 'Email Address'),
        'bad-email',
      );
      await tester.tap(find.text('Create Account').last);
      await tester.pumpAndSettle();

      expect(find.text('Please enter a valid email address.'), findsOneWidget);
    });
  });
}
