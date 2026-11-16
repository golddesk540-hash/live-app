import 'package:flutter/material.dart';
import '../../models/wallet/wallet_models.dart';
import '../../services/wallet/wallet_session_manager.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_primary_button.dart';
import 'purchase_history_screen.dart';

/// ============================================================================
/// Popo Live — Phase 3 Prompt 05/08: Coin Package Catalogue Screen
/// Displays authoritative coin packages, bonuses, prices, and IAP purchase flow
/// ============================================================================
class CoinPackagesScreen extends StatefulWidget {
  final String userId;
  final String? authToken;
  final bool isSandbox;
  final VoidCallback? onTopupSuccess;

  const CoinPackagesScreen({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.authToken,
    this.isSandbox = true,
    this.onTopupSuccess,
  }) : super(key: key);

  @override
  State<CoinPackagesScreen> createState() => _CoinPackagesScreenState();
}

class _CoinPackagesScreenState extends State<CoinPackagesScreen> {
  final WalletSessionManager _manager = WalletSessionManager.instance;
  bool _isUrdu = false;

  @override
  void initState() {
    super.initState();
    _manager.loadWalletData(
      userId: widget.userId,
      authToken: widget.authToken,
      previewDemo: widget.isSandbox,
    );
  }

  void _showPurchaseConfirmationDialog(CoinPackage pkg) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.stars_rounded, color: PopoTheme.gold, size: 28),
            const SizedBox(width: 10),
            Text(
              _isUrdu ? 'خریداری کی تصدیق' : 'Confirm Purchase',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isUrdu ? pkg.packageNameUr ?? pkg.packageName : pkg.packageName,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: PopoTheme.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _isUrdu ? 'بنیادی سکے' : 'Base Coins',
                        style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 13),
                      ),
                      Text(
                        '${pkg.baseCoins}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  if (pkg.bonusCoins > 0) ...[
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isUrdu ? 'اضافی بونس' : 'Bonus Coins',
                          style: const TextStyle(color: PopoTheme.gold, fontSize: 13),
                        ),
                        Text(
                          '+${pkg.bonusCoins}',
                          style: const TextStyle(color: PopoTheme.gold, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                  const Divider(color: PopoTheme.borderSubtle, height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _isUrdu ? 'کل سکے' : 'Total Coins',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        '${pkg.totalCoins} 🪙',
                        style: const TextStyle(color: PopoTheme.primary, fontWeight: FontWeight.w900, fontSize: 15),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _isUrdu ? 'قیمت' : 'Price',
                        style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 13),
                      ),
                      Text(
                        '${pkg.formattedPrice} ${pkg.currency}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Coins are credited instantly to your wallet upon confirmed backend verification.',
              style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              _isUrdu ? 'منسوخ' : 'Cancel',
              style: const TextStyle(color: PopoTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: PopoTheme.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final result = await _manager.purchaseSelectedPackage(
                userId: widget.userId,
                authToken: widget.authToken,
                isSandbox: widget.isSandbox,
              );
              if (result != null && result.success) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Purchase Successful! Credited ${result.totalCoins} Coins 🎉'),
                      backgroundColor: const Color(0xFF00C853),
                    ),
                  );
                }
                widget.onTopupSuccess?.call();
              }
            },
            child: Text(
              _isUrdu ? 'خریدیں' : 'Purchase',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _manager,
      builder: (context, _) {
        final balance = _manager.coinBalance;
        final packages = _manager.packages;
        final selectedPkg = _manager.selectedPackage;

        return Directionality(
          textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
          child: Scaffold(
            backgroundColor: PopoTheme.background,
            appBar: AppBar(
              backgroundColor: PopoTheme.surface,
              elevation: 0,
              title: Text(
                _isUrdu ? 'سکے ریچارج اور پیکیجز' : 'Top-Up Coins',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
              ),
              centerTitle: true,
              actions: [
                IconButton(
                  tooltip: 'Purchase History',
                  icon: const Icon(Icons.receipt_long_rounded, color: PopoTheme.gold),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PurchaseHistoryScreen(
                          userId: widget.userId,
                          authToken: widget.authToken,
                          isSandbox: widget.isSandbox,
                        ),
                      ),
                    );
                  },
                ),
                TextButton(
                  onPressed: () => setState(() => _isUrdu = !_isUrdu),
                  child: Text(
                    _isUrdu ? 'EN' : 'اردو',
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            body: _manager.isLoading
                ? const Center(child: PopoLoadingIndicator())
                : RefreshIndicator(
                    onRefresh: () => _manager.loadWalletData(
                      userId: widget.userId,
                      authToken: widget.authToken,
                      previewDemo: widget.isSandbox,
                    ),
                    color: PopoTheme.primary,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Current Coin Balance Card
                          _buildBalanceCard(balance),

                          const SizedBox(height: 20),

                          // 2. Promotional Banner
                          _buildPromoBanner(),

                          const SizedBox(height: 20),

                          // 3. Section Title
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _isUrdu ? 'دستیاب پیکیجز' : 'Select Coin Package',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '${packages.length} Packages',
                                style: const TextStyle(
                                  color: PopoTheme.textSecondary,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          // 4. Packages Grid
                          if (packages.isEmpty)
                            Container(
                              padding: const EdgeInsets.all(24),
                              alignment: Alignment.center,
                              child: const Text(
                                'No packages available at this moment.',
                                style: TextStyle(color: PopoTheme.textSecondary),
                              ),
                            )
                          else
                            GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.88,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                              itemCount: packages.length,
                              itemBuilder: (context, index) {
                                final pkg = packages[index];
                                final isSelected = selectedPkg?.packageId == pkg.packageId;
                                return _buildPackageCard(pkg, isSelected);
                              },
                            ),

                          const SizedBox(height: 24),

                          // 5. Restore Purchases & Security Assurance
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.verified_user_rounded, color: Color(0xFF00C853), size: 16),
                              const SizedBox(width: 6),
                              const Text(
                                'Official 256-Bit Cryptographic Payment Security',
                                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Center(
                            child: TextButton.icon(
                              icon: const Icon(Icons.restore_rounded, size: 16, color: PopoTheme.cyan),
                              label: Text(
                                _isUrdu ? 'خریداری بحال کریں' : 'Restore Purchases',
                                style: const TextStyle(color: PopoTheme.cyan, fontSize: 12),
                              ),
                              onPressed: () async {
                                final ok = await _manager.restorePurchases(
                                  userId: widget.userId,
                                  authToken: widget.authToken,
                                );
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(ok ? 'Purchases Restored Successfully!' : 'No purchases found to restore.'),
                                    ),
                                  );
                                }
                              },
                            ),
                          ),
                          const SizedBox(height: 80),
                        ],
                      ),
                    ),
                  ),
            bottomSheet: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                border: const Border(
                  top: BorderSide(color: PopoTheme.borderSubtle, width: 1),
                ),
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            selectedPkg != null
                                ? '${selectedPkg.formattedPrice} ${selectedPkg.currency}'
                                : '--',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          Text(
                            selectedPkg != null
                                ? '${selectedPkg.totalCoins} Coins'
                                : 'Select Package',
                            style: const TextStyle(
                              color: PopoTheme.gold,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    SizedBox(
                      width: 170,
                      child: PopoPrimaryButton(
                        text: _isUrdu ? 'ابھی خریدیں' : 'Top-Up Now',
                        isLoading: _manager.isProcessingPurchase,
                        onPressed: selectedPkg == null
                            ? null
                            : () => _showPurchaseConfirmationDialog(selectedPkg),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBalanceCard(int balance) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF201335), Color(0xFF140D24)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: PopoTheme.gold.withOpacity(0.3), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: PopoTheme.gold.withOpacity(0.08),
            blurRadius: 16,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _isUrdu ? 'آپ کا موجودہ سکہ بیلنس' : 'CURRENT COIN BALANCE',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Text('🪙 ', style: TextStyle(fontSize: 22)),
                  Text(
                    '$balance',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: PopoTheme.gold.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: PopoTheme.gold.withOpacity(0.4)),
            ),
            child: Row(
              children: const [
                Icon(Icons.bolt_rounded, color: PopoTheme.gold, size: 16),
                SizedBox(width: 4),
                Text(
                  'Instant Credit',
                  style: TextStyle(
                    color: PopoTheme.gold,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF381530), Color(0xFF1B0E25)],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: PopoTheme.primary.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: PopoTheme.primary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _isUrdu ? 'خصوصی پروموشنل بونس دستیاب ہے!' : 'Special Bonus on Selected Packs!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _isUrdu ? 'بڑے پیکیجز پر اضافی سکے حاصل کریں' : 'Get up to +1,500 bonus coins on Imperial Vault.',
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 10.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPackageCard(CoinPackage pkg, bool isSelected) {
    return GestureDetector(
      onTap: () => _manager.selectPackage(pkg),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF26183C) : PopoTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? PopoTheme.gold : PopoTheme.borderSubtle,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: PopoTheme.gold.withOpacity(0.2),
                    blurRadius: 12,
                    spreadRadius: 1,
                  ),
                ]
              : null,
        ),
        child: Stack(
          children: [
            // Popular or Bonus Badge
            if (pkg.badgeText != null || pkg.isPopular)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: pkg.isPopular ? PopoTheme.primary : PopoTheme.gold,
                    borderRadius: const BorderRadius.only(
                      topRight: Radius.circular(14),
                      bottomLeft: Radius.circular(10),
                    ),
                  ),
                  child: Text(
                    pkg.badgeText ?? (pkg.isPopular ? 'Popular' : 'Bonus'),
                    style: TextStyle(
                      color: pkg.isPopular ? Colors.white : Colors.black,
                      fontSize: 9.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),

            // Card Body
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon & Name
                  Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: Colors.amber.withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Text('🪙', style: TextStyle(fontSize: 18)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _isUrdu ? pkg.packageNameUr ?? pkg.packageName : pkg.packageName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),

                  // Coins
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${pkg.totalCoins}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      if (pkg.bonusCoins > 0)
                        Text(
                          '${pkg.baseCoins} + ${pkg.bonusCoins} Bonus',
                          style: const TextStyle(
                            color: PopoTheme.gold,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      else
                        const Text(
                          'Standard Pack',
                          style: TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 10,
                          ),
                        ),
                    ],
                  ),

                  // Price Button
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? PopoTheme.gold : const Color(0xFF26263A),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${pkg.formattedPrice} ${pkg.currency}',
                      style: TextStyle(
                        color: isSelected ? Colors.black : Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
