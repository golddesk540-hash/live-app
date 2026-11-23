import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../api/api_client.dart';
import '../../api/api_response.dart';
import '../../models/pk/pk_models.dart';

/// PK Battle API Service
/// Interfaces directly with verified Next.js backend PK endpoints:
/// - GET  /api/pk/hosts
/// - GET  /api/pk/battle-types
/// - POST /api/pk/invitation/send
/// - POST /api/pk/invitation/respond
/// - GET  /api/pk/invitation/status
/// - POST /api/pk/invitation/cancel
/// - GET  /api/pk/battle/[battleId]
class PkService {
  final ApiClient _client;

  PkService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Singleton instance
  static final PkService instance = PkService();

  /// 1. Discover live hosts eligible for PK battle
  /// Excludes the current host by ID
  Future<ApiResponse<List<PkHost>>> getEligibleHosts({
    String? search,
    String? excludeHostId,
  }) async {
    final queryParams = <String, dynamic>{};
    if (search != null && search.trim().isNotEmpty) {
      queryParams['search'] = search.trim();
    }
    if (excludeHostId != null && excludeHostId.isNotEmpty) {
      queryParams['excludeHostId'] = excludeHostId;
    }

    final res = await _client.get('/api/pk/hosts', queryParameters: queryParams);
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawList = map['hosts'] as List<dynamic>? ?? [];
      final hosts = rawList
          .map((h) => PkHost.fromJson(h as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(hosts, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve eligible live hosts.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 2. Retrieve battle types and feature flags
  /// Strictly verifies that 1v1 is enabled and 4-host is disabled
  Future<ApiResponse<List<PkBattleType>>> getBattleTypes() async {
    final res = await _client.get('/api/pk/battle-types');
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawList = map['battleTypes'] as List<dynamic>? ?? [];
      final types = rawList
          .map((t) => PkBattleType.fromJson(t as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(types, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve battle types.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 3. Send 1v1 PK battle invitation to target host
  Future<ApiResponse<PkInvitation>> sendInvitation({
    required String receiverHostId,
    String? senderHostId,
    String? senderRoomNumber,
    String battleType = '1v1',
    String language = 'en',
  }) async {
    final payload = <String, dynamic>{
      'receiverHostId': receiverHostId,
      'battleType': '1v1', // Strictly 1v1 enforced
      'language': language,
    };
    if (senderHostId != null && senderHostId.isNotEmpty) {
      payload['senderHostId'] = senderHostId;
    }
    if (senderRoomNumber != null && senderRoomNumber.isNotEmpty) {
      payload['senderRoomNumber'] = senderRoomNumber;
    }

    final res = await _client.post('/api/pk/invitation/send', body: payload);
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final inviteData = map['invitation'] as Map<String, dynamic>? ?? map;
      final invite = PkInvitation.fromJson(inviteData);
      return ApiResponse.success(
        invite,
        statusCode: res.statusCode,
        message: map['message']?.toString(),
      );
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to send PK invitation.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 4. Respond to PK battle invitation (accept or reject)
  Future<ApiResponse<PkBattle?>> respondToInvitation({
    required String invitationId,
    required String action, // 'accept' | 'reject'
    String? receiverHostId,
    String? reason,
    String language = 'en',
  }) async {
    final payload = <String, dynamic>{
      'invitationId': invitationId,
      'action': action,
      'language': language,
    };
    if (receiverHostId != null && receiverHostId.isNotEmpty) {
      payload['receiverHostId'] = receiverHostId;
    }
    if (reason != null && reason.isNotEmpty) {
      payload['reason'] = reason;
    }

    final res = await _client.post('/api/pk/invitation/respond', body: payload);
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      PkBattle? battle;
      if (map['battle'] is Map) {
        battle = PkBattle.fromJson(map['battle'] as Map<String, dynamic>);
      }
      return ApiResponse.success(
        battle,
        statusCode: res.statusCode,
        message: map['message']?.toString(),
      );
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to process invitation response.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 5. Check invitation status by ID or for a host/room
  Future<ApiResponse<Map<String, dynamic>>> getInvitationStatus({
    String? invitationId,
    String? hostId,
    String? roomNumber,
  }) async {
    final queryParams = <String, dynamic>{};
    if (invitationId != null && invitationId.isNotEmpty) {
      queryParams['invitationId'] = invitationId;
    }
    if (hostId != null && hostId.isNotEmpty) {
      queryParams['hostId'] = hostId;
    }
    if (roomNumber != null && roomNumber.isNotEmpty) {
      queryParams['roomNumber'] = roomNumber;
    }

    final res = await _client.get('/api/pk/invitation/status', queryParameters: queryParams);
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      PkInvitation? invite;
      if (map['invitation'] is Map) {
        invite = PkInvitation.fromJson(map['invitation'] as Map<String, dynamic>);
      }
      PkBattle? battle;
      if (map['battle'] is Map) {
        battle = PkBattle.fromJson(map['battle'] as Map<String, dynamic>);
      }

      return ApiResponse.success({
        'hasActiveInvitation': map['hasActiveInvitation'] == true,
        'invitation': invite,
        'battle': battle,
      }, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to fetch invitation status.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 6. Cancel pending outgoing invitation
  Future<ApiResponse<bool>> cancelInvitation({
    required String invitationId,
    String? senderHostId,
  }) async {
    final payload = <String, dynamic>{
      'invitationId': invitationId,
    };
    if (senderHostId != null && senderHostId.isNotEmpty) {
      payload['senderHostId'] = senderHostId;
    }

    final res = await _client.post('/api/pk/invitation/cancel', body: payload);
    if (res.isSuccess) {
      return ApiResponse.success(true, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to cancel invitation.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 7. Retrieve battle details by battle ID
  Future<ApiResponse<PkBattle>> getBattleDetails(String battleId) async {
    final res = await _client.get('/api/pk/battle/$battleId');
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final battleData = map['battle'] as Map<String, dynamic>? ?? map;
      final battle = PkBattle.fromJson(battleData);
      return ApiResponse.success(battle, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve battle session.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 8. Retrieve server-authoritative score and timer state
  Future<ApiResponse<PkScoreTimerState>> getScoreTimer(String battleId) async {
    final res = await _client.get('/api/pk/battle/$battleId/score-timer');
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final state = PkScoreTimerState.fromJson(map);
      return ApiResponse.success(state, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve score and timer state.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 9. Send validated score point event to designated host side
  Future<ApiResponse<bool>> sendScorePoint({
    required String battleId,
    required String hostSide, // 'host_a' | 'host_b'
    required String targetHostId,
    required String senderId,
    required String senderName,
    required int points,
    String giftName = 'Diamond Star',
    required String idempotencyKey,
  }) async {
    final payload = <String, dynamic>{
      'hostSide': hostSide,
      'targetHostId': targetHostId,
      'senderId': senderId,
      'senderName': senderName,
      'points': points,
      'giftName': giftName,
      'idempotencyKey': idempotencyKey,
    };

    final res = await _client.post(
      '/api/pk/battle/$battleId/score/send',
      body: payload,
    );
    if (res.isSuccess) {
      return ApiResponse.success(true, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to record score event.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 10. Finalize battle (voluntary exit, surrender, or time expired)
  Future<ApiResponse<PkBattleResult>> finalizeBattle({
    required String battleId,
    String? hostId,
    String action = 'end_battle',
    String reason = 'timer_expired',
  }) async {
    final payload = <String, dynamic>{
      'action': action,
      'reason': reason,
    };
    if (hostId != null && hostId.isNotEmpty) {
      payload['hostId'] = hostId;
    }

    final res = await _client.post(
      '/api/pk/battle/$battleId/result',
      body: payload,
    );
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final resData = map['result'] as Map<String, dynamic>? ?? map;
      final result = PkBattleResult.fromJson(resData);
      return ApiResponse.success(result, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to finalize battle result.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 11. Retrieve calculated battle result
  Future<ApiResponse<PkBattleResult>> getBattleResult(String battleId) async {
    final res = await _client.get('/api/pk/battle/$battleId/result');
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      if (map['isCalculated'] == true && map['result'] is Map) {
        final result = PkBattleResult.fromJson(map['result'] as Map<String, dynamic>);
        return ApiResponse.success(result, statusCode: res.statusCode);
      }
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Battle result not yet finalized.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 12. Listen to real-time Server-Sent Events (SSE) stream for battle events
  Stream<Map<String, dynamic>> listenToBattleEvents(String battleId) async* {
    final client = http.Client();
    final baseUrl = _client.baseUrl;
    final url = Uri.parse('$baseUrl/api/pk/battle/$battleId/events');

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
              yield {
                'event': currentEvent,
                'data': parsed,
              };
            } catch (_) {
              yield {
                'event': currentEvent,
                'data': dataStr,
              };
            }
          }
        }
      }
    } catch (e) {
      // Stream error handled gracefully by caller fallback
    } finally {
      client.close();
    }
  }

  /// 13. Retrieve active gift catalog for PK battle
  /// Authoritative conversion: 1 Coin = 1 PK Point
  Future<ApiResponse<List<PkGiftItem>>> getGiftCatalog(String battleId) async {
    final res = await _client.get('/api/pk/battle/$battleId/gifts/catalog');
    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawList = (map['gifts'] ?? map['catalog']) as List<dynamic>? ?? [];
      final catalog = rawList
          .map((item) => PkGiftItem.fromJson(item as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(catalog, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve PK gift catalog.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 14. Send gift in 1v1 PK battle to support Host A or Host B
  /// Executes atomic coin deduction, host diamond credit (70%), and authoritative score increment
  Future<ApiResponse<Map<String, dynamic>>> sendGift({
    required String battleId,
    required String senderId,
    required String senderName,
    required String receiverSide, // 'host_a' | 'host_b'
    required String giftId,
    int quantity = 1,
    required String idempotencyKey,
  }) async {
    final payload = {
      'senderId': senderId,
      'senderName': senderName,
      'receiverSide': receiverSide,
      'giftId': giftId,
      'quantity': quantity,
      'idempotencyKey': idempotencyKey,
    };

    final res = await _client.post(
      '/api/pk/battle/$battleId/gifts/send',
      body: payload,
    );

    if (res.isSuccess && res.data is Map) {
      return ApiResponse.success(
        res.data as Map<String, dynamic>,
        statusCode: res.statusCode,
      );
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to send PK gift.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 15. Retrieve user wallet coin & diamond balance
  Future<ApiResponse<PkUserWallet>> getGiftWallet(
    String battleId, {
    String? userId,
  }) async {
    final queryParams = <String, dynamic>{};
    if (userId != null && userId.isNotEmpty) {
      queryParams['userId'] = userId;
    }

    final res = await _client.get(
      '/api/pk/battle/$battleId/gifts/wallet',
      queryParameters: queryParams,
    );

    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final walletData = map['wallet'] as Map<String, dynamic>? ?? {};
      return ApiResponse.success(
        PkUserWallet.fromJson(walletData),
        statusCode: res.statusCode,
      );
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve wallet balance.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 16. Retrieve recent gift transaction history for PK battle
  Future<ApiResponse<List<PkGiftTransaction>>> getGiftTransactions(
    String battleId, {
    int limit = 20,
  }) async {
    final res = await _client.get(
      '/api/pk/battle/$battleId/gifts/transactions',
      queryParameters: {'limit': limit.toString()},
    );

    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawList = map['transactions'] as List<dynamic>? ?? [];
      final list = rawList
          .map((t) => PkGiftTransaction.fromJson(t as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(list, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve gift transactions.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }

  /// 17. Retrieve host past PK battle history
  Future<ApiResponse<List<PkBattleHistory>>> getBattleHistory({
    String? hostId,
  }) async {
    final queryParams = <String, dynamic>{};
    if (hostId != null && hostId.isNotEmpty) {
      queryParams['hostId'] = hostId;
    }

    final res = await _client.get(
      '/api/pk/history',
      queryParameters: queryParams,
    );

    if (res.isSuccess && res.data is Map) {
      final map = res.data as Map<String, dynamic>;
      final rawList = map['history'] as List<dynamic>? ?? [];
      final history = rawList
          .map((h) => PkBattleHistory.fromJson(h as Map<String, dynamic>))
          .toList();
      return ApiResponse.success(history, statusCode: res.statusCode);
    }

    return ApiResponse.failure(
      res.errorMessage ?? 'Failed to retrieve PK history.',
      statusCode: res.statusCode,
      errorCode: res.errorCode,
    );
  }
}
