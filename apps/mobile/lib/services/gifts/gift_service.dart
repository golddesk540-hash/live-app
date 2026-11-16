import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../api/api_client.dart';
import '../../api/api_config.dart';
import '../../api/api_response.dart';
import '../../models/gifts/gift_models.dart';

/// Centralized Virtual Gift API Service for Popo Live
/// Interfaces directly with verified Next.js backend Gift & Wallet endpoints:
/// - GET  /api/gifts/catalog
/// - GET  /api/gifts/categories
/// - POST /api/gifts/send/preview
/// - POST /api/gifts/send
/// - GET  /api/gifts/transactions
/// - GET  /api/earnings/dashboard
class GiftService {
  final ApiClient _client;

  GiftService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  static final GiftService instance = GiftService();

  /// 1. Retrieve Central Virtual Gift Catalog
  Future<ApiResponse<Map<String, dynamic>>> getCatalog({
    String? categoryId,
    String? search,
    bool? popularOnly,
    bool? newOnly,
    int page = 1,
    int limit = 24,
    String? userId,
    bool previewDemo = false,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (categoryId != null && categoryId.isNotEmpty && categoryId != 'all') {
      queryParams['category'] = categoryId;
    }
    if (search != null && search.trim().isNotEmpty) {
      queryParams['q'] = search.trim();
    }
    if (popularOnly == true) {
      queryParams['popularOnly'] = 'true';
    }
    if (newOnly == true) {
      queryParams['newOnly'] = 'true';
    }
    if (userId != null && userId.isNotEmpty) {
      queryParams['userId'] = userId;
    }
    if (previewDemo) {
      queryParams['preview'] = 'demo';
    }

    final res = await _client.get('/api/gifts/catalog', queryParameters: queryParams);
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawGifts = map['gifts'] as List<dynamic>? ?? [];
      final rawCats = map['categories'] as List<dynamic>? ?? [];

      final gifts = rawGifts
          .map((g) => GiftItem.fromJson(g as Map<String, dynamic>))
          .toList();
      final categories = rawCats
          .map((c) => GiftCategory.fromJson(c as Map<String, dynamic>))
          .toList();

      return ApiResponse.success({
        'gifts': gifts,
        'categories': categories,
        'viewerCoinBalance': (map['viewerCoinBalance'] as num?)?.toInt(),
        'pagination': map['pagination'] as Map<String, dynamic>? ?? {},
      }, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to load gift catalog.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 2. Retrieve Gift Categories
  Future<ApiResponse<List<GiftCategory>>> getCategories() async {
    final res = await _client.get('/api/gifts/categories');
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawCats = map['categories'] as List<dynamic>? ?? [];
      final categories = rawCats
          .map((c) => GiftCategory.fromJson(c as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(categories, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to load gift categories.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 3. Pre-Send Gift Cost & Balance Validation Quote
  Future<ApiResponse<GiftSendQuote>> previewGift({
    required String giftId,
    int quantity = 1,
    required String recipientHostId,
    String? liveRoomId,
    String? pkBattleId,
    String? userId,
    bool previewDemo = false,
  }) async {
    final payload = <String, dynamic>{
      'giftId': giftId,
      'quantity': quantity,
      'recipientHostId': recipientHostId,
    };
    if (liveRoomId != null && liveRoomId.isNotEmpty) {
      payload['liveRoomId'] = liveRoomId;
    }
    if (pkBattleId != null && pkBattleId.isNotEmpty) {
      payload['pkBattleId'] = pkBattleId;
    }
    if (previewDemo) {
      payload['preview'] = 'demo';
    }

    final headers = <String, String>{};
    if (userId != null && userId.isNotEmpty) {
      headers['x-viewer-id'] = userId;
    }

    final res = await _client.post(
      '/api/gifts/send/preview',
      body: payload,
      headers: headers,
    );

    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final quoteData = map['preview'] as Map<String, dynamic>? ?? map;
      return ApiResponse.success(
        GiftSendQuote.fromJson(quoteData),
        statusCode: res.statusCode,
      );
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to preview gift sending.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 4. Submit Authenticated Gift Transaction with Server-Authoritative Validation & Idempotency
  Future<ApiResponse<GiftTransactionResult>> sendGift({
    required String giftId,
    int quantity = 1,
    required String recipientHostId,
    String? liveRoomId,
    String? pkBattleId,
    String? senderUserId,
    String? senderNickname,
    String? idempotencyKey,
    bool previewDemo = false,
  }) async {
    final payload = <String, dynamic>{
      'giftId': giftId,
      'quantity': quantity,
      'recipientHostId': recipientHostId,
    };
    if (liveRoomId != null && liveRoomId.isNotEmpty) {
      payload['liveRoomId'] = liveRoomId;
    }
    if (pkBattleId != null && pkBattleId.isNotEmpty) {
      payload['pkBattleId'] = pkBattleId;
    }
    if (senderUserId != null && senderUserId.isNotEmpty) {
      payload['senderUserId'] = senderUserId;
    }
    if (senderNickname != null && senderNickname.isNotEmpty) {
      payload['senderNickname'] = senderNickname;
    }
    if (idempotencyKey != null && idempotencyKey.isNotEmpty) {
      payload['idempotencyKey'] = idempotencyKey;
    }
    if (previewDemo) {
      payload['preview'] = 'demo';
    }

    final headers = <String, String>{};
    if (senderUserId != null && senderUserId.isNotEmpty) {
      headers['x-viewer-id'] = senderUserId;
    }
    if (idempotencyKey != null && idempotencyKey.isNotEmpty) {
      headers['x-idempotency-key'] = idempotencyKey;
    }

    final res = await _client.post(
      '/api/gifts/send',
      body: payload,
      headers: headers,
    );

    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      return ApiResponse.success(
        GiftTransactionResult.fromJson(map),
        statusCode: res.statusCode,
      );
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Gift transaction failed.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 5. Retrieve Gift Transaction History
  Future<ApiResponse<List<GiftTransactionHistoryItem>>> getTransactions({
    int limit = 30,
    int page = 1,
    String? userId,
  }) async {
    final queryParams = <String, dynamic>{
      'limit': limit.toString(),
      'page': page.toString(),
    };
    if (userId != null && userId.isNotEmpty) {
      queryParams['userId'] = userId;
    }

    final res = await _client.get('/api/gifts/transactions', queryParameters: queryParams);
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawList = map['transactions'] as List<dynamic>? ?? [];
      final list = rawList
          .map((t) => GiftTransactionHistoryItem.fromJson(t as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(list, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to load gift transactions.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 6. Retrieve Host Earnings Dashboard (70% Rule Server-Authoritative)
  Future<ApiResponse<HostEarningsDashboard>> getHostEarnings({
    String? hostUserId,
    bool previewDemo = true,
  }) async {
    final queryParams = <String, dynamic>{};
    if (hostUserId != null && hostUserId.isNotEmpty) {
      queryParams['hostUserId'] = hostUserId;
    }
    if (previewDemo) {
      queryParams['preview'] = 'demo';
    }

    final res = await _client.get('/api/earnings/dashboard', queryParameters: queryParams);
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      return ApiResponse.success(
        HostEarningsDashboard.fromJson(map),
        statusCode: res.statusCode,
      );
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to load host earnings.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 7. Listen to Real-Time Gift SSE Stream for live rooms
  Stream<Map<String, dynamic>> listenToLiveGiftEvents(String roomId) async* {
    final client = http.Client();
    final baseUrl = ApiConfig.baseUrl;
    final url = Uri.parse('$baseUrl/api/gifts/live/events?roomId=$roomId');

    try {
      final request = http.Request('GET', url)
        ..headers['Accept'] = 'text/event-stream'
        ..headers['Cache-Control'] = 'no-cache';

      final response = await client.send(request);
      if (response.statusCode == 200) {
        String currentEvent = 'message';
        final lineStream = response.stream
            .transform(utf8.decoder)
            .transform(const LineSplitter());

        await for (final line in lineStream) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            final dataStr = line.substring(5).trim();
            try {
              final parsed = jsonDecode(dataStr);
              yield {'event': currentEvent, 'data': parsed};
            } catch (_) {
              yield {'event': currentEvent, 'data': dataStr};
            }
          }
        }
      }
    } catch (_) {
      // Graceful fallback to periodic polling
    } finally {
      client.close();
    }
  }
}
