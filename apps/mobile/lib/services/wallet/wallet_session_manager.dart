import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../models/wallet/wallet_models.dart';
import 'wallet_service.dart';
import 'in_app_billing_service.dart';

/// ============================================================================
/// Popo Live — Phase 3 Prompt 05/08: Wallet Session Manager
/// Central State Management for Balance, Packages, IAP Purchases & Transactions
/// ============================================================================
class WalletSessionManager extends ChangeNotifier {
  static final WalletSessionManager instance = WalletSessionManager._internal();
  WalletSessionManager._internal() {
    _initBillingListener();
  }

  final WalletService _walletService = WalletService();
  final InAppBillingService _billingService = InAppBillingService.instance;

  StreamSubscription? _billingSub;

  // Current State
  WalletBalanceInfo? _balance;
  WalletBalanceInfo? get balance => _balance;
  int get coinBalance => _balance?.coins ?? 0;
  int get pointsBalance => _balance?.points ?? 0;

  List<CoinPackage> _packages = [];
  List<CoinPackage> get packages => _packages;

  CoinPackage? _selectedPackage;
  CoinPackage? get selectedPackage => _selectedPackage;

  List<PurchaseHistoryRecord> _purchaseHistory = [];
  List<PurchaseHistoryRecord> get purchaseHistory => _purchaseHistory;

  List<WalletTransactionRecord> _coinTransactions = [];
  List<WalletTransactionRecord> get coinTransactions => _coinTransactions;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isProcessingPurchase = false;
  bool get isProcessingPurchase => _isProcessingPurchase;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _successMessage;
  String? get successMessage => _successMessage;

  void _initBillingListener() {
    _billingSub?.cancel();
    _billingSub = _billingService.stateStream.listen((state) {
      if (state == BillingState.completed) {
        _isProcessingPurchase = false;
        final res = _billingService.lastPurchaseResult;
        if (res != null) {
          _successMessage = 'Successfully credited ${res.totalCoins} coins! 🎉';
        }
        notifyListeners();
      } else if (state == BillingState.failed || state == BillingState.cancelled) {
        _isProcessingPurchase = false;
        _errorMessage = _billingService.lastErrorMessage ?? (state == BillingState.cancelled ? 'Purchase cancelled.' : 'Purchase failed.');
        notifyListeners();
      } else if (state == BillingState.initiatingOrder ||
          state == BillingState.awaitingStorePayment ||
          state == BillingState.verifyingWithServer) {
        _isProcessingPurchase = true;
        notifyListeners();
      }
    });
  }

  /// 1. Complete Wallet & Packages Loading
  Future<void> loadWalletData({
    String? userId,
    String? authToken,
    bool previewDemo = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final results = await Future.wait([
      _walletService.getBalance(userId: userId, authToken: authToken, previewDemo: previewDemo),
      _walletService.getCoinPackages(),
      _walletService.getPurchaseHistory(userId: userId, authToken: authToken, limit: 15, previewDemo: previewDemo),
      _walletService.getCoinTransactionHistory(userId: userId, authToken: authToken, limit: 15, previewDemo: previewDemo),
    ]);

    final balanceRes = results[0] as WalletApiResponse<WalletBalanceInfo>;
    final packagesRes = results[1] as WalletApiResponse<List<CoinPackage>>;
    final purchasesRes = results[2] as WalletApiResponse<List<PurchaseHistoryRecord>>;
    final txnsRes = results[3] as WalletApiResponse<List<WalletTransactionRecord>>;

    _isLoading = false;

    if (balanceRes.isSuccess && balanceRes.data != null) {
      _balance = balanceRes.data;
    } else {
      _errorMessage = balanceRes.errorMessage;
    }

    if (packagesRes.isSuccess && packagesRes.data != null) {
      _packages = packagesRes.data!;
      if (_selectedPackage == null && _packages.isNotEmpty) {
        _selectedPackage = _packages.firstWhere((p) => p.isPopular, orElse: () => _packages.first);
      }
    }

    if (purchasesRes.isSuccess && purchasesRes.data != null) {
      _purchaseHistory = purchasesRes.data!;
    }

    if (txnsRes.isSuccess && txnsRes.data != null) {
      _coinTransactions = txnsRes.data!;
    }

    notifyListeners();
  }

  /// 2. Fast Balance Refresh (e.g. after gift sending or top-up)
  Future<void> refreshBalance({
    String? userId,
    String? authToken,
    bool previewDemo = false,
  }) async {
    final res = await _walletService.getBalance(
      userId: userId,
      authToken: authToken,
      previewDemo: previewDemo,
    );
    if (res.isSuccess && res.data != null) {
      _balance = res.data;
      notifyListeners();
    }
  }

  /// 3. Select Coin Package
  void selectPackage(CoinPackage pkg) {
    _selectedPackage = pkg;
    notifyListeners();
  }

  /// 4. Execute Purchase Flow
  Future<TopupPurchaseResult?> purchaseSelectedPackage({
    required String userId,
    String? authToken,
    bool isSandbox = true,
  }) async {
    if (_selectedPackage == null) {
      _errorMessage = 'Please select a coin package.';
      notifyListeners();
      return null;
    }

    _isProcessingPurchase = true;
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();

    final result = await _billingService.purchasePackage(
      package: _selectedPackage!,
      userId: userId,
      authToken: authToken,
      isSandbox: isSandbox,
    );

    _isProcessingPurchase = false;

    if (result != null && result.success) {
      // Authoritatively refresh balance from server
      await refreshBalance(userId: userId, authToken: authToken, previewDemo: isSandbox);
      await loadPurchaseHistory(userId: userId, authToken: authToken, previewDemo: isSandbox);
      _successMessage = 'Successfully credited ${result.totalCoins} coins to wallet!';
      notifyListeners();
      return result;
    } else {
      _errorMessage = _billingService.lastErrorMessage ?? 'Purchase failed.';
      notifyListeners();
      return null;
    }
  }

  /// 5. Restore Purchases
  Future<bool> restorePurchases({required String userId, String? authToken}) async {
    _isLoading = true;
    notifyListeners();

    final ok = await _billingService.restorePurchases(userId: userId, authToken: authToken);
    if (ok) {
      await refreshBalance(userId: userId, authToken: authToken, previewDemo: true);
      await loadPurchaseHistory(userId: userId, authToken: authToken, previewDemo: true);
      _successMessage = 'Purchases successfully restored.';
    } else {
      _errorMessage = _billingService.lastErrorMessage ?? 'No purchases found to restore.';
    }

    _isLoading = false;
    notifyListeners();
    return ok;
  }

  /// 6. Load Purchase History
  Future<void> loadPurchaseHistory({
    String? userId,
    String? authToken,
    int page = 1,
    String status = 'all',
    bool previewDemo = false,
  }) async {
    final res = await _walletService.getPurchaseHistory(
      userId: userId,
      authToken: authToken,
      page: page,
      status: status,
      previewDemo: previewDemo,
    );
    if (res.isSuccess && res.data != null) {
      _purchaseHistory = res.data!;
      notifyListeners();
    }
  }

  /// 7. Load Coin Transactions
  Future<void> loadCoinTransactions({
    String? userId,
    String? authToken,
    int page = 1,
    String status = 'all',
    bool previewDemo = false,
  }) async {
    final res = await _walletService.getCoinTransactionHistory(
      userId: userId,
      authToken: authToken,
      page: page,
      status: status,
      previewDemo: previewDemo,
    );
    if (res.isSuccess && res.data != null) {
      _coinTransactions = res.data!;
      notifyListeners();
    }
  }

  void clearMessages() {
    _errorMessage = null;
    _successMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _billingSub?.cancel();
    super.dispose();
  }
}
