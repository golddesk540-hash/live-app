import '../api_client.dart';
import '../api_config.dart';
import '../api_response.dart';

/// Central API Service for Real Payment Processing
/// Implements Popo Live Phase 8 (P8-P7) Coin Packages, VIP, Refunds & Orders
class PaymentService {
  final ApiClient _client;

  PaymentService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Retrieves available coin packages and VIP subscription plans
  Future<ApiResponse<dynamic>> getPackages() async {
    return _client.get('/api/payments/packages');
  }

  /// Initiates a payment order for a coin package or VIP plan
  Future<ApiResponse<dynamic>> createOrder({
    required String targetType,
    String? packageId,
    String? planId,
    String providerKey = 'stripe_card',
    String? currency = 'USD',
    String? idempotencyKey,
    String platform = 'android',
  }) async {
    return _client.post(
      '/api/payments/orders',
      body: {
        'targetType': targetType,
        if (packageId != null) 'packageId': packageId,
        if (planId != null) 'planId': planId,
        'providerKey': providerKey,
        'currency': currency,
        if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
        'platform': platform,
      },
    );
  }

  /// Polls the latest status of an existing payment order
  Future<ApiResponse<dynamic>> getOrderStatus(String orderId) async {
    return _client.get('/api/payments/orders/$orderId');
  }

  /// Confirms an order after successful completion on the mobile client SDK
  Future<ApiResponse<dynamic>> confirmOrder({
    required String orderId,
    String? providerPaymentRef,
  }) async {
    return _client.post(
      '/api/payments/orders/$orderId/confirm',
      body: {
        if (providerPaymentRef != null) 'providerPaymentRef': providerPaymentRef,
      },
    );
  }

  /// Retrieves authenticated user's payment purchase history
  Future<ApiResponse<dynamic>> getPurchaseHistory() async {
    return _client.get('/api/payments/history');
  }

  /// Requests a refund for a previously completed order (subject to admin review)
  Future<ApiResponse<dynamic>> requestRefund({
    required String orderId,
    required String reason,
  }) async {
    return _client.post(
      '/api/payments/orders/$orderId/refund',
      body: {
        'reason': reason,
      },
    );
  }

  /// Returns whether real payment gateway processing is active
  bool get isRealPaymentsEnabled => ApiConfig.useRealPayments;
}
