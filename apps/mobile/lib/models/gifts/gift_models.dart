/// Popo Live Phase 3 Module M6: Virtual Gift Data Models
/// Interfaces with verified backend API endpoints:
/// - GET  /api/gifts/catalog
/// - GET  /api/gifts/categories
/// - POST /api/gifts/send/preview
/// - POST /api/gifts/send
/// - GET  /api/gifts/transactions
/// - GET  /api/earnings/dashboard
library gift_models;

/// Virtual Gift Item from the Central Catalog
class GiftItem {
  final String id;
  final String giftId;
  final String name;
  final String nameUr;
  final String description;
  final String descriptionUr;
  final int coinPrice;
  final String categoryId;
  final String? categoryName;
  final String? categoryNameUr;
  final String thumbnailUrl;
  final String imageUrl;
  final String? animationUrl;
  final String assetType; // 'lottie', 'svga', 'png', 'mp4'
  final String giftType; // 'standard', 'animated', 'luxury', 'fullscreen'
  final int usageCount;
  final bool isPopular;
  final bool isNew;
  final bool isFeatured;
  final int displayOrder;
  final bool isActive;
  final int maxQuantity;
  final List<int> allowedQuantities;
  final String fallbackImageUrl;

  const GiftItem({
    required this.id,
    required this.giftId,
    required this.name,
    required this.nameUr,
    required this.description,
    required this.descriptionUr,
    required this.coinPrice,
    required this.categoryId,
    this.categoryName,
    this.categoryNameUr,
    required this.thumbnailUrl,
    required this.imageUrl,
    this.animationUrl,
    this.assetType = 'lottie',
    this.giftType = 'standard',
    this.usageCount = 0,
    this.isPopular = false,
    this.isNew = false,
    this.isFeatured = false,
    this.displayOrder = 0,
    this.isActive = true,
    this.maxQuantity = 99,
    this.allowedQuantities = const [1, 5, 10, 66, 99],
    this.fallbackImageUrl = '/assets/gifts/fallback_gift.png',
  });

  factory GiftItem.fromJson(Map<String, dynamic> json) {
    final rawQty = json['allowedQuantities'] as List<dynamic>?;
    final quantities = rawQty != null
        ? rawQty.map((q) => (q as num).toInt()).toList()
        : const [1, 5, 10, 66, 99];

    return GiftItem(
      id: json['id']?.toString() ?? '',
      giftId: json['giftId']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Gift',
      nameUr: json['nameUr']?.toString() ?? json['name_ur']?.toString() ?? 'تحفہ',
      description: json['description']?.toString() ?? '',
      descriptionUr: json['descriptionUr']?.toString() ?? '',
      coinPrice: (json['coinPrice'] ?? json['coin_price'] as num?)?.toInt() ?? 10,
      categoryId: json['categoryId']?.toString() ?? json['category_id']?.toString() ?? 'basic',
      categoryName: json['categoryName']?.toString(),
      categoryNameUr: json['categoryNameUr']?.toString(),
      thumbnailUrl: json['thumbnailUrl']?.toString() ?? json['thumbnail_url']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? json['image_url']?.toString() ?? '',
      animationUrl: json['animationUrl']?.toString() ?? json['animation_url']?.toString(),
      assetType: json['assetType']?.toString() ?? json['asset_type']?.toString() ?? 'lottie',
      giftType: json['giftType']?.toString() ?? json['gift_type']?.toString() ?? 'standard',
      usageCount: (json['usageCount'] ?? json['usage_count'] as num?)?.toInt() ?? 0,
      isPopular: json['isPopular'] == true,
      isNew: json['isNew'] == true,
      isFeatured: json['isFeatured'] == true,
      displayOrder: (json['displayOrder'] ?? json['display_order'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] != false,
      maxQuantity: (json['maxQuantity'] ?? json['max_quantity'] as num?)?.toInt() ?? 99,
      allowedQuantities: quantities,
      fallbackImageUrl: json['fallbackImageUrl']?.toString() ?? '/assets/gifts/fallback_gift.png',
    );
  }

  bool get hasAnimation => animationUrl != null && animationUrl!.isNotEmpty;
}

/// Virtual Gift Category
class GiftCategory {
  final String categoryId;
  final String name;
  final String nameUr;
  final String shortName;
  final String shortNameUr;
  final String slug;
  final String description;
  final String icon;
  final int displayOrder;
  final bool isActive;
  final bool isVirtualFilter;
  final int giftCount;

  const GiftCategory({
    required this.categoryId,
    required this.name,
    required this.nameUr,
    required this.shortName,
    required this.shortNameUr,
    required this.slug,
    required this.description,
    required this.icon,
    required this.displayOrder,
    this.isActive = true,
    this.isVirtualFilter = false,
    this.giftCount = 0,
  });

  factory GiftCategory.fromJson(Map<String, dynamic> json) {
    return GiftCategory(
      categoryId: json['categoryId']?.toString() ?? json['slug']?.toString() ?? 'all',
      name: json['name']?.toString() ?? 'All',
      nameUr: json['nameUr']?.toString() ?? json['name_ur']?.toString() ?? 'تمام',
      shortName: json['shortName']?.toString() ?? json['name']?.toString() ?? 'All',
      shortNameUr: json['shortNameUr']?.toString() ?? json['nameUr']?.toString() ?? 'تمام',
      slug: json['slug']?.toString() ?? 'all',
      description: json['description']?.toString() ?? '',
      icon: json['icon']?.toString() ?? 'sparkles',
      displayOrder: (json['displayOrder'] ?? json['display_order'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] != false,
      isVirtualFilter: json['isVirtualFilter'] == true,
      giftCount: (json['giftCount'] ?? json['gift_count'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Pre-Send Gift Cost & Balance Validation Quote
class GiftSendQuote {
  final bool valid;
  final String giftId;
  final String giftName;
  final String giftNameUr;
  final String thumbnailUrl;
  final String imageUrl;
  final String? animationUrl;
  final String assetType;
  final String recipientHostId;
  final String recipientNickname;
  final String recipientAvatarUrl;
  final int unitCoinPrice;
  final int quantity;
  final int totalCoinAmount;
  final int currentCoinBalance;
  final int remainingCoinBalance;
  final bool insufficientBalance;
  final int shortfallCoins;
  final int hostPointsToCredit;
  final int platformShareCoins;
  final int sharePercentage; // Exactly 70%

  const GiftSendQuote({
    required this.valid,
    required this.giftId,
    required this.giftName,
    required this.giftNameUr,
    required this.thumbnailUrl,
    required this.imageUrl,
    this.animationUrl,
    required this.assetType,
    required this.recipientHostId,
    required this.recipientNickname,
    required this.recipientAvatarUrl,
    required this.unitCoinPrice,
    required this.quantity,
    required this.totalCoinAmount,
    required this.currentCoinBalance,
    required this.remainingCoinBalance,
    required this.insufficientBalance,
    required this.shortfallCoins,
    required this.hostPointsToCredit,
    required this.platformShareCoins,
    this.sharePercentage = 70,
  });

  factory GiftSendQuote.fromJson(Map<String, dynamic> json) {
    return GiftSendQuote(
      valid: json['valid'] == true,
      giftId: json['giftId']?.toString() ?? '',
      giftName: json['giftName']?.toString() ?? 'Gift',
      giftNameUr: json['giftNameUr']?.toString() ?? 'تحفہ',
      thumbnailUrl: json['thumbnailUrl']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      animationUrl: json['animationUrl']?.toString(),
      assetType: json['assetType']?.toString() ?? 'lottie',
      recipientHostId: json['recipientHostId']?.toString() ?? '',
      recipientNickname: json['recipientNickname']?.toString() ?? 'Host',
      recipientAvatarUrl: json['recipientAvatarUrl']?.toString() ?? '',
      unitCoinPrice: (json['unitCoinPrice'] as num?)?.toInt() ?? 0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      totalCoinAmount: (json['totalCoinAmount'] as num?)?.toInt() ?? 0,
      currentCoinBalance: (json['currentCoinBalance'] as num?)?.toInt() ?? 0,
      remainingCoinBalance: (json['remainingCoinBalance'] as num?)?.toInt() ?? 0,
      insufficientBalance: json['insufficientBalance'] == true,
      shortfallCoins: (json['shortfallCoins'] as num?)?.toInt() ?? 0,
      hostPointsToCredit: (json['hostPointsToCredit'] as num?)?.toInt() ?? 0,
      platformShareCoins: (json['platformShareCoins'] as num?)?.toInt() ?? 0,
      sharePercentage: (json['sharePercentage'] as num?)?.toInt() ?? 70,
    );
  }
}

/// Confirmed Gift Transaction Result returned by POST /api/gifts/send
class GiftTransactionResult {
  final bool success;
  final bool deduplicated;
  final String transactionId;
  final String giftTransactionId;
  final String senderUserId;
  final String senderNickname;
  final String recipientHostId;
  final String recipientNickname;
  final String giftId;
  final String giftName;
  final int unitPrice;
  final int quantity;
  final int totalCoins;
  final int hostPointsCredited;
  final int platformShare;
  final int sharePercentage; // 70%
  final String status;
  final int? remainingCoins;
  final String? thumbnailUrl;
  final String? imageUrl;
  final String? animationUrl;
  final DateTime createdAt;

  const GiftTransactionResult({
    required this.success,
    this.deduplicated = false,
    required this.transactionId,
    required this.giftTransactionId,
    required this.senderUserId,
    required this.senderNickname,
    required this.recipientHostId,
    required this.recipientNickname,
    required this.giftId,
    required this.giftName,
    required this.unitPrice,
    required this.quantity,
    required this.totalCoins,
    required this.hostPointsCredited,
    required this.platformShare,
    this.sharePercentage = 70,
    required this.status,
    this.remainingCoins,
    this.thumbnailUrl,
    this.imageUrl,
    this.animationUrl,
    required this.createdAt,
  });

  factory GiftTransactionResult.fromJson(Map<String, dynamic> json) {
    final tx = json['transaction'] as Map<String, dynamic>? ?? json;
    final wallet = json['updatedSenderWallet'] as Map<String, dynamic>?;

    return GiftTransactionResult(
      success: json['success'] == true,
      deduplicated: json['deduplicated'] == true,
      transactionId: tx['id']?.toString() ?? '',
      giftTransactionId: tx['giftTransactionId']?.toString() ?? '',
      senderUserId: tx['senderUserId']?.toString() ?? '',
      senderNickname: tx['senderNickname']?.toString() ?? 'Supporter',
      recipientHostId: tx['recipientHostId']?.toString() ?? '',
      recipientNickname: tx['recipientNickname']?.toString() ?? 'Host',
      giftId: tx['giftId']?.toString() ?? '',
      giftName: tx['giftNameSnapshot']?.toString() ?? tx['giftName']?.toString() ?? 'Gift',
      unitPrice: (tx['giftPriceSnapshot'] ?? tx['unitPrice'] as num?)?.toInt() ?? 0,
      quantity: (tx['quantity'] as num?)?.toInt() ?? 1,
      totalCoins: (tx['totalCoinAmount'] ?? tx['totalCoins'] as num?)?.toInt() ?? 0,
      hostPointsCredited: (tx['hostPointsCredited'] as num?)?.toInt() ?? 0,
      platformShare: (tx['platformShare'] as num?)?.toInt() ?? 0,
      sharePercentage: (tx['sharePercentage'] as num?)?.toInt() ?? 70,
      status: tx['status']?.toString() ?? 'completed',
      remainingCoins: wallet != null ? (wallet['availableCoins'] as num?)?.toInt() : null,
      thumbnailUrl: tx['thumbnailUrl']?.toString(),
      imageUrl: tx['imageUrl']?.toString(),
      animationUrl: tx['animationUrl']?.toString(),
      createdAt: tx['createdAt'] != null
          ? DateTime.tryParse(tx['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// Historical Gift Transaction Record from GET /api/gifts/transactions
class GiftTransactionHistoryItem {
  final String id;
  final String giftTransactionId;
  final String senderUserId;
  final String senderNickname;
  final String recipientHostId;
  final String recipientNickname;
  final String? liveRoomId;
  final String? pkBattleId;
  final String giftId;
  final String giftName;
  final int unitPrice;
  final int quantity;
  final int totalCoins;
  final int hostPointsCredited;
  final int sharePercentage;
  final String status;
  final String? thumbnailUrl;
  final String? imageUrl;
  final DateTime createdAt;

  const GiftTransactionHistoryItem({
    required this.id,
    required this.giftTransactionId,
    required this.senderUserId,
    required this.senderNickname,
    required this.recipientHostId,
    required this.recipientNickname,
    this.liveRoomId,
    this.pkBattleId,
    required this.giftId,
    required this.giftName,
    required this.unitPrice,
    required this.quantity,
    required this.totalCoins,
    required this.hostPointsCredited,
    required this.sharePercentage,
    required this.status,
    this.thumbnailUrl,
    this.imageUrl,
    required this.createdAt,
  });

  factory GiftTransactionHistoryItem.fromJson(Map<String, dynamic> json) {
    return GiftTransactionHistoryItem(
      id: json['id']?.toString() ?? '',
      giftTransactionId: json['giftTransactionId']?.toString() ?? '',
      senderUserId: json['senderUserId']?.toString() ?? '',
      senderNickname: json['senderNickname']?.toString() ?? 'Supporter',
      recipientHostId: json['recipientHostId']?.toString() ?? '',
      recipientNickname: json['recipientNickname']?.toString() ?? 'Host',
      liveRoomId: json['liveRoomId']?.toString(),
      pkBattleId: json['pkBattleId']?.toString(),
      giftId: json['giftId']?.toString() ?? '',
      giftName: json['giftNameSnapshot']?.toString() ?? json['giftName']?.toString() ?? 'Gift',
      unitPrice: (json['giftPriceSnapshot'] ?? json['unitPrice'] as num?)?.toInt() ?? 0,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      totalCoins: (json['totalCoinAmount'] ?? json['totalCoins'] as num?)?.toInt() ?? 0,
      hostPointsCredited: (json['hostPointsCredited'] as num?)?.toInt() ?? 0,
      sharePercentage: (json['sharePercentage'] as num?)?.toInt() ?? 70,
      status: json['status']?.toString() ?? 'completed',
      thumbnailUrl: json['thumbnailUrl']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// Host Earnings Dashboard from GET /api/earnings/dashboard
class HostEarningsDashboard {
  final String hostUserId;
  final String hostNickname;
  final String hostPoppoId;
  final String hostAvatarUrl;
  final int currentPointsBalance;
  final int totalReceivedPoints;
  final int totalEarnedPointsFromGifts;
  final int todayEarnedPoints;
  final int weeklyEarnedPoints;
  final int monthlyEarnedPoints;
  final int totalGiftCoinsReceived;
  final int totalPlatformShareRecorded;
  final int totalReceivedGiftsCount;
  final int hostSharePercentage; // Exactly 70%
  final int platformSharePercentage; // Exactly 30%
  final String disclaimer;

  const HostEarningsDashboard({
    required this.hostUserId,
    required this.hostNickname,
    required this.hostPoppoId,
    required this.hostAvatarUrl,
    required this.currentPointsBalance,
    required this.totalReceivedPoints,
    required this.totalEarnedPointsFromGifts,
    required this.todayEarnedPoints,
    required this.weeklyEarnedPoints,
    required this.monthlyEarnedPoints,
    required this.totalGiftCoinsReceived,
    required this.totalPlatformShareRecorded,
    required this.totalReceivedGiftsCount,
    this.hostSharePercentage = 70,
    this.platformSharePercentage = 30,
    required this.disclaimer,
  });

  factory HostEarningsDashboard.fromJson(Map<String, dynamic> json) {
    final d = json['dashboard'] as Map<String, dynamic>? ?? json;

    return HostEarningsDashboard(
      hostUserId: d['hostUserId']?.toString() ?? '',
      hostNickname: d['hostNickname']?.toString() ?? 'Host',
      hostPoppoId: d['hostPoppoId']?.toString() ?? '',
      hostAvatarUrl: d['hostAvatarUrl']?.toString() ?? '',
      currentPointsBalance: (d['currentPointsBalance'] as num?)?.toInt() ?? 0,
      totalReceivedPoints: (d['totalReceivedPoints'] as num?)?.toInt() ?? 0,
      totalEarnedPointsFromGifts: (d['totalEarnedPointsFromGifts'] as num?)?.toInt() ?? 0,
      todayEarnedPoints: (d['todayEarnedPoints'] as num?)?.toInt() ?? 0,
      weeklyEarnedPoints: (d['weeklyEarnedPoints'] as num?)?.toInt() ?? 0,
      monthlyEarnedPoints: (d['monthlyEarnedPoints'] as num?)?.toInt() ?? 0,
      totalGiftCoinsReceived: (d['totalGiftCoinsReceived'] as num?)?.toInt() ?? 0,
      totalPlatformShareRecorded: (d['totalPlatformShareRecorded'] as num?)?.toInt() ?? 0,
      totalReceivedGiftsCount: (d['totalReceivedGiftsCount'] as num?)?.toInt() ?? 0,
      hostSharePercentage: (d['hostSharePercentage'] as num?)?.toInt() ?? 70,
      platformSharePercentage: (d['platformSharePercentage'] as num?)?.toInt() ?? 30,
      disclaimer: d['disclaimer']?.toString() ?? 'Host points reflect the approved 70% share.',
    );
  }
}

/// Real-Time Floating Gift Animation Event for Viewer and Broadcaster Displays
class UniversalGiftAnimationEvent {
  final String giftId;
  final String giftName;
  final String senderNickname;
  final String recipientNickname;
  final int quantity;
  final int totalCoins;
  final int hostPointsCredited; // 70% host earnings
  final String? imageUrl;
  final String? animationUrl;
  final String assetType;

  const UniversalGiftAnimationEvent({
    required this.giftId,
    required this.giftName,
    required this.senderNickname,
    required this.recipientNickname,
    this.quantity = 1,
    required this.totalCoins,
    required this.hostPointsCredited,
    this.imageUrl,
    this.animationUrl,
    this.assetType = 'lottie',
  });
}
