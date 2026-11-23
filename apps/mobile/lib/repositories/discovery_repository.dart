import 'dart:async';

import '../api/api.dart';
import '../models/models.dart';

/// Centralized repository orchestrating caching, deduplication, pagination,
/// and safe model parsing for Discovery feeds
class DiscoveryRepository {
  static final DiscoveryRepository instance = DiscoveryRepository();

  final DiscoveryService _discoveryService;
  final BannerService _bannerService;
  final CountryService _countryService;
  final RankingsService _rankingsService;
  final RoomService _roomService;

  DiscoveryRepository({
    DiscoveryService? discoveryService,
    BannerService? bannerService,
    CountryService? countryService,
    RankingsService? rankingsService,
    RoomService? roomService,
  }) : _discoveryService = discoveryService ?? DiscoveryService(),
       _bannerService = bannerService ?? BannerService(),
       _countryService = countryService ?? CountryService(),
       _rankingsService = rankingsService ?? RankingsService(),
       _roomService = roomService ?? RoomService();

  // In-memory caches
  List<DiscoveryRoom> _cachedExplore = [];
  List<DiscoveryRoom> _cachedFollowing = [];
  List<DiscoveryRoom> _cachedForYou = [];
  List<DiscoveryRoom> _cachedNew = [];
  List<DiscoveryRoom> _cachedPk = [];
  List<DiscoveryBanner> _cachedBanners = [];
  List<DiscoveryCountry> _cachedCountries = [];
  RankingsPreviewResult? _cachedRankings;
  List<RankingDoor> _cachedDoors = [];

  // Pagination for Explore Feed
  int _explorePage = 1;
  int _exploreTotalPages = 1;
  bool _hasMoreExplore = true;
  bool _isLoadingExplore = false;
  bool _isLoadingMoreExplore = false;

  // Inflight request guards
  bool _isLoadingFollowing = false;
  bool _isLoadingForYou = false;
  bool _isLoadingNew = false;
  bool _isLoadingPk = false;

  // Active filter state
  String _activeCountryCode = 'ALL';

  // Getters
  List<DiscoveryRoom> get exploreRooms => List.unmodifiable(_cachedExplore);
  List<DiscoveryRoom> get followingRooms => List.unmodifiable(_cachedFollowing);
  List<DiscoveryRoom> get forYouRooms => List.unmodifiable(_cachedForYou);
  List<DiscoveryRoom> get newRooms => List.unmodifiable(_cachedNew);
  List<DiscoveryRoom> get pkRooms => List.unmodifiable(_cachedPk);
  List<DiscoveryBanner> get banners => List.unmodifiable(_cachedBanners);
  List<DiscoveryCountry> get countries => List.unmodifiable(_cachedCountries);
  RankingsPreviewResult? get rankings => _cachedRankings;
  List<RankingDoor> get doors => List.unmodifiable(_cachedDoors);

  bool get hasMoreExplore => _hasMoreExplore;
  bool get isLoadingExplore => _isLoadingExplore;
  bool get isLoadingMoreExplore => _isLoadingMoreExplore;
  String get activeCountryCode => _activeCountryCode;

  // ==========================================
  // 1. EXPLORE FEED (Paginated & Filterable)
  // ==========================================
  Future<List<DiscoveryRoom>> fetchExplore({
    bool refresh = false,
    String? countryCode,
  }) async {
    final effectiveCountry = countryCode ?? _activeCountryCode;
    final isNewCountry = effectiveCountry != _activeCountryCode;

    if (refresh || isNewCountry) {
      _explorePage = 1;
      _hasMoreExplore = true;
      _activeCountryCode = effectiveCountry;
    } else if (!_hasMoreExplore || _isLoadingExplore) {
      return _cachedExplore;
    }

    _isLoadingExplore = true;

    try {
      final response = await _discoveryService.getExplore(
        page: 1,
        limit: 12,
        country: _activeCountryCode == 'ALL' ? null : _activeCountryCode,
      );

      if (response.isSuccess && response.data is Map) {
        final list = response.data['rooms'] as List?;
        final parsedRooms = list != null
            ? list
                  .map(
                    (r) => DiscoveryRoom.fromJson(
                      Map<String, dynamic>.from(r as Map),
                    ),
                  )
                  .toList()
            : <DiscoveryRoom>[];

        final pagination = response.data['pagination'] is Map
            ? PaginationMetadata.fromJson(
                Map<String, dynamic>.from(response.data['pagination'] as Map),
              )
            : null;

        _explorePage = 1;
        _exploreTotalPages = pagination?.totalPages ?? 1;
        _hasMoreExplore =
            pagination?.hasMore ?? (_explorePage < _exploreTotalPages);
        _cachedExplore = parsedRooms;
        return _cachedExplore;
      } else {
        throw ApiException(
          message: response.message ?? 'Failed to load explore feed',
          statusCode: response.statusCode,
          code: response.errorCode,
        );
      }
    } finally {
      _isLoadingExplore = false;
    }
  }

  /// Loads next page of live rooms for infinite scrolling
  Future<List<DiscoveryRoom>> loadMoreExplore() async {
    if (!_hasMoreExplore || _isLoadingMoreExplore || _isLoadingExplore) {
      return _cachedExplore;
    }

    _isLoadingMoreExplore = true;
    final nextPage = _explorePage + 1;

    try {
      final response = await _discoveryService.getExplore(
        page: nextPage,
        limit: 12,
        country: _activeCountryCode == 'ALL' ? null : _activeCountryCode,
      );

      if (response.isSuccess && response.data is Map) {
        final list = response.data['rooms'] as List?;
        final newRooms = list != null
            ? list
                  .map(
                    (r) => DiscoveryRoom.fromJson(
                      Map<String, dynamic>.from(r as Map),
                    ),
                  )
                  .toList()
            : <DiscoveryRoom>[];

        final pagination = response.data['pagination'] is Map
            ? PaginationMetadata.fromJson(
                Map<String, dynamic>.from(response.data['pagination'] as Map),
              )
            : null;

        _explorePage = nextPage;
        _exploreTotalPages = pagination?.totalPages ?? _exploreTotalPages;
        _hasMoreExplore =
            pagination?.hasMore ?? (_explorePage < _exploreTotalPages);

        // Deduplicate rooms by ID
        final existingIds = _cachedExplore.map((r) => r.id).toSet();
        for (final r in newRooms) {
          if (!existingIds.contains(r.id)) {
            _cachedExplore.add(r);
            existingIds.add(r.id);
          }
        }
        return _cachedExplore;
      }
      return _cachedExplore;
    } finally {
      _isLoadingMoreExplore = false;
    }
  }

  // ==========================================
  // 2. FOLLOWING FEED
  // ==========================================
  Future<List<DiscoveryRoom>> fetchFollowing({bool refresh = false}) async {
    if (!refresh && _cachedFollowing.isNotEmpty) {
      return _cachedFollowing;
    }
    if (_isLoadingFollowing) return _cachedFollowing;

    _isLoadingFollowing = true;
    try {
      final response = await _discoveryService.getFollowing();
      if (response.isSuccess && response.data is Map) {
        final list =
            (response.data['liveRooms'] ?? response.data['rooms']) as List?;
        _cachedFollowing = list != null
            ? list
                  .map(
                    (r) => DiscoveryRoom.fromJson(
                      Map<String, dynamic>.from(r as Map),
                    ),
                  )
                  .toList()
            : <DiscoveryRoom>[];
        return _cachedFollowing;
      } else {
        throw ApiException(
          message: response.message ?? 'Failed to load following feed',
          statusCode: response.statusCode,
          code: response.errorCode,
        );
      }
    } finally {
      _isLoadingFollowing = false;
    }
  }

  // ==========================================
  // FOR YOU FEED (Curated & Deterministic)
  // ==========================================
  Future<List<DiscoveryRoom>> fetchForYou({bool refresh = false}) async {
    if (!refresh && _cachedForYou.isNotEmpty) {
      return _cachedForYou;
    }
    if (_isLoadingForYou) return _cachedForYou;

    _isLoadingForYou = true;
    try {
      final response = await _discoveryService.getForYou();
      if (response.isSuccess && response.data is Map) {
        final list = (response.data['rooms'] ?? response.data['liveRooms']) as List?;
        _cachedForYou = list != null
            ? list
                .map((r) => DiscoveryRoom.fromJson(Map<String, dynamic>.from(r as Map)))
                .toList()
            : <DiscoveryRoom>[];
        return _cachedForYou;
      } else {
        throw ApiException(
          message: response.message ?? 'Failed to load For You feed',
          statusCode: response.statusCode,
          code: response.errorCode,
        );
      }
    } finally {
      _isLoadingForYou = false;
    }
  }

  // ==========================================
  // 3. NEW CREATORS FEED
  // ==========================================
  Future<List<DiscoveryRoom>> fetchNewCreators({bool refresh = false}) async {
    if (!refresh && _cachedNew.isNotEmpty) {
      return _cachedNew;
    }
    if (_isLoadingNew) return _cachedNew;

    _isLoadingNew = true;
    try {
      final response = await _discoveryService.getNewHosts();
      if (response.isSuccess && response.data is Map) {
        final list =
            (response.data['creators'] ?? response.data['rooms']) as List?;
        _cachedNew = list != null
            ? list
                  .map(
                    (r) => DiscoveryRoom.fromJson(
                      Map<String, dynamic>.from(r as Map),
                    ),
                  )
                  .toList()
            : <DiscoveryRoom>[];
        return _cachedNew;
      } else {
        throw ApiException(
          message: response.message ?? 'Failed to load new creators',
          statusCode: response.statusCode,
          code: response.errorCode,
        );
      }
    } finally {
      _isLoadingNew = false;
    }
  }

  // ==========================================
  // 4. PK BATTLES FEED
  // ==========================================
  Future<List<DiscoveryRoom>> fetchPkBattles({bool refresh = false}) async {
    if (!refresh && _cachedPk.isNotEmpty) {
      return _cachedPk;
    }
    if (_isLoadingPk) return _cachedPk;

    _isLoadingPk = true;
    try {
      final response = await _discoveryService.getPkRooms();
      if (response.isSuccess && response.data is Map) {
        final list =
            (response.data['battles'] ?? response.data['rooms']) as List?;
        _cachedPk = list != null
            ? list
                  .map(
                    (r) => DiscoveryRoom.fromJson(
                      Map<String, dynamic>.from(r as Map),
                    ),
                  )
                  .toList()
            : <DiscoveryRoom>[];
        return _cachedPk;
      } else {
        throw ApiException(
          message: response.message ?? 'Failed to load PK battles',
          statusCode: response.statusCode,
          code: response.errorCode,
        );
      }
    } finally {
      _isLoadingPk = false;
    }
  }

  // ==========================================
  // 5. HERO BANNERS
  // ==========================================
  Future<List<DiscoveryBanner>> fetchBanners({bool refresh = false}) async {
    if (!refresh && _cachedBanners.isNotEmpty) {
      return _cachedBanners;
    }

    final response = await _bannerService.getBanners();
    if (response.isSuccess && response.data is Map) {
      final list = response.data['banners'] as List?;
      _cachedBanners = list != null
          ? list
                .map(
                  (b) => DiscoveryBanner.fromJson(
                    Map<String, dynamic>.from(b as Map),
                  ),
                )
                .toList()
          : <DiscoveryBanner>[];
      return _cachedBanners;
    }
    return _cachedBanners;
  }

  // ==========================================
  // 6. COUNTRIES
  // ==========================================
  Future<List<DiscoveryCountry>> fetchPopularCountries({
    bool refresh = false,
  }) async {
    if (!refresh && _cachedCountries.isNotEmpty) {
      return _cachedCountries;
    }

    try {
      final response = await _countryService.getPopularCountries();
      if (response.isSuccess && response.data is Map) {
        final list = response.data['popular'] as List?;
        if (list != null) {
          _cachedCountries = list
              .map(
                (c) => DiscoveryCountry.fromJson(
                  Map<String, dynamic>.from(c as Map),
                ),
              )
              .toList();
          return _cachedCountries;
        }
      }
      if (ApiConfig.useLiveApi) {
        throw ApiException(
          message: response.message ?? 'Failed to load popular countries',
          statusCode: response.statusCode,
          code: response.errorCode,
        );
      }
    } catch (e) {
      if (ApiConfig.useLiveApi) {
        rethrow;
      }
    }

    // Default fallback popular list for fixture mode
    _cachedCountries = const [
      DiscoveryCountry(code: 'ALL', name: 'Popular', flag: '🔥'),
      DiscoveryCountry(code: 'PK', name: 'Pakistan', flag: '🇵🇰'),
      DiscoveryCountry(code: 'IN', name: 'India', flag: '🇮🇳'),
      DiscoveryCountry(code: 'PH', name: 'Philippines', flag: '🇵🇭'),
      DiscoveryCountry(code: 'US', name: 'United States', flag: '🇺🇸'),
    ];
    return _cachedCountries;
  }

  Future<List<DiscoveryCountry>> fetchCountries({
    String? search,
    bool refresh = false,
  }) async {
    final response = await _countryService.getCountries(search: search);
    if (response.isSuccess && response.data is Map) {
      final list = response.data['countries'] as List?;
      if (list != null) {
        return list
            .map(
              (c) => DiscoveryCountry.fromJson(
                Map<String, dynamic>.from(c as Map),
              ),
            )
            .toList();
      }
    }
    if (ApiConfig.useLiveApi) {
      throw ApiException(
        message: response.message ?? 'Failed to load countries',
        statusCode: response.statusCode,
        code: response.errorCode,
      );
    }
    return const [];
  }

  // ==========================================
  // 7. RANKINGS & DOORS
  // ==========================================
  Future<List<RankingDoor>> fetchRankDoors() async {
    if (_cachedDoors.isNotEmpty) return _cachedDoors;

    final response = await _rankingsService.getRankDoors();
    if (response.isSuccess && response.data is Map) {
      final list = response.data['doors'] as List?;
      if (list != null) {
        _cachedDoors = list
            .map(
              (d) => RankingDoor.fromJson(Map<String, dynamic>.from(d as Map)),
            )
            .toList();
      }
    }
    return _cachedDoors;
  }

  Future<RankingsPreviewResult> fetchRankingsPreview({
    String category = 'host',
    String period = 'monthly',
  }) async {
    final response = await _rankingsService.getRankingsPreview(
      category: category,
      period: period,
    );
    if (response.isSuccess && response.data is Map) {
      _cachedRankings = RankingsPreviewResult.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
      return _cachedRankings!;
    }
    return const RankingsPreviewResult(category: 'host', period: 'monthly');
  }

  // ==========================================
  // 8. ROOM DETAILS
  // ==========================================
  Future<DiscoveryRoom?> fetchRoomDetails(String roomId) async {
    final response = await _roomService.getRoomDetails(roomId);
    if (response.isSuccess && response.data is Map) {
      final roomData = response.data['room'];
      if (roomData is Map) {
        return DiscoveryRoom.fromJson(Map<String, dynamic>.from(roomData));
      }
    }
    return null;
  }

  // ==========================================
  // 9. SEARCH (Host, Nickname, Room Tag)
  // ==========================================
  Future<SearchResultData> search(
    String query, {
    String type = 'all',
    int limit = 20,
  }) async {
    final response = await _discoveryService.search(
      query,
      type: type,
      limit: limit,
    );
    if (response.isSuccess && response.data is Map) {
      return SearchResultData.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } else {
      throw ApiException(
        message: response.message ?? 'Search query failed',
        statusCode: response.statusCode,
        code: response.errorCode,
      );
    }
  }

  /// Clears in-memory caches
  void clearAll() {
    _cachedExplore.clear();
    _cachedFollowing.clear();
    _cachedNew.clear();
    _cachedPk.clear();
    _cachedBanners.clear();
    _cachedCountries.clear();
    _cachedDoors.clear();
    _cachedRankings = null;
    _explorePage = 1;
    _exploreTotalPages = 1;
    _hasMoreExplore = true;
  }
}
