import '../api_client.dart';
import '../api_response.dart';

/// Service managing country selection, live counts, and popular regions
class CountryService {
  final ApiClient _client;

  CountryService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Fetches available country filters with active room statistics
  Future<ApiResponse<dynamic>> getCountries({String? search}) async {
    return _client.get(
      '/api/discovery/countries',
      queryParameters: {if (search != null && search.isNotEmpty) 'q': search},
    );
  }

  /// Fetches top trending countries with active broadcasters
  Future<ApiResponse<dynamic>> getPopularCountries() async {
    return _client.get('/api/discovery/countries/popular');
  }
}
