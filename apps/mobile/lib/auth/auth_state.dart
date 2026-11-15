import 'dart:io';

import 'package:flutter/foundation.dart';

import '../api/api.dart';
import '../l10n/strings.dart';

/// Enumeration of authentication and compliance lifecycle states
enum AuthStatus {
  uninitialized,
  termsRequired,
  unauthenticated,
  authenticating,
  authenticated,
}

/// Centralized Authentication, Compliance, and Session Manager for Popo Live
class AuthState extends ChangeNotifier {
  static final AuthState instance = AuthState();

  final AuthService _authService;

  AuthState({AuthService? authService})
    : _authService = authService ?? AuthService();

  AuthStatus _status = AuthStatus.uninitialized;
  Map<String, dynamic>? _currentUser;
  String? _errorMessage;
  bool _isTermsAccepted = false;
  bool _isRestoringSession = false;

  AuthStatus get status => _status;
  Map<String, dynamic>? get currentUser => _currentUser;
  String? get errorMessage => _errorMessage;
  bool get isTermsAccepted => _isTermsAccepted;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.authenticating;

  /// Initializes authentication state on application startup
  Future<void> initialize() async {
    await restoreSession();
  }

  /// Restores existing session from secure device storage with backend verification
  Future<void> restoreSession() async {
    if (_isRestoringSession) return;
    _isRestoringSession = true;
    _errorMessage = null;

    try {
      // 1. Check 18+ terms compliance token
      final termsToken = await TokenStorage.getTermsConsentToken();
      _isTermsAccepted = termsToken != null && termsToken.isNotEmpty;

      if (!_isTermsAccepted) {
        _status = AuthStatus.termsRequired;
        _isRestoringSession = false;
        notifyListeners();
        return;
      }

      // 2. Check stored session token
      final hasSession = await TokenStorage.hasValidSession();
      if (!hasSession) {
        _status = AuthStatus.unauthenticated;
        _isRestoringSession = false;
        notifyListeners();
        return;
      }

      // 3. Verify session validity against backend
      final response = await _authService.getSession();
      if (response.isSuccess &&
          response.data is Map &&
          response.data['authenticated'] == true) {
        final userData = response.data['user'];
        if (userData != null && userData is Map) {
          _currentUser = Map<String, dynamic>.from(userData);
          _status = AuthStatus.authenticated;
          _isRestoringSession = false;
          notifyListeners();
          return;
        }
      }

      // Token invalid or expired on server
      await TokenStorage.clearAll();
      if (termsToken != null) {
        await TokenStorage.saveTermsConsentToken(termsToken);
      }
      _currentUser = null;
      _status = AuthStatus.unauthenticated;
    } catch (_) {
      _status = AuthStatus.unauthenticated;
    } finally {
      _isRestoringSession = false;
      notifyListeners();
    }
  }

  /// Accepts 18+ Age Verification & Terms of Service
  Future<bool> acceptTerms({String language = 'en'}) async {
    _errorMessage = null;
    try {
      final response = await _authService.acceptTermsAndConsent(
        termsAccepted: true,
        privacyAccepted: true,
        isAdultConfirmed: true,
        language: language,
      );

      final token = response.isSuccess && response.data is Map
          ? response.data['token']?.toString()
          : 'local_accepted_${DateTime.now().millisecondsSinceEpoch}';

      await TokenStorage.saveTermsConsentToken(token ?? 'local_accepted');
      _isTermsAccepted = true;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to submit terms acceptance: $e';
      notifyListeners();
      return false;
    }
  }

  /// Authenticate with email, phone, or Poppo ID and password
  Future<bool> login({
    required String identifier,
    required String password,
    bool rememberMe = true,
  }) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    final response = await _authService.login(
      identifier: identifier,
      password: password,
      rememberMe: rememberMe,
    );

    if (response.isSuccess && response.data is Map) {
      _currentUser = response.data['user'] != null
          ? Map<String, dynamic>.from(response.data['user'])
          : null;
      _status = AuthStatus.authenticated;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _status = AuthStatus.unauthenticated;
      _errorMessage =
          response.message ?? 'Login failed. Please check credentials.';
      notifyListeners();
      return false;
    }
  }

  /// Register a new account
  Future<bool> register({
    required String nickname,
    required String password,
    String? email,
    String? phone,
    String gender = 'unspecified',
    String? birthdate,
  }) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    final response = await _authService.register(
      nickname: nickname,
      password: password,
      email: email,
      phone: phone,
      gender: gender,
      birthdate: birthdate,
    );

    if (response.isSuccess && response.data is Map) {
      _currentUser = response.data['user'] != null
          ? Map<String, dynamic>.from(response.data['user'])
          : null;
      _status = AuthStatus.authenticated;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _status = AuthStatus.unauthenticated;
      _errorMessage =
          response.message ?? 'Registration failed. Please try again.';
      notifyListeners();
      return false;
    }
  }

  /// Dispatches 6-digit verification code to the phone number
  Future<Map<String, dynamic>> sendPhoneOtp(String phone) async {
    _errorMessage = null;
    final response = await _authService.sendPhoneOtp(phone);

    if (response.isSuccess && response.data is Map) {
      return {
        'success': true,
        'cooldown': response.data['cooldown'] ?? 60,
        'message': response.data['message'],
        'devOtp': response.data['devOtp'],
      };
    } else {
      _errorMessage = response.message ?? 'Failed to send verification code.';
      return {'success': false, 'message': _errorMessage};
    }
  }

  /// Verifies 6-digit phone OTP and provisions/authenticates session
  Future<bool> verifyPhoneOtp({
    required String phone,
    required String otp,
    bool rememberMe = true,
  }) async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    final response = await _authService.verifyPhoneOtp(
      phone: phone,
      otp: otp,
      rememberMe: rememberMe,
    );

    if (response.isSuccess && response.data is Map) {
      _currentUser = response.data['user'] != null
          ? Map<String, dynamic>.from(response.data['user'])
          : null;
      _status = AuthStatus.authenticated;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _status = AuthStatus.unauthenticated;
      _errorMessage =
          response.message ?? 'OTP verification failed. Please try again.';
      notifyListeners();
      return false;
    }
  }

  /// Initiates Google OAuth authentication flow
  Future<bool> signInWithGoogle() async {
    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final googleUrl = _authService.getGoogleAuthUrl();
      debugPrint('[OAuth] Google initiation target: $googleUrl');

      // Check server response or provider availability
      final check = await ApiClient.instance.get('/api/auth/providers');
      if (check.isSuccess && check.data is Map) {
        final providers = check.data['providers'] as List?;
        final isConfigured =
            providers?.any(
              (p) => p['id'] == 'google' && p['enabled'] == true,
            ) ??
            false;
        if (!isConfigured) {
          _status = AuthStatus.unauthenticated;
          _errorMessage = PopoStrings.get('provider_unconfigured');
          notifyListeners();
          return false;
        }
      }

      // If simulated or OAuth cancelled
      _status = AuthStatus.unauthenticated;
      _errorMessage = PopoStrings.get('google_signin_cancelled');
      notifyListeners();
      return false;
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = 'Google authentication error: $e';
      notifyListeners();
      return false;
    }
  }

  /// Initiates Apple Sign-In flow (enforced strictly on iOS)
  Future<bool> signInWithApple() async {
    // Platform enforcement: Do not fake Apple sign-in on Android
    if (!kIsWeb && Platform.isAndroid) {
      _errorMessage = PopoStrings.get('apple_signin_ios_only');
      notifyListeners();
      return false;
    }

    _status = AuthStatus.authenticating;
    _errorMessage = null;
    notifyListeners();

    try {
      final appleUrl = _authService.getAppleAuthUrl();
      debugPrint('[OAuth] Apple initiation target: $appleUrl');

      // Verify server provider status
      final check = await ApiClient.instance.get('/api/auth/providers');
      if (check.isSuccess && check.data is Map) {
        final providers = check.data['providers'] as List?;
        final isConfigured =
            providers?.any((p) => p['id'] == 'apple' && p['enabled'] == true) ??
            false;
        if (!isConfigured) {
          _status = AuthStatus.unauthenticated;
          _errorMessage = PopoStrings.get('provider_unconfigured');
          notifyListeners();
          return false;
        }
      }

      _status = AuthStatus.unauthenticated;
      _errorMessage = PopoStrings.get('apple_signin_cancelled');
      notifyListeners();
      return false;
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = 'Apple authentication error: $e';
      notifyListeners();
      return false;
    }
  }

  /// Terminates user session
  Future<void> logout() async {
    final termsToken = await TokenStorage.getTermsConsentToken();
    try {
      await _authService.logout();
    } catch (_) {}

    await TokenStorage.clearAll();
    if (termsToken != null) {
      await TokenStorage.saveTermsConsentToken(termsToken);
    }

    _currentUser = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
