import 'package:flutter/foundation.dart';

/// 1. Unified Financial Transaction Model (from GET /api/finance/history)
class FinancialTransactionItem {
  final String recordId;
  final String sourceTable;
  final String userId;
  final String? userNickname;
  final String? userPoppoId;
  final String txCategory; // topup, vip_purchase, gift_sent, host_earning, points_credit, reversal, refund, wallet_adjustment, store_order
  final String title;
  final String? titleUr;
  final String description;
  final double paymentAmount;
  final String currency;
  final int coinQuantity;
  final int bonusCoinQuantity;
  final int pointsQuantity;
  final int platformShareCoins;
  final double? sharePercentage;
  final String paymentMethod;
  final String? providerReferenceMasked;
  final String status; // successful, pending, failed, cancelled, refunded, reversed
  final bool receiptEligible;
  final String? receiptId;
  final String? receiptNumber;
  final String? legacyReceiptId;
  final String? itemDetailSummary;
  final DateTime issuedAt;

  const FinancialTransactionItem({
    required this.recordId,
    required this.sourceTable,
    required this.userId,
    this.userNickname,
    this.userPoppoId,
    required this.txCategory,
    required this.title,
    this.titleUr,
    required this.description,
    required this.paymentAmount,
    this.currency = 'USD',
    this.coinQuantity = 0,
    this.bonusCoinQuantity = 0,
    this.pointsQuantity = 0,
    this.platformShareCoins = 0,
    this.sharePercentage,
    required this.paymentMethod,
    this.providerReferenceMasked,
    required this.status,
    this.receiptEligible = false,
    this.receiptId,
    this.receiptNumber,
    this.legacyReceiptId,
    this.itemDetailSummary,
    required this.issuedAt,
  });

  factory FinancialTransactionItem.fromJson(Map<String, dynamic> json) {
    return FinancialTransactionItem(
      recordId: json['recordId']?.toString() ?? '',
      sourceTable: json['sourceTable']?.toString() ?? '',
      userId: json['userId']?.toString() ?? '',
      userNickname: json['userNickname']?.toString(),
      userPoppoId: json['userPoppoId']?.toString(),
      txCategory: json['txCategory']?.toString() ?? 'other',
      title: json['title']?.toString() ?? 'Financial Transaction',
      titleUr: json['titleUr']?.toString(),
      description: json['description']?.toString() ?? '',
      paymentAmount: (json['paymentAmount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency']?.toString() ?? 'USD',
      coinQuantity: (json['coinQuantity'] as num?)?.toInt() ?? 0,
      bonusCoinQuantity: (json['bonusCoinQuantity'] as num?)?.toInt() ?? 0,
      pointsQuantity: (json['pointsQuantity'] as num?)?.toInt() ?? 0,
      platformShareCoins: (json['platformShareCoins'] as num?)?.toInt() ?? 0,
      sharePercentage: (json['sharePercentage'] as num?)?.toDouble(),
      paymentMethod: json['paymentMethod']?.toString() ?? 'internal',
      providerReferenceMasked: json['providerReferenceMasked']?.toString(),
      status: json['status']?.toString() ?? 'successful',
      receiptEligible: json['receiptEligible'] == true,
      receiptId: json['receiptId']?.toString(),
      receiptNumber: json['receiptNumber']?.toString(),
      legacyReceiptId: json['legacyReceiptId']?.toString(),
      itemDetailSummary: json['itemDetailSummary']?.toString(),
      issuedAt: json['issuedAt'] != null
          ? DateTime.tryParse(json['issuedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  bool get isSuccessful => status == 'successful' || status == 'completed';
  bool get isPending => status == 'pending';
  bool get isFailed => status == 'failed';
  bool get isCancelled => status == 'cancelled';
  bool get isRefunded => status == 'refunded' || status == 'reversed';
  bool get isHostShare => txCategory == 'host_earning' || txCategory == 'points_credit';
  bool get isTopup => txCategory == 'topup';
  bool get isGiftSent => txCategory == 'gift_sent';
  bool get isVip => txCategory == 'vip_purchase' || txCategory == 'vip_renewal';
  bool get isRefundCategory => txCategory == 'refund' || txCategory == 'reversal';
}

/// 2. Financial History Summary
class FinancialHistorySummary {
  final double totalVerifiedTopupPaymentAmount;
  final int totalTopupCoinsReceived;
  final int totalGiftCoinsSent;
  final int totalHostPointsCredited;
  final int totalStoreCoinsSpent;
  final int refundsAndReversalsCount;
  final int eligibleReceiptsCount;

  const FinancialHistorySummary({
    this.totalVerifiedTopupPaymentAmount = 0.0,
    this.totalTopupCoinsReceived = 0,
    this.totalGiftCoinsSent = 0,
    this.totalHostPointsCredited = 0,
    this.totalStoreCoinsSpent = 0,
    this.refundsAndReversalsCount = 0,
    this.eligibleReceiptsCount = 0,
  });

  factory FinancialHistorySummary.fromJson(Map<String, dynamic> json) {
    return FinancialHistorySummary(
      totalVerifiedTopupPaymentAmount: (json['totalVerifiedTopupPaymentAmount'] as num?)?.toDouble() ?? 0.0,
      totalTopupCoinsReceived: (json['totalTopupCoinsReceived'] as num?)?.toInt() ?? 0,
      totalGiftCoinsSent: (json['totalGiftCoinsSent'] as num?)?.toInt() ?? 0,
      totalHostPointsCredited: (json['totalHostPointsCredited'] as num?)?.toInt() ?? 0,
      totalStoreCoinsSpent: (json['totalStoreCoinsSpent'] as num?)?.toInt() ?? 0,
      refundsAndReversalsCount: (json['refundsAndReversalsCount'] as num?)?.toInt() ?? 0,
      eligibleReceiptsCount: (json['eligibleReceiptsCount'] as num?)?.toInt() ?? 0,
    );
  }
}

/// 3. Official Financial Receipt Details (GET /api/finance/receipts/[receiptId])
class FinancialReceiptDetail {
  final String receiptId;
  final String? receiptNumber;
  final String transactionId;
  final String sourceTable;
  final String? relatedOriginalTxId;
  final String userId;
  final String? userNickname;
  final String? userPoppoId;
  final String txCategory;
  final String title;
  final String? titleUr;
  final String description;
  final double paymentAmount;
  final String currency;
  final int coinQuantity;
  final int bonusCoinQuantity;
  final int pointsQuantity;
  final int platformShareCoins;
  final double? sharePercentage;
  final String paymentMethod;
  final String? providerReferenceMasked;
  final String status;
  final String? itemDetailSummary;
  final String? nonCashPointsNote;
  final DateTime issuedAt;

  const FinancialReceiptDetail({
    required this.receiptId,
    this.receiptNumber,
    required this.transactionId,
    required this.sourceTable,
    this.relatedOriginalTxId,
    required this.userId,
    this.userNickname,
    this.userPoppoId,
    required this.txCategory,
    required this.title,
    this.titleUr,
    required this.description,
    required this.paymentAmount,
    this.currency = 'USD',
    this.coinQuantity = 0,
    this.bonusCoinQuantity = 0,
    this.pointsQuantity = 0,
    this.platformShareCoins = 0,
    this.sharePercentage,
    required this.paymentMethod,
    this.providerReferenceMasked,
    required this.status,
    this.itemDetailSummary,
    this.nonCashPointsNote,
    required this.issuedAt,
  });

  factory FinancialReceiptDetail.fromJson(Map<String, dynamic> json) {
    final r = json['receipt'] as Map<String, dynamic>? ?? json;
    return FinancialReceiptDetail(
      receiptId: r['receiptId']?.toString() ?? '',
      receiptNumber: r['receiptNumber']?.toString(),
      transactionId: r['transactionId']?.toString() ?? '',
      sourceTable: r['sourceTable']?.toString() ?? '',
      relatedOriginalTxId: r['relatedOriginalTxId']?.toString(),
      userId: r['userId']?.toString() ?? '',
      userNickname: r['userNickname']?.toString(),
      userPoppoId: r['userPoppoId']?.toString(),
      txCategory: r['txCategory']?.toString() ?? 'topup',
      title: r['title']?.toString() ?? 'Official Financial Receipt',
      titleUr: r['titleUr']?.toString(),
      description: r['description']?.toString() ?? '',
      paymentAmount: (r['paymentAmount'] as num?)?.toDouble() ?? 0.0,
      currency: r['currency']?.toString() ?? 'USD',
      coinQuantity: (r['coinQuantity'] as num?)?.toInt() ?? 0,
      bonusCoinQuantity: (r['bonusCoinQuantity'] as num?)?.toInt() ?? 0,
      pointsQuantity: (r['pointsQuantity'] as num?)?.toInt() ?? 0,
      platformShareCoins: (r['platformShareCoins'] as num?)?.toInt() ?? 0,
      sharePercentage: (r['sharePercentage'] as num?)?.toDouble(),
      paymentMethod: r['paymentMethod']?.toString() ?? 'unknown',
      providerReferenceMasked: r['providerReferenceMasked']?.toString(),
      status: r['status']?.toString() ?? 'successful',
      itemDetailSummary: r['itemDetailSummary']?.toString(),
      nonCashPointsNote: r['nonCashPointsNote']?.toString(),
      issuedAt: r['issuedAt'] != null
          ? DateTime.tryParse(r['issuedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// 4. Server-Authoritative Wallet Reconciliation Report (GET /api/wallet/reconcile)
class WalletReconciliationReport {
  final String userId;
  final String reconciliationStatus; // 'reconciled' | 'discrepancy_detected'
  final DateTime reconciledAt;
  final int currentCoins;
  final int currentPoints;
  final int currentDiamonds;
  final int totalSpentCoins;
  final int totalReceivedPoints;

  // Audit Metrics
  final int baseInitialCoins;
  final int totalPurchasedCoins;
  final double totalPurchasedAmount;
  final int totalRefundedCoins;
  final double totalRefundedAmount;
  final int totalGiftCoinsSpent;
  final int totalStoreVipCoinsSpent;
  final int netAdjustments;
  final int expectedCoins;
  final int discrepancyCoins;

  // Integrity Checks
  final int missingCreditsCount;
  final int duplicateCreditsCount;
  final int duplicateDeductionsCount;
  final int pendingTransactionsCount;
  final bool isZeroDiscrepancy;

  // Revenue Sharing (70/30) Audit
  final double hostSharePercent;
  final double platformSharePercent;
  final int confirmedGiftCoins;
  final int hostPointsCredited;
  final int platformCoinsCredited;
  final bool ruleFormulaVerified;

  final List<PendingPurchaseItem> pendingTransactions;
  final List<String> issues;

  const WalletReconciliationReport({
    required this.userId,
    required this.reconciliationStatus,
    required this.reconciledAt,
    required this.currentCoins,
    required this.currentPoints,
    required this.currentDiamonds,
    required this.totalSpentCoins,
    required this.totalReceivedPoints,
    required this.baseInitialCoins,
    required this.totalPurchasedCoins,
    required this.totalPurchasedAmount,
    required this.totalRefundedCoins,
    required this.totalRefundedAmount,
    required this.totalGiftCoinsSpent,
    required this.totalStoreVipCoinsSpent,
    required this.netAdjustments,
    required this.expectedCoins,
    required this.discrepancyCoins,
    required this.missingCreditsCount,
    required this.duplicateCreditsCount,
    required this.duplicateDeductionsCount,
    required this.pendingTransactionsCount,
    required this.isZeroDiscrepancy,
    required this.hostSharePercent,
    required this.platformSharePercent,
    required this.confirmedGiftCoins,
    required this.hostPointsCredited,
    required this.platformCoinsCredited,
    required this.ruleFormulaVerified,
    required this.pendingTransactions,
    required this.issues,
  });

  factory WalletReconciliationReport.fromJson(Map<String, dynamic> json) {
    final wallet = json['wallet'] as Map<String, dynamic>? ?? {};
    final audit = json['audit'] as Map<String, dynamic>? ?? {};
    final checks = json['integrityChecks'] as Map<String, dynamic>? ?? {};
    final rev = json['revenueSharing'] as Map<String, dynamic>? ?? {};

    final pendingList = (json['pendingTransactions'] as List?)
            ?.map((p) => PendingPurchaseItem.fromJson(p as Map<String, dynamic>))
            .toList() ??
        [];

    final issueList = (json['issues'] as List?)?.map((i) => i.toString()).toList() ?? [];

    return WalletReconciliationReport(
      userId: json['userId']?.toString() ?? '',
      reconciliationStatus: json['reconciliationStatus']?.toString() ?? 'discrepancy_detected',
      reconciledAt: json['reconciledAt'] != null
          ? DateTime.tryParse(json['reconciledAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      currentCoins: (wallet['coins'] as num?)?.toInt() ?? 0,
      currentPoints: (wallet['points'] as num?)?.toInt() ?? 0,
      currentDiamonds: (wallet['diamonds'] as num?)?.toInt() ?? 0,
      totalSpentCoins: (wallet['totalSpentCoins'] as num?)?.toInt() ?? 0,
      totalReceivedPoints: (wallet['totalReceivedPoints'] as num?)?.toInt() ?? 0,
      baseInitialCoins: (audit['baseInitialCoins'] as num?)?.toInt() ?? 0,
      totalPurchasedCoins: (audit['totalPurchasedCoins'] as num?)?.toInt() ?? 0,
      totalPurchasedAmount: (audit['totalPurchasedAmount'] as num?)?.toDouble() ?? 0.0,
      totalRefundedCoins: (audit['totalRefundedCoins'] as num?)?.toInt() ?? 0,
      totalRefundedAmount: (audit['totalRefundedAmount'] as num?)?.toDouble() ?? 0.0,
      totalGiftCoinsSpent: (audit['totalGiftCoinsSpent'] as num?)?.toInt() ?? 0,
      totalStoreVipCoinsSpent: (audit['totalStoreVipCoinsSpent'] as num?)?.toInt() ?? 0,
      netAdjustments: (audit['netAdjustments'] as num?)?.toInt() ?? 0,
      expectedCoins: (audit['expectedCoins'] as num?)?.toInt() ?? 0,
      discrepancyCoins: (audit['discrepancyCoins'] as num?)?.toInt() ?? 0,
      missingCreditsCount: (checks['missingCreditsCount'] as num?)?.toInt() ?? 0,
      duplicateCreditsCount: (checks['duplicateCreditsCount'] as num?)?.toInt() ?? 0,
      duplicateDeductionsCount: (checks['duplicateDeductionsCount'] as num?)?.toInt() ?? 0,
      pendingTransactionsCount: (checks['pendingTransactionsCount'] as num?)?.toInt() ?? 0,
      isZeroDiscrepancy: checks['isZeroDiscrepancy'] == true,
      hostSharePercent: (rev['hostSharePercent'] as num?)?.toDouble() ?? 70.0,
      platformSharePercent: (rev['platformSharePercent'] as num?)?.toDouble() ?? 30.0,
      confirmedGiftCoins: (rev['confirmedGiftCoins'] as num?)?.toInt() ?? 0,
      hostPointsCredited: (rev['hostPointsCredited'] as num?)?.toInt() ?? 0,
      platformCoinsCredited: (rev['platformCoinsCredited'] as num?)?.toInt() ?? 0,
      ruleFormulaVerified: rev['ruleFormulaVerified'] == true,
      pendingTransactions: pendingList,
      issues: issueList,
    );
  }

  bool get isBalanced => reconciliationStatus == 'reconciled' && isZeroDiscrepancy;
}

/// 5. Pending Purchase Item
class PendingPurchaseItem {
  final String orderId;
  final String packageId;
  final int totalCoins;
  final double amount;
  final String currency;
  final String platform;
  final String providerKey;
  final DateTime createdAt;

  const PendingPurchaseItem({
    required this.orderId,
    required this.packageId,
    required this.totalCoins,
    required this.amount,
    required this.currency,
    required this.platform,
    required this.providerKey,
    required this.createdAt,
  });

  factory PendingPurchaseItem.fromJson(Map<String, dynamic> json) {
    return PendingPurchaseItem(
      orderId: json['orderId']?.toString() ?? '',
      packageId: json['packageId']?.toString() ?? '',
      totalCoins: (json['totalCoins'] as num?)?.toInt() ?? 0,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency']?.toString() ?? 'USD',
      platform: json['platform']?.toString() ?? 'android',
      providerKey: json['providerKey']?.toString() ?? 'sandbox_verified',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// 6. Refund Request Result (POST /api/finance/refunds/request)
class RefundRequestResult {
  final bool success;
  final String? refundRequestId;
  final String orderId;
  final String status; // 'refund_requested' | 'rejected' | 'completed'
  final double amount;
  final String currency;
  final int coinsToReclaim;
  final String message;
  final DateTime requestedAt;

  const RefundRequestResult({
    required this.success,
    this.refundRequestId,
    required this.orderId,
    required this.status,
    required this.amount,
    this.currency = 'USD',
    required this.coinsToReclaim,
    required this.message,
    required this.requestedAt,
  });

  factory RefundRequestResult.fromJson(Map<String, dynamic> json) {
    return RefundRequestResult(
      success: json['success'] == true,
      refundRequestId: json['refundRequestId']?.toString(),
      orderId: json['orderId']?.toString() ?? '',
      status: json['status']?.toString() ?? 'refund_requested',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency']?.toString() ?? 'USD',
      coinsToReclaim: (json['coinsToReclaim'] as num?)?.toInt() ?? 0,
      message: json['message']?.toString() ?? '',
      requestedAt: json['requestedAt'] != null
          ? DateTime.tryParse(json['requestedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

/// 7. Purchase Recovery Result (POST /api/topup/recovery/reconcile)
class PurchaseRecoveryResult {
  final bool success;
  final int recoveredCount;
  final int totalPendingChecked;
  final List<Map<String, dynamic>> orders;
  final int currentCoins;
  final DateTime reconciledAt;

  const PurchaseRecoveryResult({
    required this.success,
    required this.recoveredCount,
    required this.totalPendingChecked,
    required this.orders,
    required this.currentCoins,
    required this.reconciledAt,
  });

  factory PurchaseRecoveryResult.fromJson(Map<String, dynamic> json) {
    final wallet = json['wallet'] as Map<String, dynamic>? ?? {};
    return PurchaseRecoveryResult(
      success: json['success'] == true,
      recoveredCount: (json['recoveredCount'] as num?)?.toInt() ?? 0,
      totalPendingChecked: (json['totalPendingChecked'] as num?)?.toInt() ?? 0,
      orders: (json['orders'] as List?)?.map((o) => Map<String, dynamic>.from(o as Map)).toList() ?? [],
      currentCoins: (wallet['coins'] as num?)?.toInt() ?? 0,
      reconciledAt: json['reconciledAt'] != null
          ? DateTime.tryParse(json['reconciledAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
