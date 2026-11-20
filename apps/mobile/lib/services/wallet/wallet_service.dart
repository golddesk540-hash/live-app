import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../models/wallet/wallet_models.dart';
import '../../api/api_config.dart';

/// Service response wrapper
class WalletApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? errorMessage;
  final String? errorCode;
  final int statusCode;

  const WalletApiResponse({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    this.errorCode,
    required this.statusCode,
  });
}

/// ============================================================================
/// Popo Live — Phase 3 Prompt 05/08: Wallet & Payment Service
/// Central HTTP API Client for Wallet Balance, Packages, Orders & Transactions
/// ============================================================================
class WalletService {
  static const String _defaultBaseUrl = 'http://localhost:3000';
  final String baseUrl;
  final http.Client _client;

  WalletService({
    String? baseUrl,
    http.Client? client,
  })  : baseUrl = baseUrl ?? _defaultBaseUrl,
        _client = client ?? http.Client();

  String get _currentPlatform {
    if (kIsWeb) return 'web';
    try {
      if (Platform.isIOS) return 'ios';
      if (Platform.isAndroid) return 'android';
    } catch (_) {}
    return 'android';
  }

  Map<String, String> _buildHeaders({String? authToken, String? userId}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authToken != null && authToken.isNotEmpty) {
      headers['Authorization'] = 'Bearer $authToken';
    }
    if (userId != null && userId.isNotEmpty) {
      headers['x-viewer-id'] = userId;
    }
    return headers;
  }

  /// 1. Fetch Current Wallet Balance (GET /api/wallet/balance or /api/economy/coins/balance)
  Future<WalletApiResponse<WalletBalanceInfo>> getBalance({
    String? userId,
    String? authToken,
    bool previewDemo = false,
  }) async {
    try {
      if (ApiConfig.useEconomyApi) {
        final coinUri = Uri.parse('$baseUrl/api/economy/coins/balance');
        final ptsUri = Uri.parse('$baseUrl/api/economy/points/balance');
        final headers = _buildHeaders(authToken: authToken, userId: userId);

        final responses = await Future.wait([
          _client.get(coinUri, headers: headers).timeout(const Duration(seconds: 10)),
          _client.get(ptsUri, headers: headers).timeout(const Duration(seconds: 10)),
        ]);

        final coinJson = jsonDecode(responses[0].body) as Map<String, dynamic>;
        final ptsJson = jsonDecode(responses[1].body) as Map<String, dynamic>;

        if (responses[0].statusCode == 200 && coinJson['success'] == true) {
          final info = WalletBalanceInfo(
            walletId: coinJson['walletId']?.toString() ?? '',
            userId: coinJson['userId']?.toString() ?? (userId ?? ''),
            coins: (coinJson['coins'] as num?)?.toInt() ?? 0,
            points: (ptsJson['points'] as num?)?.toInt() ?? (ptsJson['diamondPoints'] as num?)?.toInt() ?? 0,
            isFrozen: coinJson['isFrozen'] == true,
            hostSharePercentage: (ptsJson['hostSharePercent'] as num?)?.toDouble() ?? 70.0,
            updatedAt: coinJson['updatedAt'] != null
                ? DateTime.tryParse(coinJson['updatedAt'].toString()) ?? DateTime.now()
                : DateTime.now(),
          );
          return WalletApiResponse(
            isSuccess: true,
            data: info,
            statusCode: 200,
          );
        }
      }

      final queryParams = <String, String>{};
      if (userId != null && userId.isNotEmpty) queryParams['userId'] = userId;
      if (previewDemo) queryParams['preview'] = 'demo';
      queryParams['fresh'] = 'true';

      final uri = Uri.parse('$baseUrl/api/wallet/balance').replace(queryParameters: queryParams);
      final res = await _client.get(
        uri,
        headers: _buildHeaders(authToken: authToken, userId: userId),
      ).timeout(const Duration(seconds: 10));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return WalletApiResponse(
          isSuccess: true,
          data: WalletBalanceInfo.fromJson(json),
          statusCode: res.statusCode,
        );
      }
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to load wallet balance',
        errorCode: json['errorCode']?.toString(),
        statusCode: res.statusCode,
      );
    } catch (e) {
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 2. Fetch Coin Packages Catalogue (GET /api/topup/packages or /api/economy/coins/packages)
  Future<WalletApiResponse<List<CoinPackage>>> getCoinPackages({
    bool includeInactive = false,
  }) async {
    try {
      if (ApiConfig.useEconomyApi) {
        final uri = Uri.parse('$baseUrl/api/economy/coins/packages');
        final res = await _client.get(uri).timeout(const Duration(seconds: 10));
        final json = jsonDecode(res.body) as Map<String, dynamic>;
        if (res.statusCode == 200 && json['success'] == true) {
          final list = (json['packages'] as List?)
                  ?.map((item) => CoinPackage.fromJson(item as Map<String, dynamic>))
                  .toList() ??
              [];
          return WalletApiResponse(
            isSuccess: true,
            data: list,
            statusCode: res.statusCode,
          );
        }
      }

      final uri = Uri.parse('$baseUrl/api/topup/packages${includeInactive ? "?includeInactive=true" : ""}');
      final res = await _client.get(uri).timeout(const Duration(seconds: 10));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        final list = (json['packages'] as List?)
                ?.map((item) => CoinPackage.fromJson(item as Map<String, dynamic>))
                .toList() ??
            [];
        return WalletApiResponse(
          isSuccess: true,
          data: list,
          statusCode: res.statusCode,
        );
      }
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to load coin packages',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 3. Initiate Top-up Payment Order (POST /api/topup/orders)
  Future<WalletApiResponse<TopupOrder>> createTopupOrder({
    required String packageId,
    String? userId,
    String? authToken,
    String providerKey = 'sandbox_verified',
    String? platform,
    String? idempotencyKey,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = previewDemo ? {'preview': 'demo'} : null;
      final uri = Uri.parse('$baseUrl/api/topup/orders').replace(queryParameters: queryParams);

      final payload = {
        'packageId': packageId,
        'userId': userId,
        'providerKey': providerKey,
        'platform': platform ?? _currentPlatform,
        if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
        if (previewDemo) 'preview': 'demo',
      };

      final headers = _buildHeaders(authToken: authToken, userId: userId);
      if (idempotencyKey != null) {
        headers['x-idempotency-key'] = idempotencyKey;
      }

      final res = await _client.post(
        uri,
        headers: headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 12));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if ((res.statusCode == 200 || res.statusCode == 201) && json['success'] == true) {
        return WalletApiResponse(
          isSuccess: true,
          data: TopupOrder.fromJson(json),
          statusCode: res.statusCode,
        );
      }
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to initiate top-up order',
        errorCode: json['errorCode']?.toString(),
        statusCode: res.statusCode,
      );
    } catch (e) {
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 4. Cryptographic Server Verification (POST /api/topup/orders/[orderId]/verify)
  Future<WalletApiResponse<TopupPurchaseResult>> verifyOrder({
    required String orderId,
    required String signature,
    String? providerKey,
    String? providerPaymentRef,
    Map<String, dynamic>? rawPayload,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/topup/orders/$orderId/verify');
      final payload = {
        'signature': signature,
        if (providerKey != null) 'providerKey': providerKey,
        if (providerPaymentRef != null) 'providerPaymentRef': providerPaymentRef,
        if (rawPayload != null) 'rawPayload': rawPayload,
      };

      final headers = _buildHeaders();
      headers['x-topup-webhook-signature'] = signature;

      final res = await _client.post(
        uri,
        headers: headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 15));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return WalletApiResponse(
          isSuccess: true,
          data: TopupPurchaseResult.fromJson(json),
          statusCode: res.statusCode,
        );
      }
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Order verification failed',
        errorCode: json['errorCode']?.toString(),
        statusCode: res.statusCode,
      );
    } catch (e) {
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 5. Trigger Sandbox Action (POST /api/topup/sandbox/complete)
  Future<WalletApiResponse<TopupPurchaseResult>> completeSandboxTopup({
    required String orderId,
    String outcome = 'succeeded',
    String? failureReason,
    String? authToken,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = previewDemo ? {'preview': 'demo'} : null;
      final uri = Uri.parse('$baseUrl/api/topup/sandbox/complete').replace(queryParameters: queryParams);

      final payload = {
        'orderId': orderId,
        'outcome': outcome,
        if (failureReason != null) 'failureReason': failureReason,
      };

      final res = await _client.post(
        uri,
        headers: _buildHeaders(authToken: authToken),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 12));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return WalletApiResponse(
          isSuccess: true,
          data: TopupPurchaseResult.fromJson(json),
          statusCode: res.statusCode,
        );
      }
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Sandbox action failed',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 6. Purchase History (GET /api/topup/history)
  Future<WalletApiResponse<List<PurchaseHistoryRecord>>> getPurchaseHistory({
    String? userId,
    String? authToken,
    int page = 1,
    int limit = 20,
    String status = 'all',
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
        'status': status,
      };
      if (userId != null && userId.isNotEmpty) queryParams['userId'] = userId;
      if (previewDemo) queryParams['preview'] = 'demo';

      final uri = Uri.parse('$baseUrl/api/topup/history').replace(queryParameters: queryParams);
      final res = await _client.get(
        uri,
        headers: _buildHeaders(authToken: authToken, userId: userId),
      ).timeout(const Duration(seconds: 10));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        final list = (json['items'] as List?)
                ?.map((item) => PurchaseHistoryRecord.fromJson(item as Map<String, dynamic>))
                .toList() ??
            [];
        return WalletApiResponse(
          isSuccess: true,
          data: list,
          statusCode: res.statusCode,
        );
      }
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to load purchase history',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 7. Coin Transaction History (GET /api/wallet/coins/history or /api/economy/coins/history)
  Future<WalletApiResponse<List<WalletTransactionRecord>>> getCoinTransactionHistory({
    String? userId,
    String? authToken,
    int page = 1,
    int limit = 20,
    String status = 'all',
    bool previewDemo = false,
  }) async {
    try {
      if (ApiConfig.useEconomyApi) {
        final uri = Uri.parse('$baseUrl/api/economy/coins/history?page=$page&limit=$limit');
        final res = await _client.get(
          uri,
          headers: _buildHeaders(authToken: authToken, userId: userId),
        ).timeout(const Duration(seconds: 10));

        final json = jsonDecode(res.body) as Map<String, dynamic>;
        if (res.statusCode == 200 && json['success'] == true) {
          final list = (json['transactions'] as List?)
                  ?.map((item) => WalletTransactionRecord.fromJson(item as Map<String, dynamic>))
                  .toList() ??
              [];
          return WalletApiResponse(
            isSuccess: true,
            data: list,
            statusCode: res.statusCode,
          );
        }
      }

      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
        'status': status,
      };
      if (userId != null && userId.isNotEmpty) queryParams['userId'] = userId;
      if (previewDemo) queryParams['preview'] = 'demo';

      final uri = Uri.parse('$baseUrl/api/wallet/coins/history').replace(queryParameters: queryParams);
      final res = await _client.get(
        uri,
        headers: _buildHeaders(authToken: authToken, userId: userId),
      ).timeout(const Duration(seconds: 10));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        final list = (json['transactions'] as List?)
                ?.map((item) => WalletTransactionRecord.fromJson(item as Map<String, dynamic>))
                .toList() ??
            [];
        return WalletApiResponse(
          isSuccess: true,
          data: list,
          statusCode: res.statusCode,
        );
      }
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to load coin transactions',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return WalletApiResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }
}
