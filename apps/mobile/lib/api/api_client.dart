import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'api_exceptions.dart';
import 'api_response.dart';
import 'token_storage.dart';

/// Production-ready centralized HTTP API Client for Popo Live
/// Handles headers, cookies, token injection, status codes, timeouts, and error mapping
class ApiClient {
  final http.Client _client;

  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  /// Default singleton instance
  static final ApiClient instance = ApiClient();

  /// Resolves full target URI
  Uri buildUri(String path, [Map<String, dynamic>? queryParameters]) {
    final baseUrl = ApiConfig.baseUrl;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    String fullUrl = '$baseUrl$normalizedPath';

    if (queryParameters != null && queryParameters.isNotEmpty) {
      final sanitizedParams = <String, String>{};
      queryParameters.forEach((key, value) {
        if (value != null) {
          sanitizedParams[key] = value.toString();
        }
      });
      if (sanitizedParams.isNotEmpty) {
        final queryString = Uri(queryParameters: sanitizedParams).query;
        fullUrl = '$fullUrl?$queryString';
      }
    }

    return Uri.parse(fullUrl);
  }

  /// Builds standardized headers with cookie session and Bearer auth
  Future<Map<String, String>> _buildHeaders([
    Map<String, String>? customHeaders,
  ]) async {
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': ApiConfig.userAgent,
      'X-Requested-With': 'XMLHttpRequest',
    };

    final sessionToken = await TokenStorage.getSessionToken();
    final termsToken = await TokenStorage.getTermsConsentToken();

    final cookieList = <String>[];
    if (sessionToken != null && sessionToken.isNotEmpty) {
      cookieList.add('poppo_session=$sessionToken');
      headers['Authorization'] = 'Bearer $sessionToken';
    }
    if (termsToken != null && termsToken.isNotEmpty) {
      cookieList.add('poppo_terms_consent=$termsToken');
    }

    if (cookieList.isNotEmpty) {
      headers['Cookie'] = cookieList.join('; ');
    }

    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }

    return headers;
  }

  /// Extracts session and consent cookies from response headers
  void _extractCookies(http.Response response) {
    final rawCookie = response.headers['set-cookie'];
    if (rawCookie == null || rawCookie.isEmpty) return;

    // Match poppo_session
    final sessionMatch = RegExp(r'poppo_session=([^;]+)').firstMatch(rawCookie);
    if (sessionMatch != null && sessionMatch.group(1) != null) {
      final token = sessionMatch.group(1)!;
      if (token != 'deleted' && token.isNotEmpty) {
        TokenStorage.saveSessionToken(token);
      }
    }

    // Match poppo_terms_consent
    final termsMatch = RegExp(r'poppo_terms_consent=([^;]+)')
        .firstMatch(rawCookie);
    if (termsMatch != null && termsMatch.group(1) != null) {
      final token = termsMatch.group(1)!;
      if (token != 'deleted' && token.isNotEmpty) {
        TokenStorage.saveTermsConsentToken(token);
      }
    }
  }

  /// Parses HTTP response into structured ApiResponse
  ApiResponse<dynamic> _processResponse(http.Response response) {
    _extractCookies(response);
    final statusCode = response.statusCode;

    dynamic decodedData;
    try {
      if (response.body.isNotEmpty) {
        decodedData = jsonDecode(utf8.decode(response.bodyBytes));
      }
    } catch (_) {
      // Non-JSON payload (e.g. HTML 502/504 gateway response from Nginx)
      decodedData = null;
    }

    // Success responses (200 - 299)
    if (statusCode >= 200 && statusCode < 300) {
      String? successMessage;
      if (decodedData is Map && decodedData['message'] != null) {
        successMessage = decodedData['message'].toString();
      }
      return ApiResponse.success(
        decodedData,
        statusCode: statusCode,
        message: successMessage,
      );
    }

    // Extract error details if JSON map
    String errorMessage = 'Request failed with status $statusCode';
    String? errorCode;
    dynamic errorDetails;

    if (decodedData is Map) {
      errorMessage =
          (decodedData['error'] ?? decodedData['message'] ?? errorMessage)
              .toString();
      errorCode = decodedData['code']?.toString();
      errorDetails = decodedData['details'];
    } else if (statusCode == 502) {
      errorMessage =
          'Backend service is temporarily unavailable (502 Bad Gateway).';
      errorCode = 'BAD_GATEWAY';
    } else if (statusCode == 503) {
      errorMessage = 'Server is currently undergoing maintenance (503 Service Unavailable).';
      errorCode = 'SERVICE_UNAVAILABLE';
    } else if (statusCode == 504) {
      errorMessage = 'Gateway timeout connecting to backend upstream (504).';
      errorCode = 'GATEWAY_TIMEOUT';
    }

    // Map status code to specific ApiException
    ApiException exception;
    switch (statusCode) {
      case 400:
      case 422:
        exception = ValidationException(
          message: errorMessage,
          code: errorCode,
          details: errorDetails,
        );
        break;
      case 401:
        exception = UnauthorizedException(
          message: errorMessage,
          code: errorCode,
        );
        break;
      case 403:
        exception = ForbiddenException(message: errorMessage, code: errorCode);
        break;
      case 404:
        exception = NotFoundException(message: errorMessage, code: errorCode);
        break;
      default:
        if (statusCode >= 500) {
          exception = ServerException(
            message: errorMessage,
            statusCode: statusCode,
            code: errorCode,
          );
        } else {
          exception = ApiException(
            message: errorMessage,
            statusCode: statusCode,
            code: errorCode,
            details: errorDetails,
          );
        }
    }

    return ApiResponse.fromException(exception);
  }

  /// Centralized exception wrapper for network errors and timeouts
  ApiResponse<dynamic> _handleException(dynamic error) {
    if (error is SocketException) {
      return ApiResponse.fromException(
        const NetworkException(
          message: 'Unable to reach backend server. Please verify your internet connection.',
        ),
      );
    } else if (error is TimeoutException) {
      return ApiResponse.fromException(
        const ApiTimeoutException(
          message: 'Network request timed out. Please check your connection and retry.',
        ),
      );
    } else if (error is http.ClientException) {
      return ApiResponse.fromException(
        NetworkException(message: 'Connection failed: ${error.message}'),
      );
    } else {
      return ApiResponse.fromException(
        ApiException(message: 'Unexpected network error: $error'),
      );
    }
  }

  /// Executes GET request
  Future<ApiResponse<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final uri = buildUri(path, queryParameters);
      final requestHeaders = await _buildHeaders(headers);
      final response = await _client
          .get(uri, headers: requestHeaders)
          .timeout(timeout ?? ApiConfig.receiveTimeout);
      return _processResponse(response);
    } catch (e) {
      return _handleException(e);
    }
  }

  /// Executes POST request (Safe non-retry)
  Future<ApiResponse<dynamic>> post(
    String path, {
    dynamic body,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final uri = buildUri(path, queryParameters);
      final requestHeaders = await _buildHeaders(headers);
      final encodedBody = body != null ? jsonEncode(body) : null;
      final response = await _client
          .post(uri, headers: requestHeaders, body: encodedBody)
          .timeout(timeout ?? ApiConfig.receiveTimeout);
      return _processResponse(response);
    } catch (e) {
      return _handleException(e);
    }
  }

  /// Executes PUT request
  Future<ApiResponse<dynamic>> put(
    String path, {
    dynamic body,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final uri = buildUri(path, queryParameters);
      final requestHeaders = await _buildHeaders(headers);
      final encodedBody = body != null ? jsonEncode(body) : null;
      final response = await _client
          .put(uri, headers: requestHeaders, body: encodedBody)
          .timeout(timeout ?? ApiConfig.receiveTimeout);
      return _processResponse(response);
    } catch (e) {
      return _handleException(e);
    }
  }

  /// Executes PATCH request
  Future<ApiResponse<dynamic>> patch(
    String path, {
    dynamic body,
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final uri = buildUri(path, queryParameters);
      final requestHeaders = await _buildHeaders(headers);
      final encodedBody = body != null ? jsonEncode(body) : null;
      final response = await _client
          .patch(uri, headers: requestHeaders, body: encodedBody)
          .timeout(timeout ?? ApiConfig.receiveTimeout);
      return _processResponse(response);
    } catch (e) {
      return _handleException(e);
    }
  }

  /// Executes DELETE request
  Future<ApiResponse<dynamic>> delete(
    String path, {
    Map<String, dynamic>? queryParameters,
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final uri = buildUri(path, queryParameters);
      final requestHeaders = await _buildHeaders(headers);
      final response = await _client
          .delete(uri, headers: requestHeaders)
          .timeout(timeout ?? ApiConfig.receiveTimeout);
      return _processResponse(response);
    } catch (e) {
      return _handleException(e);
    }
  }
}
