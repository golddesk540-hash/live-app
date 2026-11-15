import 'package:flutter/foundation.dart';

import '../api/api.dart';

/// Enumeration of authentication and compliance lifecycle states
enum AuthStatus {
  uninitialized,
  termsRequired,
  unauthenticated,
  authenticating,
  authenticated,
}

/// Centralized Authentication and Compliance State Manager for Popo Live
class AuthState extends ChangeNotifier {
  static final AuthState instance = AuthState();

  final AuthService _authService;

  AuthState({AuthService? authService})
    : _authService = authService ?? AuthService();

  AuthStatus _status = AuthStatus.uninitialized;
  Map<String, dynamic>? _currentUser;
  String? _errorMessage;
  bool _isTermsAccepted = false;

  AuthStatus get status => _status;
  Map<String, dynamic>? get currentUser => _currentUser;
  String? get errorMessage => _errorMessage;
  bool get isTermsAccepted => _isTermsAccepted;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isLoading => _status == AuthStatus.authenticating;

  /// Initializes authentication state on application startup
  Future<void> initialize() async {
    _errorMessage = null;

    // 1. Check if 18+ terms consent has been accepted locally
    final termsToken = await TokenStorage.getTermsConsentToken();
    _isTermsAccepted = termsToken != null && termsToken.isNotEmpty;

    if (!_isTermsAccepted) {
      _status = AuthStatus.termsRequired;
      notifyListeners();
      return;
    }

    // 2. Check if a local session token exists
    final hasSession = await TokenStorage.hasValidSession();
    if (!hasSession) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    // 3. Validate existing session with backend
    try {
      final response = await _authService.getSession();
      if (response.isSuccess &&
          response.data is Map &&
          response.data['user'] != null) {
        _currentUser = Map<String, dynamic>.from(response.data['user']);
        _status = AuthStatus.authenticated;
      } else {
        // Expired or invalid session
        await TokenStorage.clearAll();
        // Restore terms token so user isn't asked 18+ gate again
        await TokenStorage.saveTermsConsentToken(termsToken!);
        _status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      // In case of network failure during startup, allow offline or unauthenticated fallback
      _status = AuthStatus.unauthenticated;
    }

    notifyListeners();
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

      // Even if network is temporarily unreachable, create a local persistent compliance record
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
