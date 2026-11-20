import '../api_client.dart';
import '../api_response.dart';

/// Central API Service for Economy Module (Coins, Points, Packages, Gifts & Transactions)
/// Implements Popo Live Phase 7 (P7-P7) Economy Module Database Integration
class EconomyApiService {
  final ApiClient _client;

  EconomyApiService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Retrieves authenticated user's coin balance
  Future<ApiResponse<dynamic>> getCoinBalance() async {
    return _client.get('/api/economy/coins/balance');
  }

  /// Retrieves authoritative coin packages list (read-only)
  Future<ApiResponse<dynamic>> getCoinPackages() async {
    return _client.get('/api/economy/coins/packages');
  }

  /// Retrieves paginated coin transaction history
  Future<ApiResponse<dynamic>> getCoinHistory({int page = 1, int limit = 20}) async {
    return _client.get(
      '/api/economy/coins/history',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
  }

  /// Retrieves authenticated host user's points balance
  Future<ApiResponse<dynamic>> getPointsBalance() async {
    return _client.get('/api/economy/points/balance');
  }

  /// Retrieves paginated host points transaction history
  Future<ApiResponse<dynamic>> getPointsHistory({int page = 1, int limit = 20}) async {
    return _client.get(
      '/api/economy/points/history',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
  }

  /// Retrieves active gift catalogue with authoritative coin prices
  Future<ApiResponse<dynamic>> getGifts() async {
    return _client.get('/api/economy/gifts');
  }

  /// Retrieves single transaction details for audit
  Future<ApiResponse<dynamic>> getTransactionDetail(String transactionId) async {
    return _client.get('/api/economy/transactions/$transactionId');
  }
}
