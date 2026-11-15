import '../api_client.dart';
import '../api_response.dart';

/// Service managing hero promotional banners and campaign links
class BannerService {
  final ApiClient _client;

  BannerService({ApiClient? client}) : _client = client ?? ApiClient.instance;

  /// Fetches active promotional banners for the mobile explore header
  Future<ApiResponse<dynamic>> getBanners({
    int limit = 10,
    bool all = false,
  }) async {
    return _client.get(
      '/api/discovery/banners',
      queryParameters: {'limit': limit, if (all) 'all': 'true'},
    );
  }

  /// Records user click interaction for analytics
  Future<ApiResponse<dynamic>> recordBannerClick(String bannerId) async {
    return _client.post('/api/discovery/banners/$bannerId/click');
  }
}
