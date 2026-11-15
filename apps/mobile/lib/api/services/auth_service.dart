import '../api_client.dart';
import '../api_config.dart';
import '../api_response.dart';
import '../token_storage.dart';

/// Service managing user authentication, sessions, phone OTP, and 18+ terms gate consent
class AuthService {
  final ApiClient _client;

  AuthService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Authenticate user via email, phone, or Poppo numeric ID
  Future<ApiResponse<dynamic>> login({
    required String identifier,
    required String password,
    bool rememberMe = false,
  }) async {
    final response = await _client.post(
      '/api/auth/login',
      body: {
        'identifier': identifier,
        'password': password,
        'rememberMe': rememberMe,
      },
    );

    if (response.isSuccess && response.data is Map) {
      final user = response.data['user'];
      if (user != null && user['id'] != null) {
        await TokenStorage.saveUserId(user['id'].toString());
      }
    }

    return response;
  }

  /// Register a new account
  Future<ApiResponse<dynamic>> register({
    required String nickname,
    required String password,
    String? email,
    String? phone,
    String gender = 'unspecified',
    String? birthdate,
  }) async {
    final response = await _client.post(
      '/api/auth/register',
      body: {
        'nickname': nickname,
        'password': password,
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'gender': gender,
        if (birthdate != null) 'birthdate': birthdate,
        'isAdultConfirmed': true,
      },
    );

    if (response.isSuccess && response.data is Map) {
      final user = response.data['user'];
      if (user != null && user['id'] != null) {
        await TokenStorage.saveUserId(user['id'].toString());
      }
    }

    return response;
  }

  /// Requests a 6-digit verification code dispatched to the given phone number
  Future<ApiResponse<dynamic>> sendPhoneOtp(String phone) async {
    return _client.post('/api/auth/phone/send-otp', body: {'phone': phone});
  }

  /// Verifies 6-digit phone OTP code and authenticates/provisions user
  Future<ApiResponse<dynamic>> verifyPhoneOtp({
    required String phone,
    required String otp,
    bool rememberMe = true,
  }) async {
    final response = await _client.post(
      '/api/auth/phone/verify-otp',
      body: {'phone': phone, 'otp': otp, 'rememberMe': rememberMe},
    );

    if (response.isSuccess && response.data is Map) {
      final user = response.data['user'];
      if (user != null && user['id'] != null) {
        await TokenStorage.saveUserId(user['id'].toString());
      }
    }

    return response;
  }

  /// Resolves the Google OAuth initiation URL
  String getGoogleAuthUrl() {
    return '${ApiConfig.baseUrl}/api/auth/google';
  }

  /// Resolves the Apple OAuth initiation URL
  String getAppleAuthUrl() {
    return '${ApiConfig.baseUrl}/api/auth/apple';
  }

  /// Terminate active session and purge secure local credentials
  Future<ApiResponse<dynamic>> logout() async {
    final response = await _client.post('/api/auth/logout');
    await TokenStorage.clearAll();
    return response;
  }

  /// Validates session with backend
  Future<ApiResponse<dynamic>> getSession() async {
    return _client.get('/api/auth/session');
  }

  /// Checks 18+ terms consent status
  Future<ApiResponse<dynamic>> getConsentStatus() async {
    return _client.get('/api/consent');
  }

  /// Submits 18+ Age Verification & Terms of Service acceptance
  Future<ApiResponse<dynamic>> acceptTermsAndConsent({
    required bool termsAccepted,
    required bool privacyAccepted,
    required bool isAdultConfirmed,
    String language = 'en',
    String? anonymousSessionId,
  }) async {
    return _client.post(
      '/api/consent',
      body: {
        'action': 'accept',
        'termsAccepted': termsAccepted,
        'privacyAccepted': privacyAccepted,
        'isAdultConfirmed': isAdultConfirmed,
        'language': language,
        if (anonymousSessionId != null)
          'anonymousSessionId': anonymousSessionId,
      },
    );
  }
}
