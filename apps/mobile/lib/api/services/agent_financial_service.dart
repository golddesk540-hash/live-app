import '../api_client.dart';
import '../api_response.dart';

/// Service managing agent financial operations: earnings, coin selling,
/// commissions, payout methods, and withdrawals.
class AgentFinancialService {
  final ApiClient _client;

  AgentFinancialService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  static final AgentFinancialService instance = AgentFinancialService();

  /// Fetches agent earnings dashboard data
  Future<ApiResponse<dynamic>> getEarnings() async {
    return _client.get('/api/agent/earnings');
  }

  /// Fetches available coin packages for authorized sellers
  Future<ApiResponse<dynamic>> getSellerPackages() async {
    return _client.get('/api/agent/seller/packages');
  }

  /// Sells coins to a customer atomically
  Future<ApiResponse<dynamic>> sellCoins({
    required String customerIdentifier,
    required String packageId,
    String? idempotencyKey,
  }) async {
    return _client.post(
      '/api/agent/seller/sell',
      body: {
        'customerIdentifier': customerIdentifier,
        'packageId': packageId,
        if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Fetches seller's sales transaction history
  Future<ApiResponse<dynamic>> getSellerSales({
    int limit = 20,
    int offset = 0,
  }) async {
    return _client.get(
      '/api/agent/seller/sales',
      queryParameters: {
        'limit': limit.toString(),
        'offset': offset.toString(),
      },
    );
  }

  /// Fetches saved payout methods (JazzCash, Easypaisa, Bank Transfer)
  Future<ApiResponse<dynamic>> getPayoutMethods() async {
    return _client.get('/api/agent/payout-methods');
  }

  /// Adds a new verified payout method
  Future<ApiResponse<dynamic>> addPayoutMethod({
    required String provider,
    required String accountTitle,
    required String accountNumber,
    String? bankName,
    bool isDefault = false,
  }) async {
    return _client.post(
      '/api/agent/payout-methods',
      body: {
        'provider': provider,
        'accountTitle': accountTitle,
        'accountNumber': accountNumber,
        if (bankName != null) 'bankName': bankName,
        'isDefault': isDefault,
      },
    );
  }

  /// Removes a payout method
  Future<ApiResponse<dynamic>> deletePayoutMethod(String methodId) async {
    return _client.delete('/api/agent/payout-methods/$methodId');
  }

  /// Submits an authenticated withdrawal request
  Future<ApiResponse<dynamic>> requestWithdrawal({
    required int pointsAmount,
    required String payoutMethodId,
  }) async {
    return _client.post(
      '/api/agent/withdrawals/request',
      body: {
        'pointsAmount': pointsAmount,
        'payoutMethodId': payoutMethodId,
      },
    );
  }

  /// Fetches withdrawal history and audit status
  Future<ApiResponse<dynamic>> getWithdrawals({
    int limit = 20,
    int offset = 0,
  }) async {
    return _client.get(
      '/api/agent/withdrawals',
      queryParameters: {
        'limit': limit.toString(),
        'offset': offset.toString(),
      },
    );
  }

  /// Agency Admin: Fetches managed agents and coin sellers
  Future<ApiResponse<dynamic>> getAgencyAdminAgents() async {
    return _client.get('/api/agency/admin/agents');
  }
}
