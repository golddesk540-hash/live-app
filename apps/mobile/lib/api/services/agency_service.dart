import '../api_client.dart';
import '../api_response.dart';

/// Service managing agency collective, registration, and host member management
class AgencyService {
  final ApiClient _client;

  AgencyService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  static final AgencyService instance = AgencyService();

  /// Fetches agency info for current user (admin or member status)
  Future<ApiResponse<dynamic>> getAgencyInfo() async {
    return _client.get('/api/agency');
  }

  /// Submits agency registration (status: pending administrator review)
  Future<ApiResponse<dynamic>> registerAgency({
    required String name,
    String? description,
    String? contactEmail,
    String? contactPhone,
  }) async {
    return _client.post(
      '/api/agency/register',
      body: {
        'name': name,
        if (description != null) 'description': description,
        if (contactEmail != null) 'contactEmail': contactEmail,
        if (contactPhone != null) 'contactPhone': contactPhone,
      },
    );
  }

  /// Submits host join request to an agency
  Future<ApiResponse<dynamic>> requestJoinAgency(String agencyCodeOrId) async {
    return _client.post(
      '/api/agency/join',
      body: {'agencyCode': agencyCodeOrId},
    );
  }

  /// Fetches agency members list
  Future<ApiResponse<dynamic>> getAgencyMembers({
    required String agencyId,
    String? statusFilter,
    String? search,
  }) async {
    final queryParams = <String, String>{'agencyId': agencyId};
    if (statusFilter != null && statusFilter != 'All') queryParams['status'] = statusFilter;
    if (search != null && search.trim().isNotEmpty) queryParams['search'] = search.trim();

    return _client.get(
      '/api/agency/members',
      queryParameters: queryParams,
    );
  }

  /// Approves pending host member (Agency Admin only)
  Future<ApiResponse<dynamic>> approveMember({
    required String agencyId,
    required String memberId,
  }) async {
    return _client.post(
      '/api/agency/members/$memberId/approve',
      body: {'agencyId': agencyId},
    );
  }

  /// Rejects pending host member (Agency Admin only)
  Future<ApiResponse<dynamic>> rejectMember({
    required String agencyId,
    required String memberId,
  }) async {
    return _client.post(
      '/api/agency/members/$memberId/reject',
      body: {'agencyId': agencyId},
    );
  }

  /// Removes host member from agency (Agency Admin only)
  Future<ApiResponse<dynamic>> removeMember({
    required String agencyId,
    required String memberId,
  }) async {
    return _client.delete(
      '/api/agency/members/$memberId',
      queryParameters: {'agencyId': agencyId},
    );
  }
}
