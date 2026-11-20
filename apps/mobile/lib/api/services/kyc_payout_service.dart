import '../api_client.dart';
import '../api_config.dart';
import '../api_response.dart';

/// Central API Service for KYC Identity Verification & Real Withdrawal Payout Rails
/// Implements Popo Live Phase 8 (P8-P9) KYC Verification, Payout Rails & Cooling Periods
class KycPayoutService {
  final ApiClient _client;

  KycPayoutService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Initiates a KYC verification session (returns provider inquiry session token)
  Future<ApiResponse<dynamic>> startKyc() async {
    return _client.post('/api/kyc/start');
  }

  /// Retrieves user's latest KYC verification status and earning eligibility
  Future<ApiResponse<dynamic>> getKycStatus() async {
    return _client.get('/api/kyc/status');
  }

  /// Submits a coin withdrawal request (enforces Age 18+, KYC check, limits & cooling period)
  Future<ApiResponse<dynamic>> requestWithdrawal({
    required int amount,
    String? payoutMethodId,
    String? idempotencyKey,
  }) async {
    return _client.post(
      '/api/builder/withdrawal',
      body: {
        'amount': amount,
        if (payoutMethodId != null) 'payoutMethodId': payoutMethodId,
        if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Retrieves status of a specific withdrawal request
  Future<ApiResponse<dynamic>> getWithdrawalStatus(String withdrawalId) async {
    return _client.get('/api/builder/withdrawal/$withdrawalId');
  }

  /// Retrieves user's withdrawal request history
  Future<ApiResponse<dynamic>> getWithdrawalHistory({int page = 1, int limit = 20}) async {
    return _client.get(
      '/api/builder/withdrawal/history',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
  }

  /// Returns whether real KYC identity verification is active
  bool get isRealKycEnabled => ApiConfig.useRealKyc;

  /// Returns whether real payout banking rails are active
  bool get isRealPayoutEnabled => ApiConfig.useRealPayout;
}
