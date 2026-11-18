import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure on-device credential and token storage using flutter_secure_storage
class TokenStorage {
  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const String _keySessionToken = 'poppo_session_token';
  static const String _keyTermsConsent = 'poppo_terms_consent_token';
  static const String _keyUserId = 'poppo_user_id';
  static const String _keyUserNickname = 'poppo_user_nickname';

  /// In-memory testing mode for widget tests and headless environments
  static bool useInMemoryOnly = false;
  static final Map<String, String> _inMemoryMap = {};

  /// In-memory cache for fast synchronous header construction
  static String? _cachedSessionToken;
  static String? _cachedTermsToken;

  /// Retrieves the active session token
  static Future<String?> getSessionToken() async {
    if (_cachedSessionToken != null) return _cachedSessionToken;
    if (useInMemoryOnly) return _inMemoryMap[_keySessionToken];
    try {
      _cachedSessionToken = await _storage.read(key: _keySessionToken);
      return _cachedSessionToken;
    } catch (e) {
      debugPrint('[TokenStorage] Error reading session token: $e');
      return null;
    }
  }

  /// Stores session token securely
  static Future<void> saveSessionToken(String token) async {
    _cachedSessionToken = token;
    if (useInMemoryOnly) {
      _inMemoryMap[_keySessionToken] = token;
      return;
    }
    try {
      await _storage.write(key: _keySessionToken, value: token);
    } catch (e) {
      debugPrint('[TokenStorage] Error persisting session token: $e');
    }
  }

  /// Retrieves 18+ terms consent verification token
  static Future<String?> getTermsConsentToken() async {
    if (_cachedTermsToken != null) return _cachedTermsToken;
    if (useInMemoryOnly) return _inMemoryMap[_keyTermsConsent];
    try {
      _cachedTermsToken = await _storage.read(key: _keyTermsConsent);
      return _cachedTermsToken;
    } catch (e) {
      debugPrint('[TokenStorage] Error reading terms token: $e');
      return null;
    }
  }

  /// Stores 18+ terms consent verification token
  static Future<void> saveTermsConsentToken(String token) async {
    _cachedTermsToken = token;
    if (useInMemoryOnly) {
      _inMemoryMap[_keyTermsConsent] = token;
      return;
    }
    try {
      await _storage.write(key: _keyTermsConsent, value: token);
    } catch (e) {
      debugPrint('[TokenStorage] Error persisting terms token: $e');
    }
  }

  /// Saves current user id
  static Future<void> saveUserId(String userId) async {
    if (useInMemoryOnly) {
      _inMemoryMap[_keyUserId] = userId;
      return;
    }
    try {
      await _storage.write(key: _keyUserId, value: userId);
    } catch (e) {
      debugPrint('[TokenStorage] Error persisting user id: $e');
    }
  }

  /// Retrieves current user id
  static Future<String?> getUserId() async {
    if (useInMemoryOnly) return _inMemoryMap[_keyUserId];
    try {
      return await _storage.read(key: _keyUserId);
    } catch (e) {
      return null;
    }
  }

  /// Checks if a valid session token is stored
  static Future<bool> hasValidSession() async {
    final token = await getSessionToken();
    return token != null && token.trim().isNotEmpty;
  }

  /// Clears all credentials during user logout
  static Future<void> clearAll() async {
    _cachedSessionToken = null;
    _cachedTermsToken = null;
    _inMemoryMap.clear();
    if (useInMemoryOnly) return;
    try {
      await _storage.delete(key: _keySessionToken);
      await _storage.delete(key: _keyTermsConsent);
      await _storage.delete(key: _keyUserId);
      await _storage.delete(key: _keyUserNickname);
    } catch (e) {
      debugPrint('[TokenStorage] Error clearing storage: $e');
    }
  }
}
