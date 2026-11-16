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
}
