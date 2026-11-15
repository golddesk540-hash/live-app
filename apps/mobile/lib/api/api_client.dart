import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Centralized API Client connecting Flutter Mobile App to Next.js Backend.
/// Implements secure session storage, error handling, and unified base URL resolution.
class ApiClient {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static const String _tokenKey = 'poppo_session_token';
  static const String _userKey = 'poppo_user_profile';

  /// Resolves appropriate base URL:
  /// - Android Emulator: http://10.0.2.2:3000
  /// - iOS Simulator / Local Desktop: http://localhost:3000
  /// - Production Fallback: https://kigolive.com
  static String get baseUrl {
    const String overrideUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: '',
    );
    if (overrideUrl.isNotEmpty) return overrideUrl;

    if (kIsWeb) return '';
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:3000';
      }
    } catch (_) {}
    return 'http://localhost:3000';
  }

  /// Production VPS URL
  static const String productionUrl = 'https://kigolive.com';

  /// Reads secure session token
  static Future<String?> getToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (e) {
      debugPrint('Error reading session token: $e');
      return null;
    }
  }

  /// Saves secure session token
  static Future<void> saveToken(String token) async {
    try {
      await _storage.write(key: _tokenKey, value: token);
    } catch (e) {
      debugPrint('Error saving session token: $e');
    }
  }

  /// Clears stored credentials on logout
  static Future<void> clearSession() async {
    try {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
    } catch (e) {
      debugPrint('Error clearing session: $e');
    }
  }

  /// Builds standardized headers with cookie session and Bearer auth
  static Future<Map<String, String>> _buildHeaders({
    Map<String, String>? extraHeaders,
  }) async {
    final token = await getToken();
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token != null && token.isNotEmpty) {
      headers['Cookie'] = 'poppo_session=$token';
      headers['Authorization'] = 'Bearer $token';
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  /// Resolves full URI
  static Uri _buildUri(String path, [Map<String, dynamic>? queryParams]) {
    String cleanPath = path.startsWith('/') ? path : '/$path';
    String fullUrl = '$baseUrl$cleanPath';

    if (queryParams != null && queryParams.isNotEmpty) {
      final queryString = Uri(
        queryParameters: queryParams.map((k, v) => MapEntry(k, v.toString())),
      ).query;
      fullUrl = '$fullUrl?$queryString';
    }

    return Uri.parse(fullUrl);
  }

  /// Standardized GET request
  static Future<ApiResponse> get(
    String path, {
    Map<String, dynamic>? queryParams,
  }) async {
    try {
      final uri = _buildUri(path, queryParams);
      final headers = await _buildHeaders();
      final response = await http
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 15));
      return _processResponse(response);
    } on SocketException {
      return ApiResponse.error(
        'Unable to connect to server. Please check your network connection.',
      );
    } on http.ClientException catch (e) {
      return ApiResponse.error('Network client error: ${e.message}');
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  /// Standardized POST request
  static Future<ApiResponse> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    try {
      final uri = _buildUri(path);
      final headers = await _buildHeaders();
      final response = await http
          .post(
            uri,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(const Duration(seconds: 15));

      _extractAndSaveSessionCookie(response);
      return _processResponse(response);
    } on SocketException {
      return ApiResponse.error(
        'Unable to connect to server. Please check your network connection.',
      );
    } catch (e) {
      return ApiResponse.error('Unexpected error: $e');
    }
  }

  /// Extracts session cookie from response headers if present
  static void _extractAndSaveSessionCookie(http.Response response) {
    final rawCookie = response.headers['set-cookie'];
    if (rawCookie != null && rawCookie.contains('poppo_session=')) {
      final match = RegExp(r'poppo_session=([^;]+)').firstMatch(rawCookie);
      if (match != null && match.group(1) != null) {
        saveToken(match.group(1)!);
      }
    }
  }

  /// Processes HTTP response into structured ApiResponse
  static ApiResponse _processResponse(http.Response response) {
    final statusCode = response.statusCode;
    try {
      final dynamic decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (statusCode >= 200 && statusCode < 300) {
        return ApiResponse.success(data: decoded, statusCode: statusCode);
      } else {
        final errorMsg = decoded is Map
            ? (decoded['error'] ?? decoded['message'] ?? 'Request failed')
            : 'Request failed';
        final errorCode = decoded is Map ? decoded['code'] : null;
        return ApiResponse.failure(
          errorMsg.toString(),
          statusCode: statusCode,
          code: errorCode,
        );
      }
    } catch (_) {
      if (statusCode >= 200 && statusCode < 300) {
        return ApiResponse.success(data: response.body, statusCode: statusCode);
      }
      return ApiResponse.failure(
        'Server returned status code $statusCode',
        statusCode: statusCode,
      );
    }
  }
}

/// Structured API Response model
class ApiResponse {
  final bool isSuccess;
  final dynamic data;
  final String? errorMessage;
  final String? code;
  final int statusCode;

  ApiResponse._({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    this.code,
    required this.statusCode,
  });

  factory ApiResponse.success({dynamic data, int statusCode = 200}) {
    return ApiResponse._(isSuccess: true, data: data, statusCode: statusCode);
  }

  factory ApiResponse.failure(
    String errorMessage, {
    int statusCode = 400,
    String? code,
  }) {
    return ApiResponse._(
      isSuccess: false,
      errorMessage: errorMessage,
      statusCode: statusCode,
      code: code,
    );
  }

  factory ApiResponse.error(String networkError) {
    return ApiResponse._(
      isSuccess: false,
      errorMessage: networkError,
      statusCode: 0,
    );
  }
}
