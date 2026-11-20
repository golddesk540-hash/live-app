import '../api_client.dart';
import '../api_response.dart';

/// Popo Live — Phase 7 (P7-P9)
/// Mobile API Service for Store, Bag, Equip & Redeem Module
class StoreApiService {
  StoreApiService._();
  static final StoreApiService instance = StoreApiService._();

  final ApiClient _client = ApiClient.instance;

  /// Fetches active store categories
  Future<ApiResponse<dynamic>> fetchCategories() async {
    return _client.get('/api/store/categories');
  }

  /// Fetches products in the store catalog with optional category, filter, and search
  Future<ApiResponse<dynamic>> fetchProducts({
    String? category,
    String? filter,
    String? search,
  }) async {
    final queryParams = <String, String>{};
    if (category != null && category.isNotEmpty) queryParams['category'] = category;
    if (filter != null && filter.isNotEmpty) queryParams['filter'] = filter;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final uri = Uri(
      path: '/api/store/products',
      queryParameters: queryParams.isEmpty ? null : queryParams,
    );
    return _client.get(uri.toString());
  }

  /// Fetches single product detail by ID
  Future<ApiResponse<dynamic>> fetchProductDetail(String productId) async {
    return _client.get('/api/store/products/$productId');
  }

  /// Purchases a store product atomically using coin balance
  Future<ApiResponse<dynamic>> buyProduct(
    String productId, {
    bool autoEquip = false,
    String? idempotencyKey,
  }) async {
    final headers = <String, String>{};
    if (idempotencyKey != null) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return _client.post(
      '/api/store/products/$productId/buy',
      body: {
        'autoEquip': autoEquip,
        'idempotencyKey': idempotencyKey,
      },
      headers: headers,
    );
  }

  /// Fetches owned bag items for the authenticated user
  Future<ApiResponse<dynamic>> fetchBagItems() async {
    return _client.get('/api/bag');
  }

  /// Equips an owned bag item (enforcing one-slot-per-category)
  Future<ApiResponse<dynamic>> equipItem(String inventoryId) async {
    return _client.post('/api/bag/items/$inventoryId/equip');
  }

  /// Unequips an owned bag item
  Future<ApiResponse<dynamic>> unequipItem(String inventoryId) async {
    return _client.delete('/api/bag/items/$inventoryId/equip');
  }

  /// Validates a voucher redeem code (read-only, no DB mutations)
  Future<ApiResponse<dynamic>> validateRedeemCode(String code) async {
    return _client.post(
      '/api/redeem/validate',
      body: {'code': code.trim().toUpperCase()},
    );
  }

  /// Atomically redeems a voucher code with coin credit
  Future<ApiResponse<dynamic>> redeemCode(
    String code, {
    String? idempotencyKey,
  }) async {
    final headers = <String, String>{};
    if (idempotencyKey != null) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return _client.post(
      '/api/redeem/redeem',
      body: {
        'code': code.trim().toUpperCase(),
        'idempotencyKey': idempotencyKey,
      },
      headers: headers,
    );
  }

  /// Fetches equipped items for a profile display
  Future<ApiResponse<dynamic>> fetchEquippedProfile(String userId) async {
    return _client.get('/api/profile/$userId/equipped');
  }
}
