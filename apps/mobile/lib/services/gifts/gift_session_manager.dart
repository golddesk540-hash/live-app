import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../models/gifts/gift_models.dart';
import 'gift_service.dart';

/// Centralized Gift Session Manager for Popo Live
/// Coordinates Virtual Gift Catalog, Category Filtering, Balance Synchronization,
/// Pre-Send Quote Validation, Real-Time Animations, and Host 70% Earnings Integration
class GiftSessionManager extends ChangeNotifier {
  final GiftService _service;

  GiftSessionManager({GiftService? service}) : _service = service ?? GiftService.instance;

  static final GiftSessionManager instance = GiftSessionManager();

  // State Variables
  List<GiftCategory> _categories = [];
  List<GiftCategory> get categories => _categories;

  List<GiftItem> _allGifts = [];
  List<GiftItem> get allGifts => _allGifts;

  String _selectedCategorySlug = 'all';
  String get selectedCategorySlug => _selectedCategorySlug;

  String _searchQuery = '';
  String get searchQuery => _searchQuery;

  GiftItem? _selectedGift;
  GiftItem? get selectedGift => _selectedGift;

  int _availableCoins = 12500;
  int get availableCoins => _availableCoins;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isSending = false;
  bool get isSending => _isSending;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  HostEarningsDashboard? _hostEarnings;
  HostEarningsDashboard? get hostEarnings => _hostEarnings;

  List<GiftTransactionHistoryItem> _transactionHistory = [];
  List<GiftTransactionHistoryItem> get transactionHistory => _transactionHistory;

  // Real-Time Universal Floating Gift Animation Stream
  final StreamController<UniversalGiftAnimationEvent> _animationController =
      StreamController<UniversalGiftAnimationEvent>.broadcast();
  Stream<UniversalGiftAnimationEvent> get animationStream => _animationController.stream;

  UniversalGiftAnimationEvent? _lastAnimation;
  UniversalGiftAnimationEvent? get lastAnimation => _lastAnimation;

  StreamSubscription? _sseSubscription;

  /// Filtered gifts based on selected category and search query
  List<GiftItem> get filteredGifts {
    var list = _allGifts;

    // Filter by Category
    if (_selectedCategorySlug != 'all') {
      if (_selectedCategorySlug == 'popular') {
        list = list.where((g) => g.isPopular || g.usageCount >= 5000).toList();
      } else if (_selectedCategorySlug == 'animated') {
        list = list.where((g) => g.hasAnimation || g.giftType == 'animated').toList();
      } else {
        list = list.where((g) => g.categoryId == _selectedCategorySlug).toList();
      }
    }

    // Filter by Search Query
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.trim().toLowerCase();
      list = list.where((g) =>
          g.name.toLowerCase().contains(q) ||
          g.nameUr.toLowerCase().contains(q) ||
          (g.categoryName ?? '').toLowerCase().contains(q)).toList();
    }

    return list;
  }

  /// 1. Load Catalog & Categories
  Future<void> loadCatalog({String? userId, bool previewDemo = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final res = await _service.getCatalog(
      userId: userId,
      previewDemo: previewDemo,
      limit: 50,
    );

    if (res.isSuccess && res.data != null) {
      _allGifts = (res.data!['gifts'] as List<GiftItem>?) ?? [];
      _categories = (res.data!['categories'] as List<GiftCategory>?) ?? [];
      if (res.data!['viewerCoinBalance'] != null) {
        _availableCoins = res.data!['viewerCoinBalance'] as int;
      }
      if (_selectedGift == null && _allGifts.isNotEmpty) {
        _selectedGift = _allGifts.first;
      }
    } else {
      _errorMessage = res.errorMessage;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// 2. Select Category Filter
  void selectCategory(String categorySlug) {
    if (_selectedCategorySlug != categorySlug) {
      _selectedCategorySlug = categorySlug;
      notifyListeners();
    }
  }

  /// 3. Update Search Query
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  /// 4. Select Gift Item
  void selectGift(GiftItem gift) {
    _selectedGift = gift;
    notifyListeners();
  }

  /// 5. Request Pre-Send Quote with Server-Side Validation
  Future<GiftSendQuote?> previewQuote({
    required String giftId,
    int quantity = 1,
    required String recipientHostId,
    String? liveRoomId,
    String? pkBattleId,
    String? userId,
    bool previewDemo = false,
  }) async {
    final res = await _service.previewGift(
      giftId: giftId,
      quantity: quantity,
      recipientHostId: recipientHostId,
      liveRoomId: liveRoomId,
      pkBattleId: pkBattleId,
      userId: userId,
      previewDemo: previewDemo,
    );

    if (res.isSuccess && res.data != null) {
      _availableCoins = res.data!.currentCoinBalance;
      notifyListeners();
      return res.data;
    }

    _errorMessage = res.errorMessage;
    notifyListeners();
    return null;
  }

  /// 6. Execute Confirmed Gift Send Transaction
  Future<GiftTransactionResult?> sendGift({
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
    _isSending = true;
    _errorMessage = null;
    notifyListeners();

    final key = idempotencyKey ??
        'mob_gft_${DateTime.now().millisecondsSinceEpoch}_$giftId';

    final res = await _service.sendGift(
      giftId: giftId,
      quantity: quantity,
      recipientHostId: recipientHostId,
      liveRoomId: liveRoomId,
      pkBattleId: pkBattleId,
      senderUserId: senderUserId,
      senderNickname: senderNickname,
      idempotencyKey: key,
      previewDemo: previewDemo,
    );

    _isSending = false;

    if (res.isSuccess && res.data != null) {
      final tx = res.data!;
      if (tx.remainingCoins != null) {
        _availableCoins = tx.remainingCoins!;
      }

      // Trigger local floating animation banner
      final animEvent = UniversalGiftAnimationEvent(
        giftId: tx.giftId,
        giftName: tx.giftName,
        senderNickname: tx.senderNickname,
        recipientNickname: tx.recipientNickname,
        quantity: tx.quantity,
        totalCoins: tx.totalCoins,
        hostPointsCredited: tx.hostPointsCredited,
        imageUrl: tx.imageUrl,
        animationUrl: tx.animationUrl,
      );

      _lastAnimation = animEvent;
      _animationController.add(animEvent);

      notifyListeners();
      return tx;
    }

    _errorMessage = res.errorMessage;
    notifyListeners();
    return null;
  }

  /// 7. Load Host Earnings Dashboard (Server-Authoritative 70% rule)
  Future<void> loadHostEarnings({String? hostUserId, bool previewDemo = true}) async {
    final res = await _service.getHostEarnings(
      hostUserId: hostUserId,
      previewDemo: previewDemo,
    );

    if (res.isSuccess && res.data != null) {
      _hostEarnings = res.data;
      notifyListeners();
    }
  }

  /// 8. Load Gift Transaction History
  Future<void> loadTransactionHistory({String? userId}) async {
    final res = await _service.getTransactions(userId: userId, limit: 30);
    if (res.isSuccess && res.data != null) {
      _transactionHistory = res.data!;
      notifyListeners();
    }
  }

  /// 9. Connect to Live Room SSE for Real-Time Incoming Gifts
  void startListeningToRoomGifts(String roomId) {
    _sseSubscription?.cancel();
    _sseSubscription = _service.listenToLiveGiftEvents(roomId).listen(
      (eventData) {
        if (eventData['event'] == 'gift:sent' || eventData['event'] == 'gift:received') {
          final data = eventData['data'] as Map<String, dynamic>? ?? {};
          final anim = UniversalGiftAnimationEvent(
            giftId: data['giftId']?.toString() ?? 'gift',
            giftName: data['giftName']?.toString() ?? 'Gift',
            senderNickname: data['senderNickname']?.toString() ?? 'Viewer',
            recipientNickname: data['recipientNickname']?.toString() ?? 'Host',
            quantity: (data['quantity'] as num?)?.toInt() ?? 1,
            totalCoins: (data['totalCoins'] as num?)?.toInt() ?? 10,
            hostPointsCredited: (data['hostPointsCredited'] as num?)?.toInt() ?? 7,
            imageUrl: data['imageUrl']?.toString(),
            animationUrl: data['animationUrl']?.toString(),
          );
          _lastAnimation = anim;
          _animationController.add(anim);
          notifyListeners();
        }
      },
      onError: (_) {
        // Handled gracefully
      },
    );
  }

  /// Stop listening to room SSE
  void stopListeningToRoomGifts() {
    _sseSubscription?.cancel();
    _sseSubscription = null;
  }

  /// Directly trigger animation (e.g. from local tests or mock events)
  void triggerGiftAnimation(UniversalGiftAnimationEvent event) {
    _lastAnimation = event;
    _animationController.add(event);
    notifyListeners();
  }

  /// Teardown and Cleanup
  @override
  void dispose() {
    _sseSubscription?.cancel();
    _animationController.close();
    super.dispose();
  }
}
