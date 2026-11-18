import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/l10n/strings.dart';
import 'package:popo_live/theme/popo_theme.dart';
import 'package:popo_live/api/token_storage.dart';
import 'package:popo_live/auth/auth_state.dart';
import 'package:popo_live/design/design_fixtures.dart';
import 'package:popo_live/screens/auth/splash_screen.dart';
import 'package:popo_live/screens/auth/age_gate_screen.dart';
import 'package:popo_live/screens/auth/login_screen.dart';
import 'package:popo_live/screens/auth/register_screen.dart';
import 'package:popo_live/screens/auth/phone_otp_screen.dart';
import 'package:popo_live/screens/profile/complete_profile_screen.dart';
import 'package:popo_live/shell/app_shell.dart';
import 'package:popo_live/widgets/popo_bottom_navigation.dart';

void main() {
  setUp(() {
    TokenStorage.useInMemoryOnly = true;
    TokenStorage.clearAll();
    AuthState.instance.resetForTesting();
    DesignFixtures.reset();
  });

  void setMobileScreenSize(WidgetTester tester) {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
  }

  group('Phase 2 (D1) Prompt 2 - Mobile Authentication Flow Tests', () {
    testWidgets('1. Splash screen displays branding and routes to 18+ Age Gate',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        MaterialApp(
          theme: PopoTheme.darkTheme,
          home: const SplashScreen(),
        ),
      );

      // Verify Popo Live logo and splash branding
      expect(find.text('PL'), findsOneWidget);
      expect(find.text(PopoStrings.appName), findsOneWidget);

      // Advance through splash delay (800ms) and route transition
      await tester.pump(const Duration(milliseconds: 850));
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 100));

      // Should transition to AgeGateScreen when unauthenticated and terms unaccepted
      expect(find.byType(AgeGateScreen), findsOneWidget);
      expect(find.text(PopoStrings.get('age_gate_title')), findsOneWidget);
    });

    testWidgets('2. 18+ Age Gate enforces age confirmation before continuing',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        MaterialApp(
          theme: PopoTheme.darkTheme,
          home: const AgeGateScreen(),
        ),
      );

      // Verify Age Gate elements
      expect(find.text(PopoStrings.get('age_gate_title')), findsOneWidget);
      expect(find.text(PopoStrings.get('accept_and_continue')), findsOneWidget);
      expect(find.text(PopoStrings.get('age_gate_decline')), findsOneWidget);

      // Attempt to continue WITHOUT checking the 18+ confirmation checkbox
      await tester.tap(find.text(PopoStrings.get('accept_and_continue')));
      await tester.pump();

      // Error message must be visible (Validation State)
      expect(find.text(PopoStrings.get('err_terms_required')), findsOneWidget);
      expect(find.byType(LoginScreen), findsNothing);

      // Now check the 18+ checkbox
      final checkboxFinder = find.byType(Checkbox);
      expect(checkboxFinder, findsOneWidget);
      await tester.tap(checkboxFinder);
      await tester.pump();

      // Tap Accept & Continue again
      await tester.tap(find.text(PopoStrings.get('accept_and_continue')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 100));

      // Must navigate to LoginScreen
      expect(find.byType(LoginScreen), findsOneWidget);
      expect(find.text(PopoStrings.get('login_title')), findsOneWidget);
    });

    testWidgets('3. Login screen supports validation, fixture login, and landing on Explore',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        MaterialApp(
          theme: PopoTheme.darkTheme,
          home: const LoginScreen(),
        ),
      );

      // Verify Login elements
      expect(find.text(PopoStrings.get('login_title')), findsOneWidget);
      expect(find.text(PopoStrings.get('login_btn')), findsOneWidget);
      expect(find.text(PopoStrings.get('login_fixture_user')), findsOneWidget);
      expect(find.text(PopoStrings.get('sign_in_with_phone')), findsOneWidget);

      // Validation test: Empty inputs
      await tester.tap(find.text(PopoStrings.get('login_btn')));
      await tester.pump();
      expect(find.text(PopoStrings.get('err_empty_identifier')), findsOneWidget);

      // Tap Quick Login with Fixture User (Amina Noor)
      await tester.tap(find.text(PopoStrings.get('login_fixture_user')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 100));

      // Verify session authenticated with Amina Noor fixture profile
      expect(AuthState.instance.isAuthenticated, true);
      expect(AuthState.instance.currentUser?['nickname'], 'Amina Noor');
      expect(AuthState.instance.currentUser?['id'], 'u_amina_noor');

      // Verify lands on AppShell with Explore tab (index 1) active
      expect(find.byType(AppShell), findsOneWidget);
      final indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
      expect(indexedStack.index, 1); // Explore tab active

      // Verify 5-tab bottom navigation is active and all 5 destinations accessible
      expect(find.byType(PopoBottomNavigation), findsOneWidget);
      expect(find.text(PopoStrings.tabLive), findsOneWidget);
      expect(find.text(PopoStrings.tabExplore), findsOneWidget);
      expect(find.text(PopoStrings.tabSquare), findsOneWidget);
      expect(find.text(PopoStrings.tabMessage), findsOneWidget);
      expect(find.text(PopoStrings.tabMe), findsOneWidget);

      // Switch to Me tab (index 4)
      await tester.tap(find.text(PopoStrings.tabMe));
      await tester.pump();
      final updatedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
      expect(updatedStack.index, 4);
    });

    testWidgets('4. Registration flow validates fields and navigates to Phone OTP',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        MaterialApp(
          theme: PopoTheme.darkTheme,
          home: const RegisterScreen(),
        ),
      );

      // Verify Register screen elements
      expect(find.text(PopoStrings.get('register_title')), findsOneWidget);
      expect(find.text(PopoStrings.get('register_btn')), findsOneWidget);

      // Validation test: Empty email/phone submission
      await tester.tap(find.text(PopoStrings.get('register_btn')));
      await tester.pump();
      expect(find.text(PopoStrings.get('err_invalid_email')), findsOneWidget);

      // Fill valid registration fields
      final textFields = find.byType(TextField);
      expect(textFields, findsNWidgets(4)); // Nickname, Email, Password, Confirm Password

      await tester.enterText(textFields.at(0), 'Amina Noor');
      await tester.enterText(textFields.at(1), 'amina.noor@popolive.com');
      await tester.enterText(textFields.at(2), 'PopoLive123!');
      await tester.enterText(textFields.at(3), 'PopoLive123!');
      await tester.pump();

      // Submit Registration
      await tester.tap(find.text(PopoStrings.get('register_btn')));
      await tester.pump(const Duration(milliseconds: 300));
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 100));

      // Should transition to PhoneOtpScreen
      expect(find.byType(PhoneOtpScreen), findsOneWidget);
      expect(find.text(PopoStrings.get('phone_otp_title')), findsOneWidget);
    });

    testWidgets('5. Phone OTP sends fixture code, validates wrong code, and accepts 123456',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        MaterialApp(
          theme: PopoTheme.darkTheme,
          home: const PhoneOtpScreen(
            initialPhone: '3001234567',
            nickname: 'Amina Noor',
          ),
        ),
      );

      // Tap Send Code
      expect(find.text(PopoStrings.get('send_code')), findsOneWidget);
      await tester.tap(find.text(PopoStrings.get('send_code')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Code sent: Verify OTP input and fixture hint are shown
      expect(find.text(PopoStrings.get('fixture_otp_hint')), findsOneWidget);
      expect(find.text(PopoStrings.get('verify_and_continue')), findsOneWidget);

      // Validation test: Enter wrong OTP
      final otpField = find.byType(TextField);
      await tester.enterText(otpField, '999999');
      await tester.tap(find.text(PopoStrings.get('verify_and_continue')));
      await tester.pump();

      // Error banner must be shown
      expect(find.text(PopoStrings.get('err_invalid_otp')), findsOneWidget);
      expect(find.byType(CompleteProfileScreen), findsNothing);

      // Now enter valid fixture OTP: 123456
      await tester.enterText(otpField, '123456');
      await tester.tap(find.text(PopoStrings.get('verify_and_continue')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 100));

      // Should transition to CompleteProfileScreen
      expect(find.byType(CompleteProfileScreen), findsOneWidget);
      expect(find.text(PopoStrings.get('complete_profile_title')), findsOneWidget);
    });

    testWidgets('6. Complete Profile validates data, completes profile, and lands on Explore',
        (WidgetTester tester) async {
      setMobileScreenSize(tester);

      await tester.pumpWidget(
        MaterialApp(
          theme: PopoTheme.darkTheme,
          home: const CompleteProfileScreen(
            initialNickname: 'Amina Noor',
            initialPhone: '+923001234567',
          ),
        ),
      );

      // Verify Complete Profile screen elements
      expect(find.text(PopoStrings.get('complete_profile_title')), findsOneWidget);

      // First TextField is Nickname
      final nicknameField = find.byType(TextField).first;
      await tester.enterText(nicknameField, 'A'); // Short nickname (< 3 chars)
      await tester.pump();

      await tester.tap(find.text(PopoStrings.get('save_and_continue')));
      await tester.pump();

      expect(find.text(PopoStrings.get('err_nickname_short')), findsOneWidget);
      expect(find.byType(AppShell), findsNothing);

      // Re-enter valid fixture nickname
      await tester.enterText(nicknameField, 'Amina Noor');
      await tester.pump();

      // Tap Save and Continue
      await tester.tap(find.text(PopoStrings.get('save_and_continue')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));
      await tester.pump(const Duration(milliseconds: 350));
      await tester.pump(const Duration(milliseconds: 100));

      // Verified: lands on AppShell with Explore active
      expect(find.byType(AppShell), findsOneWidget);
      final indexedStack = tester.widget<IndexedStack>(find.byType(IndexedStack));
      expect(indexedStack.index, 1); // Explore tab active

      // All 5 bottom navigation destinations available
      expect(find.byType(PopoBottomNavigation), findsOneWidget);
      expect(find.text(PopoStrings.tabLive), findsOneWidget);
      expect(find.text(PopoStrings.tabExplore), findsOneWidget);
      expect(find.text(PopoStrings.tabSquare), findsOneWidget);
      expect(find.text(PopoStrings.tabMessage), findsOneWidget);
      expect(find.text(PopoStrings.tabMe), findsOneWidget);
    });
  });
}
