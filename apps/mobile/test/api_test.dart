import 'package:flutter_test/flutter_test.dart';
import 'package:popo_live/api/api.dart';

void main() {
  group('ApiConfig Tests', () {
    test('Default environment is production targeting kigolive.com', () {
      ApiConfig.setEnvironment(ApiEnvironment.production);
      ApiConfig.setCustomBaseUrl(null);
      expect(ApiConfig.baseUrl, equals('https://kigolive.com'));
    });

    test('Custom base URL overrides environment base URL', () {
      ApiConfig.setCustomBaseUrl('http://192.168.1.100:3000');
      expect(ApiConfig.baseUrl, equals('http://192.168.1.100:3000'));

      // Resets properly
      ApiConfig.setCustomBaseUrl(null);
      expect(ApiConfig.baseUrl, equals('https://kigolive.com'));
    });

    test('User-Agent contains PopoLive-Mobile signature and version', () {
      final ua = ApiConfig.userAgent;
      expect(ua, contains('PopoLive-Mobile/1.0.0'));
    });
  });

  group('ApiClient URI & Query Builder Tests', () {
    test('buildUri formats paths and query strings accurately', () {
      final client = ApiClient();
      final uri = client.buildUri('/api/discovery/explore', {
        'page': 1,
        'limit': 12,
        'country': 'PK',
      });

      expect(uri.path, equals('/api/discovery/explore'));
      expect(uri.queryParameters['page'], equals('1'));
      expect(uri.queryParameters['limit'], equals('12'));
      expect(uri.queryParameters['country'], equals('PK'));
    });

    test('buildUri filters null query parameters safely', () {
      final client = ApiClient();
      final uri = client.buildUri('/api/discovery/explore', {
        'page': 2,
        'category': null,
      });

      expect(uri.queryParameters.containsKey('category'), isFalse);
      expect(uri.queryParameters['page'], equals('2'));
    });
  });

  group('ApiResponse Model Tests', () {
    test('ApiResponse.success stores payload and sets isSuccess to true', () {
      final response = ApiResponse<Map<String, dynamic>>.success(
        {'id': '123', 'nickname': 'TestUser'},
        statusCode: 200,
        message: 'Success',
      );

      expect(response.isSuccess, isTrue);
      expect(response.statusCode, equals(200));
      expect(response.data?['nickname'], equals('TestUser'));
      expect(response.message, equals('Success'));
    });

    test('ApiResponse.failure categorizes status codes correctly', () {
      final unauthorized = ApiResponse.failure(
        'Session expired',
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
      );
      expect(unauthorized.isSuccess, isFalse);
      expect(unauthorized.isUnauthorized, isTrue);

      final forbidden = ApiResponse.failure(
        'Terms not accepted',
        statusCode: 403,
        errorCode: 'TERMS_NOT_ACCEPTED',
      );
      expect(forbidden.isForbidden, isTrue);

      final serverError = ApiResponse.failure(
        'Internal Server Error',
        statusCode: 500,
        errorCode: 'SERVER_ERROR',
      );
      expect(serverError.isServerError, isTrue);
    });

    test('ApiResponse handles 502 Bad Gateway gracefully', () {
      final badGateway = ApiResponse.fromException(
        const ServerException(
          message:
              'Backend service is temporarily unavailable (502 Bad Gateway).',
          statusCode: 502,
          code: 'BAD_GATEWAY',
        ),
      );

      expect(badGateway.isSuccess, isFalse);
      expect(badGateway.statusCode, equals(502));
      expect(badGateway.isServerError, isTrue);
      expect(badGateway.errorCode, equals('BAD_GATEWAY'));
    });
  });

  group('Service Architecture Method Signature Tests', () {
    test('Services can be instantiated with default or custom client', () {
      final authService = AuthService();
      final profileService = ProfileService();
      final discoveryService = DiscoveryService();
      final countryService = CountryService();
      final bannerService = BannerService();
      final rankingsService = RankingsService();
      final roomService = RoomService();

      expect(authService, isNotNull);
      expect(profileService, isNotNull);
      expect(discoveryService, isNotNull);
      expect(countryService, isNotNull);
      expect(bannerService, isNotNull);
      expect(rankingsService, isNotNull);
      expect(roomService, isNotNull);
    });
  });
}
