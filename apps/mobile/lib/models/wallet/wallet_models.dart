import 'dart:convert';

/// ============================================================================
/// Popo Live — Phase 3 Prompt 05/08: Wallet & Top-Up Models
/// Server-Authoritative Virtual Economy & In-App Purchase Architecture
/// ============================================================================

/// 1. Authenticated User's Wallet Balance
class WalletBalanceInfo {
  final String walletId;
  final String userId;
  final int coins;
  final int points;
  final int totalSpentCoins;
  final int totalReceivedPoints;
  final bool isFrozen;
  final double hostSharePercentage; // 70.0%
  final DateTime updatedAt;

  const WalletBalanceInfo({
    required this.walletId,
    required this.userId,
    required this.coins,
    required this.points,
    this.totalSpentCoins = 0,
    this.totalReceivedPoints = 0,
    this.isFrozen = false,
    this.hostSharePercentage = 70.0,
    required this.updatedAt,
  });

  factory WalletBalanceInfo.fromJson(Map<String, dynamic> json) {
    final w = json['wallet'] as Map<String, dynamic>? ?? json;
    return WalletBalanceInfo(
      walletId: w['walletId']?.toString() ?? w['wallet_id']?.toString() ?? '',
      userId: w['userId']?.toString() ?? w['user_id']?.toString() ?? '',
      coins: (w['coins'] as num?)?.toInt() ?? 0,
      points: (w['points'] ?? w['diamondPoints'] ?? w['diamond_points'] as num?)?.toInt() ?? 0,
      totalSpentCoins: (w['totalSpentCoins'] ?? w['total_spent_coins'] as num?)?.toInt() ?? 0,
      totalReceivedPoints: (w['totalReceivedPoints'] ?? w['total_received_points'] as num?)?.toInt() ?? 0,
      isFrozen: w['isFrozen'] == true || w['is_frozen'] == true,
      hostSharePercentage: (w['hostSharePercentage'] ?? w['host_share_percentage'] as num?)?.toDouble() ?? 70.0,
      updatedAt: w['updatedAt'] != null
          ? DateTime.tryParse(w['updatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// 2. Coin Package Record (Returned by GET /api/topup/packages)
class CoinPackage {
  final String packageId;
  final String packageName;
  final String? packageNameUr;
  final int baseCoins;
  final int bonusCoins;
  final int totalCoins;
  final double priceAmount;
  final String currency;
  final String iconUrl;
  final String? badgeText;
  final bool isPopular;
  final bool isActive;
  final int displayOrder;
  final String? platformProductIdIos;
  final String? platformProductIdAndroid;

  const CoinPackage({
    required this.packageId,
    required this.packageName,
    this.packageNameUr,
    required this.baseCoins,
    required this.bonusCoins,
    required this.totalCoins,
    required this.priceAmount,
    this.currency = 'USD',
    required this.iconUrl,
    this.badgeText,
    this.isPopular = false,
    this.isActive = true,
    this.displayOrder = 1,
    this.platformProductIdIos,
    this.platformProductIdAndroid,
  });

  factory CoinPackage.fromJson(Map<String, dynamic> json) {
    return CoinPackage(
      packageId: json['packageId']?.toString() ?? '',
      packageName: json['packageName']?.toString() ?? 'Coin Package',
      packageNameUr: json['packageNameUr']?.toString(),
      baseCoins: (json['baseCoins'] as num?)?.toInt() ?? 0,
      bonusCoins: (json['bonusCoins'] as num?)?.toInt() ?? 0,
      totalCoins: (json['totalCoins'] as num?)?.toInt() ?? 0,
      priceAmount: (json['priceAmount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency']?.toString() ?? 'USD',
      iconUrl: json['iconUrl']?.toString() ?? '/assets/gifts/07_06_top_up.png',
      badgeText: json['badgeText']?.toString(),
      isPopular: json['isPopular'] == true,
      isActive: json['isActive'] != false,
      displayOrder: (json['displayOrder'] as num?)?.toInt() ?? 1,
      platformProductIdIos: json['platformProductIdIos']?.toString(),
      platformProductIdAndroid: json['platformProductIdAndroid']?.toString(),
    );
  }

  String get localizedTitle => packageName;
  String get formattedPrice => '\$$priceAmount';
}

/// 3. Initiated Top-up Payment Order (Returned by POST /api/topup/orders)
class TopupOrder {
  final String orderId;
  final String userId;
  final String packageId;
  final String packageName;
  final int baseCoins;
  final int bonusCoins;
  final int totalCoins;
  final double amount;
  final String currency;
  final String status;
  final String providerKey;
  final String platform;
  final String? checkoutToken;
  final String? idempotencyKey;
  final DateTime createdAt;

  const TopupOrder({
    required this.orderId,
    required this.userId,
    required this.packageId,
    required this.packageName,
    required this.baseCoins,
    required this.bonusCoins,
    required this.totalCoins,
    required this.amount,
    required this.currency,
    required this.status,
    required this.providerKey,
    required this.platform,
    this.checkoutToken,
    this.idempotencyKey,
    required this.createdAt,
  });

  factory TopupOrder.fromJson(Map<String, dynamic> json) {
    final o = json['order'] as Map<String, dynamic>? ?? json;
    return TopupOrder(
      orderId: o['orderId']?.toString() ?? '',
      userId: o['userId']?.toString() ?? '',
      packageId: o['packageId']?.toString() ?? '',
      packageName: o['packageName']?.toString() ?? 'Coins',
      baseCoins: (o['baseCoins'] as num?)?.toInt() ?? 0,
      bonusCoins: (o['bonusCoins'] as num?)?.toInt() ?? 0,
      totalCoins: (o['totalCoins'] as num?)?.toInt() ?? 0,
      amount: (o['amount'] as num?)?.toDouble() ?? 0.0,
      currency: o['currency']?.toString() ?? 'USD',
      status: o['status']?.toString() ?? 'created',
      providerKey: o['providerKey']?.toString() ?? 'sandbox_verified',
      platform: o['platform']?.toString() ?? 'android',
      checkoutToken: o['checkoutToken']?.toString(),
      idempotencyKey: o['idempotencyKey']?.toString(),
      createdAt: o['createdAt'] != null
          ? DateTime.tryParse(o['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// 4. Completed Top-up Purchase Verification Result
class TopupPurchaseResult {
  final bool success;
  final String orderId;
  final String status;
  final String? coinTransactionId;
  final int totalCoins;
  final double amount;
  final String currency;
  final int? newBalance;
  final bool isIdempotent;
  final String? message;

  const TopupPurchaseResult({
    required this.success,
    required this.orderId,
    required this.status,
    this.coinTransactionId,
    required this.totalCoins,
    required this.amount,
    this.currency = 'USD',
    this.newBalance,
    this.isIdempotent = false,
    this.message,
  });

  factory TopupPurchaseResult.fromJson(Map<String, dynamic> json) {
    final order = json['order'] is Map<String, dynamic> ? json['order'] as Map<String, dynamic> : null;
    final wallet = json['wallet'] is Map<String, dynamic> ? json['wallet'] as Map<String, dynamic> : null;
    final receipt = json['receipt'] is Map<String, dynamic> ? json['receipt'] as Map<String, dynamic> : null;

    final resolvedOrderId = json['orderId']?.toString() ?? order?['orderId']?.toString() ?? '';
    final resolvedStatus = json['status']?.toString() ?? order?['status']?.toString() ?? 'successful';
    final resolvedTotalCoins = (json['totalCoins'] ?? json['coinsCredited'] ?? order?['totalCoins'] as num?)?.toInt() ?? 0;
    final resolvedAmount = (json['amount'] ?? order?['amount'] as num?)?.toDouble() ?? 0.0;
    final resolvedCurrency = json['currency']?.toString() ?? order?['currency']?.toString() ?? 'USD';
    final resolvedNewBalance = (json['newBalance'] ?? json['currentCoins'] ?? wallet?['coins'] as num?)?.toInt();
    final resolvedTxId = json['coinTransactionId']?.toString() ??
        json['transactionId']?.toString() ??
        receipt?['coinTransactionId']?.toString() ??
        order?['coinTransactionId']?.toString();

    return TopupPurchaseResult(
      success: json['success'] == true,
      orderId: resolvedOrderId,
      status: resolvedStatus,
      coinTransactionId: resolvedTxId,
      totalCoins: resolvedTotalCoins,
      amount: resolvedAmount,
      currency: resolvedCurrency,
      newBalance: resolvedNewBalance,
      isIdempotent: json['deduplicated'] == true || json['isIdempotentReplay'] == true,
      message: json['message']?.toString(),
    );
  }
}

/// 5. Top-up Purchase History Record (Returned by GET /api/topup/history)
class PurchaseHistoryRecord {
  final String orderId;
  final String packageId;
  final String packageName;
  final String providerKey;
  final String platform;
  final int baseCoins;
  final int bonusCoins;
  final int totalCoins;
  final double amount;
  final String currency;
  final String status;
  final String? coinTransactionId;
  final String? receiptId;
  final String? failureReason;
  final DateTime createdAt;

  const PurchaseHistoryRecord({
    required this.orderId,
    required this.packageId,
    required this.packageName,
    required this.providerKey,
    required this.platform,
    required this.baseCoins,
    required this.bonusCoins,
    required this.totalCoins,
    required this.amount,
    required this.currency,
    required this.status,
    this.coinTransactionId,
    this.receiptId,
    this.failureReason,
    required this.createdAt,
  });

  factory PurchaseHistoryRecord.fromJson(Map<String, dynamic> json) {
    return PurchaseHistoryRecord(
      orderId: json['orderId']?.toString() ?? '',
      packageId: json['packageId']?.toString() ?? '',
      packageName: json['packageName']?.toString() ?? 'Coins',
      providerKey: json['providerKey']?.toString() ?? 'google_play',
      platform: json['platform']?.toString() ?? 'android',
      baseCoins: (json['baseCoins'] as num?)?.toInt() ?? 0,
      bonusCoins: (json['bonusCoins'] as num?)?.toInt() ?? 0,
      totalCoins: (json['totalCoins'] as num?)?.toInt() ?? 0,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency']?.toString() ?? 'USD',
      status: json['status']?.toString() ?? 'pending',
      coinTransactionId: json['coinTransactionId']?.toString(),
      receiptId: json['receiptId']?.toString(),
      failureReason: json['failureReason']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isSuccessful => status == 'successful' || status == 'completed';
  bool get isPending => status == 'pending' || status == 'processing' || status == 'created';
  bool get isFailed => status == 'failed' || status == 'cancelled' || status == 'expired';
}

/// 6. Wallet Coin Transaction Record (Returned by GET /api/wallet/coins/history)
class WalletTransactionRecord {
  final String id;
  final String transactionId;
  final String transactionType; // 'topup', 'gift_sent', 'reversal', 'admin_credit', etc.
  final String direction; // 'credit' | 'debit'
  final int coinAmount;
  final int previousBalance;
  final int newBalance;
  final String status;
  final String? referenceId;
  final String? description;
  final DateTime createdAt;

  const WalletTransactionRecord({
    required this.id,
    required this.transactionId,
    required this.transactionType,
    required this.direction,
    required this.coinAmount,
    required this.previousBalance,
    required this.newBalance,
    required this.status,
    this.referenceId,
    this.description,
    required this.createdAt,
  });

  factory WalletTransactionRecord.fromJson(Map<String, dynamic> json) {
    return WalletTransactionRecord(
      id: json['id']?.toString() ?? '',
      transactionId: json['transactionId']?.toString() ?? '',
      transactionType: json['transactionType']?.toString() ?? 'feature_spend',
      direction: json['direction']?.toString() ?? 'debit',
      coinAmount: (json['coinAmount'] as num?)?.toInt() ?? 0,
      previousBalance: (json['previousBalance'] as num?)?.toInt() ?? 0,
      newBalance: (json['newBalance'] as num?)?.toInt() ?? 0,
      status: json['status']?.toString() ?? 'completed',
      referenceId: json['referenceId']?.toString(),
      description: json['description']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isCredit => direction == 'credit';
  bool get isDebit => direction == 'debit';
}
