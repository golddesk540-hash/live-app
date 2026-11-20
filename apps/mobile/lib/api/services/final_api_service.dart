import '../api_client.dart';
import '../api_response.dart';

/// Popo Live — Phase 7 (P7-P11) FINAL
/// Mobile API Service for Business Centers, Support, Settings & Profiles
class FinalApiService {
  FinalApiService._();
  static final FinalApiService instance = FinalApiService._();

  final ApiClient _client = ApiClient.instance;

  // ===========================================================================
  // STREAMER CENTER
  // ===========================================================================

  /// Fetches streamer tasks for today
  Future<ApiResponse<dynamic>> fetchStreamerTasks() async {
    return _client.get('/api/streamer/tasks');
  }

  /// Claims streamer task rewards (atomic coin credit via P7-P7 ledger)
  Future<ApiResponse<dynamic>> claimStreamerTask(
    String taskId, {
    String? idempotencyKey,
  }) async {
    final headers = <String, String>{};
    if (idempotencyKey != null) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return _client.post(
      '/api/streamer/tasks/$taskId/claim',
      headers: headers,
    );
  }

  /// Fetches streamer host level progress
  Future<ApiResponse<dynamic>> fetchStreamerLevel() async {
    return _client.get('/api/streamer/level');
  }

  /// Fetches starter pack configuration and claim status
  Future<ApiResponse<dynamic>> fetchStreamerStarterPack() async {
    return _client.get('/api/streamer/starter-pack');
  }

  /// Fetches streamer paginated earnings
  Future<ApiResponse<dynamic>> fetchStreamerEarnings({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get('/api/streamer/earnings?page=$page&limit=$limit');
  }

  /// Saves earning identity / KYC documents
  Future<ApiResponse<dynamic>> saveEarningIdentity(
    Map<String, dynamic> data,
  ) async {
    return _client.post(
      '/api/streamer/identity',
      body: data,
    );
  }

  /// Checks broadcaster go-live eligibility
  Future<ApiResponse<dynamic>> fetchGoLiveEligibility() async {
    return _client.get('/api/streamer/go-live-eligibility');
  }

  // ===========================================================================
  // BUILDER CENTER
  // ===========================================================================

  /// Fetches agency overview for builder
  Future<ApiResponse<dynamic>> fetchBuilderAgency() async {
    return _client.get('/api/builder/agency');
  }

  /// Fetches members belonging to the agency
  Future<ApiResponse<dynamic>> fetchAgencyMembers() async {
    return _client.get('/api/builder/agency/members');
  }

  /// Adds a new host to agency (Owner only)
  Future<ApiResponse<dynamic>> addAgencyMember(
    String hostUserId, {
    String? agencyId,
  }) async {
    return _client.post(
      '/api/builder/agency/members',
      body: {
        'hostUserId': hostUserId,
        if (agencyId != null) 'agencyId': agencyId,
      },
    );
  }

  /// Removes a host from agency (Owner only)
  Future<ApiResponse<dynamic>> removeAgencyMember(
    String memberId, {
    String? agencyId,
  }) async {
    return _client.delete(
      '/api/builder/agency/members/$memberId',
      queryParameters: {
        if (agencyId != null) 'agencyId': agencyId,
      },
    );
  }

  /// Fetches designated coin seller for agency
  Future<ApiResponse<dynamic>> fetchCoinSeller() async {
    return _client.get('/api/builder/coin-seller');
  }

  /// Assigns designated coin seller for agency (Owner only)
  Future<ApiResponse<dynamic>> assignCoinSeller(
    String targetUserId, {
    String? agencyId,
  }) async {
    return _client.post(
      '/api/builder/coin-seller/assign',
      body: {
        'targetUserId': targetUserId,
        if (agencyId != null) 'agencyId': agencyId,
      },
    );
  }

  /// Requests coin withdrawal (atomic debit via P7-P7 ledger)
  Future<ApiResponse<dynamic>> requestWithdrawal(
    int amount, {
    String? payoutMethodId,
    String? idempotencyKey,
  }) async {
    final headers = <String, String>{};
    if (idempotencyKey != null) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return _client.post(
      '/api/builder/withdrawal',
      headers: headers,
      body: {
        'amount': amount,
        if (payoutMethodId != null) 'payoutMethodId': payoutMethodId,
        if (idempotencyKey != null) 'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Fetches past withdrawal request history
  Future<ApiResponse<dynamic>> fetchWithdrawalHistory({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get('/api/builder/withdrawal/history?page=$page&limit=$limit');
  }

  // ===========================================================================
  // HELP CENTER & SUPPORT
  // ===========================================================================

  /// Fetches help topics and knowledge base articles
  Future<ApiResponse<dynamic>> fetchHelpTopics() async {
    return _client.get('/api/help/topics');
  }

  /// Fetches a specific help article by ID or slug
  Future<ApiResponse<dynamic>> fetchHelpTopicDetail(String idOrSlug) async {
    return _client.get('/api/help/topics/$idOrSlug');
  }

  /// Submits a new support ticket
  Future<ApiResponse<dynamic>> createSupportTicket(
    Map<String, dynamic> ticketData,
  ) async {
    return _client.post(
      '/api/help/tickets',
      body: ticketData,
    );
  }

  /// Fetches caller's support tickets
  Future<ApiResponse<dynamic>> fetchUserTickets() async {
    return _client.get('/api/help/tickets');
  }

  /// Fetches ticket detail and messages (scoped to user)
  Future<ApiResponse<dynamic>> fetchTicketDetail(String ticketId) async {
    return _client.get('/api/help/tickets/$ticketId');
  }

  /// Appends a new reply to the ticket thread
  Future<ApiResponse<dynamic>> sendTicketMessage(
    String ticketId,
    String message, {
    String? attachmentUrl,
  }) async {
    return _client.post(
      '/api/help/tickets/$ticketId/messages',
      body: {
        'message': message,
        if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
      },
    );
  }

  // ===========================================================================
  // SETTINGS & PROFILES
  // ===========================================================================

  /// Fetches user preferences, notifications, and privacy settings
  Future<ApiResponse<dynamic>> fetchSettings() async {
    return _client.get('/api/settings');
  }

  /// Updates user preferences, notifications, and language
  Future<ApiResponse<dynamic>> updateSettings(
    Map<String, dynamic> updates,
  ) async {
    return _client.patch(
      '/api/settings',
      body: updates,
    );
  }

  /// Fetches list of users blocked by caller
  Future<ApiResponse<dynamic>> fetchBlockedUsers() async {
    return _client.get('/api/settings/blocked');
  }

  /// Blocks a user (impacts Message and Party access)
  Future<ApiResponse<dynamic>> blockUser(String targetUserId) async {
    return _client.post('/api/settings/blocked/$targetUserId');
  }

  /// Unblocks a user
  Future<ApiResponse<dynamic>> unblockUser(String targetUserId) async {
    return _client.delete('/api/settings/blocked/$targetUserId');
  }

  /// Logs out and revokes active session
  Future<ApiResponse<dynamic>> logout() async {
    return _client.post('/api/settings/logout');
  }

  /// Soft deletes user account preserving audit logs
  Future<ApiResponse<dynamic>> closeAccount({String? reason}) async {
    return _client.post(
      '/api/settings/close-account',
      body: {
        if (reason != null) 'reason': reason,
      },
    );
  }

  /// Fetches current user's full private profile
  Future<ApiResponse<dynamic>> fetchMyProfile() async {
    return _client.get('/api/profiles/me');
  }

  /// Updates current user's profile information
  Future<ApiResponse<dynamic>> updateMyProfile(
    Map<String, dynamic> updates,
  ) async {
    return _client.patch(
      '/api/profiles/me',
      body: updates,
    );
  }

  /// Fetches public profile for another user (private fields stripped)
  Future<ApiResponse<dynamic>> fetchPublicProfile(String targetUserId) async {
    return _client.get('/api/profiles/$targetUserId');
  }

  /// Updates user profile avatar URL
  Future<ApiResponse<dynamic>> updateAvatar(String avatarUrl) async {
    return _client.post(
      '/api/profiles/me/avatar',
      body: {'avatarUrl': avatarUrl},
    );
  }
}
