import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../models/wallet/financial_models.dart';

class FinancialServiceResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? errorMessage;
  final String? errorCode;
  final int statusCode;

  const FinancialServiceResponse({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    this.errorCode,
    required this.statusCode,
  });
}

/// Financial & Transaction Management Service
/// Communicates with:
/// - GET /api/finance/history (Unified ledger)
/// - GET /api/finance/receipts/[receiptId] (Official receipt detail)
/// - GET /api/finance/receipts/[receiptId]/pdf (Downloadable financial PDF)
/// - GET /api/wallet/reconcile (Server-authoritative reconciliation)
/// - POST /api/wallet/reconcile/report (Report discrepancy)
/// - POST /api/finance/refunds/request (Submit refund request)
/// - POST /api/topup/recovery/reconcile (Purchase recovery)
class FinancialService {
  final String baseUrl;
  final http.Client _client;
  String? _authToken;

  FinancialService({
    String? baseUrl,
    http.Client? client,
  })  : baseUrl = baseUrl ?? 'http://localhost:3000',
        _client = client ?? http.Client();

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Map<String, String> _buildHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  /// 1. Fetch Unified Financial Transaction History
  Future<FinancialServiceResponse<Map<String, dynamic>>> getFinancialHistory({
    String? category, // 'all', 'topup', 'vip', 'gift_sent', 'earnings', 'refunds', 'reversal'
    String? status, // 'all', 'successful', 'pending', 'failed', 'refunded'
    String? search,
    String? preset, // 'all', 'today', '7d', '30d'
    int page = 1,
    int limit = 20,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (category != null && category != 'all') queryParams['type'] = category;
      if (status != null && status != 'all') queryParams['status'] = status;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (preset != null && preset != 'all') queryParams['preset'] = preset;
      if (previewDemo) queryParams['preview'] = 'demo';

      final uri = Uri.parse('$baseUrl/api/finance/history').replace(queryParameters: queryParams);
      final res = await _client.get(uri, headers: _buildHeaders()).timeout(const Duration(seconds: 15));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        final items = (json['items'] as List?)
                ?.map((item) => FinancialTransactionItem.fromJson(item as Map<String, dynamic>))
                .toList() ??
            [];
        final summary = FinancialHistorySummary.fromJson(json['summary'] as Map<String, dynamic>? ?? {});
        final pagination = json['pagination'] as Map<String, dynamic>? ?? {};

        return FinancialServiceResponse(
          isSuccess: true,
          data: {
            'items': items,
            'summary': summary,
            'pagination': pagination,
          },
          statusCode: res.statusCode,
        );
      }

      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to load financial transaction history.',
        errorCode: json['errorCode']?.toString(),
        statusCode: res.statusCode,
      );
    } catch (e) {
      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 2. Fetch Official Financial Receipt Details
  Future<FinancialServiceResponse<FinancialReceiptDetail>> getReceiptDetail({
    required String receiptId,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = previewDemo ? {'preview': 'demo'} : null;
      final uri = Uri.parse('$baseUrl/api/finance/receipts/$receiptId').replace(queryParameters: queryParams);
      final res = await _client.get(uri, headers: _buildHeaders()).timeout(const Duration(seconds: 15));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return FinancialServiceResponse(
          isSuccess: true,
          data: FinancialReceiptDetail.fromJson(json),
          statusCode: res.statusCode,
        );
      }

      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to retrieve receipt details.',
        errorCode: json['errorCode']?.toString(),
        statusCode: res.statusCode,
      );
    } catch (e) {
      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 3. Get Downloadable Receipt PDF URL
  String getReceiptPdfUrl(String receiptId, {bool previewDemo = false}) {
    return '$baseUrl/api/finance/receipts/$receiptId/pdf${previewDemo ? '?preview=demo' : ''}';
  }

  /// 4. Run Server-Authoritative Wallet Reconciliation
  Future<FinancialServiceResponse<WalletReconciliationReport>> reconcileWallet({
    String? userId,
    bool forceRefresh = false,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (userId != null) queryParams['userId'] = userId;
      if (forceRefresh) queryParams['refresh'] = 'true';
      if (previewDemo) queryParams['preview'] = 'demo';

      final uri = Uri.parse('$baseUrl/api/wallet/reconcile').replace(queryParameters: queryParams);
      final res = await _client.get(uri, headers: _buildHeaders()).timeout(const Duration(seconds: 15));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return FinancialServiceResponse(
          isSuccess: true,
          data: WalletReconciliationReport.fromJson(json),
          statusCode: res.statusCode,
        );
      }

      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Wallet reconciliation check failed.',
        errorCode: json['errorCode']?.toString(),
        statusCode: res.statusCode,
      );
    } catch (e) {
      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 5. Report Financial Discrepancy to Security & Accounting
  Future<FinancialServiceResponse<Map<String, dynamic>>> reportDiscrepancy({
    required String description,
    String? userId,
    String? orderId,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = previewDemo ? {'preview': 'demo'} : null;
      final uri = Uri.parse('$baseUrl/api/wallet/reconcile/report').replace(queryParameters: queryParams);

      final payload = {
        'description': description,
        if (userId != null) 'userId': userId,
        if (orderId != null) 'orderId': orderId,
      };

      final res = await _client.post(
        uri,
        headers: _buildHeaders(),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 15));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return FinancialServiceResponse(
          isSuccess: true,
          data: json,
          statusCode: res.statusCode,
        );
      }

      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to submit discrepancy report.',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 6. Request Refund for a Confirmed Top-up Purchase
  Future<FinancialServiceResponse<RefundRequestResult>> requestRefund({
    required String orderId,
    required String reason,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = previewDemo ? {'preview': 'demo'} : null;
      final uri = Uri.parse('$baseUrl/api/finance/refunds/request').replace(queryParameters: queryParams);

      final payload = {
        'orderId': orderId,
        'reason': reason,
      };

      final res = await _client.post(
        uri,
        headers: _buildHeaders(),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 15));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return FinancialServiceResponse(
          isSuccess: true,
          data: RefundRequestResult.fromJson(json),
          statusCode: res.statusCode,
        );
      }

      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Refund request failed.',
        errorCode: json['errorCode']?.toString(),
        statusCode: res.statusCode,
      );
    } catch (e) {
      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 7. Interrupted Purchase Recovery
  Future<FinancialServiceResponse<PurchaseRecoveryResult>> recoverPendingPurchases({
    String? userId,
    List<String>? orderIds,
    bool simulateRecovery = false,
    bool previewDemo = false,
  }) async {
    try {
      final queryParams = previewDemo ? {'preview': 'demo'} : null;
      final uri = Uri.parse('$baseUrl/api/topup/recovery/reconcile').replace(queryParameters: queryParams);

      final payload = {
        if (userId != null) 'userId': userId,
        if (orderIds != null && orderIds.isNotEmpty) 'orderIds': orderIds,
        if (simulateRecovery) 'simulateRecovery': true,
      };

      final res = await _client.post(
        uri,
        headers: _buildHeaders(),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 20));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return FinancialServiceResponse(
          isSuccess: true,
          data: PurchaseRecoveryResult.fromJson(json),
          statusCode: res.statusCode,
        );
      }

      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Purchase recovery failed.',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  /// 8. Fetch Finance Rules (70/30 Share Verification)
  Future<FinancialServiceResponse<Map<String, dynamic>>> getFinanceRules() async {
    try {
      final uri = Uri.parse('$baseUrl/api/admin/finance/rules');
      final res = await _client.get(uri, headers: _buildHeaders()).timeout(const Duration(seconds: 10));

      final json = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && json['success'] == true) {
        return FinancialServiceResponse(
          isSuccess: true,
          data: json['rules'] as Map<String, dynamic>? ?? {},
          statusCode: res.statusCode,
        );
      }

      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: json['error']?.toString() ?? 'Failed to retrieve finance rules.',
        statusCode: res.statusCode,
      );
    } catch (e) {
      return FinancialServiceResponse(
        isSuccess: false,
        errorMessage: e.toString(),
        statusCode: 500,
      );
    }
  }

  void dispose() {
    _client.close();
  }
}
