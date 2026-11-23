import 'package:flutter/material.dart';
import '../../api/api.dart';
import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_error_state.dart';

/// Popo Live — Phase 4 Module 8: Authorized Coin Seller Portal
/// Coin Package Inventory, Direct User Coin Transfers, Commission Tracking & Sales Audit
class CoinSellerScreen extends StatefulWidget {
  const CoinSellerScreen({super.key});

  @override
  State<CoinSellerScreen> createState() => _CoinSellerScreenState();
}

class _CoinSellerScreenState extends State<CoinSellerScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _errorMessage;

  // Seller Inventory & Stats
  int _sellerCoinBalance = 0;
  double _commissionRate = 8.0;
  int _totalSalesCount = 0;
  int _totalCoinsSold = 0;

  // Packages & Sales
  List<dynamic> _packages = [];
  String? _selectedPackageId;
  List<dynamic> _sales = [];

  // Sell Form
  final _customerController = TextEditingController();
  bool _isProcessingSale = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _customerController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Authorized coin seller directory offline [ERR_SELLER_503]',
        );
      }

      if (DesignFixtures.isEmpty) {
        setState(() {
          _packages = [];
          _sellerCoinBalance = 0;
          _commissionRate = 8.0;
          _totalSalesCount = 0;
          _totalCoinsSold = 0;
          _sales = [];
          _isLoading = false;
        });
        return;
      }

      final seller = DesignFixtures.coinSellerInfo;
      final coinPkgs = DesignFixtures.coinPackages;

      _packages = coinPkgs
          .map((p) => {
                'packageId': p.id,
                'totalCoins': p.coins,
                'baseCoins': p.coins,
                'bonusCoins': 0,
                'priceAmount': p.priceUsd,
              })
          .toList();

      _sellerCoinBalance = 250000;
      _commissionRate = 8.0;
      _totalSalesCount = seller.totalOrdersCompleted;
      _totalCoinsSold = 18500000;

      if (_packages.isNotEmpty && _selectedPackageId == null) {
        _selectedPackageId = _packages[0]['packageId']?.toString();
      }

      _sales = [
        {
          'id': 'sale_01',
          'saleReference': 'CS-88910',
          'customerNickname': 'Sana Ali',
          'coinsDelivered': 7000,
          'priceAmount': 10.0,
          'commissionEarnedPoints': 800,
          'createdAt': 'Today, 11:20 AM',
        },
        {
          'id': 'sale_02',
          'saleReference': 'CS-88909',
          'customerNickname': 'Bilal Ahmed',
          'coinsDelivered': 35000,
          'priceAmount': 50.0,
          'commissionEarnedPoints': 4000,
          'createdAt': 'Yesterday, 04:45 PM',
        },
      ];

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('DesignFixtureException: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _processSale() async {
    final customer = _customerController.text.trim();
    if (customer.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter customer Poppo ID, User ID, or Phone.')),
      );
      return;
    }

    if (_selectedPackageId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a coin package.')),
      );
      return;
    }

    final selectedPkg = _packages.firstWhere(
      (p) => p['packageId'] == _selectedPackageId,
      orElse: () => null,
    );

    if (selectedPkg == null) return;
    final totalCoins = (selectedPkg['totalCoins'] as num?)?.toInt() ?? 0;
    final priceAmount = (selectedPkg['priceAmount'] as num?)?.toDouble() ?? 0.0;
    final commissionEarned = (priceAmount * (_commissionRate / 100) * 1000).round();

    if (_sellerCoinBalance < totalCoins) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Insufficient coin inventory. Required: $totalCoins coins, Available: $_sellerCoinBalance coins.'),
          backgroundColor: PopoTheme.danger,
        ),
      );
      return;
    }

    // Confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Coin Transfer', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Customer: $customer', style: const TextStyle(color: PopoTheme.cyan, fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 8),
            Text('Coins to Deliver: ${totalCoins.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} coins',
                style: const TextStyle(color: PopoTheme.gold, fontSize: 14)),
            Text('Package Price: \$$priceAmount USD', style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 13)),
            const Divider(color: PopoTheme.borderSubtle, height: 20),
            Text('Your Commission: +$commissionEarned pts (≈ \$${(commissionEarned / 1000).toStringAsFixed(2)})',
                style: const TextStyle(color: PopoTheme.success, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirm & Send', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isProcessingSale = true);

    try {
      final res = await AgentFinancialService.instance.sellCoins(
        customerIdentifier: customer,
        packageId: _selectedPackageId!,
      );

      if (!mounted) return;
      setState(() => _isProcessingSale = false);

      if (res.isSuccess) {
        final sale = res.data['sale'] as Map<String, dynamic>? ?? {};
        final ref = sale['saleReference'] ?? 'CS-NEW';
        final custNick = sale['customerNickname'] ?? customer;

        _customerController.clear();

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: PopoTheme.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: PopoTheme.success),
                SizedBox(width: 8),
                Text('Sale Completed!', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18)),
              ],
            ),
            content: Text(
              'Successfully transferred $totalCoins coins to $custNick!\n\nReference: $ref\nCommission Earned: +$commissionEarned points',
              style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _loadData();
                  _tabController.animateTo(1);
                },
                child: const Text('View Sales', style: TextStyle(color: PopoTheme.cyan)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _loadData();
                },
                child: const Text('Done', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.error ?? 'Coin transfer failed.'),
            backgroundColor: PopoTheme.danger,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessingSale = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: PopoTheme.danger),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        title: const Text('Coin Seller Portal', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: PopoTheme.textPrimary, size: 18),
          onPressed: () => Navigator.of(context).pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: PopoTheme.gold,
          labelColor: PopoTheme.gold,
          unselectedLabelColor: PopoTheme.textSecondary,
          tabs: const [
            Tab(text: 'Sell Coins'),
            Tab(text: 'Sales History'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: PopoTheme.gold))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildSellTab(),
                _buildHistoryTab(),
              ],
            ),
    );
  }

  Widget _buildSellTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: PopoTheme.gold,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Seller Profile Card (R4)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: PopoTheme.gold.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.verified, color: PopoTheme.gold, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DesignFixtures.coinSellerInfo.sellerName,
                          style: const TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Agent: ${DesignFixtures.coinSellerInfo.agentName} • WhatsApp: ${DesignFixtures.coinSellerInfo.whatsappContact}',
                          style: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Inventory & Stats Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF2E1C0C), Color(0xFF1A1108)],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: PopoTheme.gold.withOpacity(0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('SELLER COIN INVENTORY', style: TextStyle(color: PopoTheme.gold, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: PopoTheme.gold.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${_commissionRate.toStringAsFixed(1)}% Commission',
                          style: const TextStyle(color: PopoTheme.gold, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.monetization_on, color: PopoTheme.gold, size: 28),
                      const SizedBox(width: 8),
                      Text(
                        _sellerCoinBalance.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},'),
                        style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 6),
                      const Text('Coins', style: TextStyle(color: PopoTheme.textSecondary, fontSize: 15)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: Color(0x33FFB800), height: 1),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Completed Sales: $_totalSalesCount', style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 12)),
                      Text('Total Delivered: ${_totalCoinsSold.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} coins',
                          style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Target Customer Section
            const Text('Customer Identifier', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: TextField(
                controller: _customerController,
                style: const TextStyle(color: PopoTheme.textPrimary, fontSize: 15),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  hintText: 'Enter Poppo ID, User ID, Phone, or Email',
                  hintStyle: TextStyle(color: PopoTheme.textTertiary, fontSize: 14),
                  icon: Icon(Icons.person_search, color: PopoTheme.cyan, size: 22),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Package Selection Section
            const Text('Select Coin Package', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            if (_packages.isEmpty)
              const Center(child: Text('No active coin packages available.', style: TextStyle(color: PopoTheme.textSecondary)))
            else
              ..._packages.map((pkg) {
                final isSelected = _selectedPackageId == pkg['packageId'];
                final totalCoins = (pkg['totalCoins'] as num?)?.toInt() ?? 0;
                final baseCoins = (pkg['baseCoins'] as num?)?.toInt() ?? 0;
                final bonusCoins = (pkg['bonusCoins'] as num?)?.toInt() ?? 0;
                final price = (pkg['priceAmount'] as num?)?.toDouble() ?? 0.0;
                final isPopular = pkg['isPopular'] == true;
                final commPoints = (price * (_commissionRate / 100) * 1000).round();

                return GestureDetector(
                  onTap: () => setState(() => _selectedPackageId = pkg['packageId']),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected ? PopoTheme.gold.withOpacity(0.1) : PopoTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? PopoTheme.gold : PopoTheme.borderSubtle,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Radio<String>(
                          value: pkg['packageId'] ?? '',
                          groupValue: _selectedPackageId,
                          activeColor: PopoTheme.gold,
                          onChanged: (val) => setState(() => _selectedPackageId = val),
                        ),
                        const Icon(Icons.monetization_on, color: PopoTheme.gold, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    '${totalCoins.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} Coins',
                                    style: const TextStyle(color: PopoTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  if (bonusCoins > 0) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: PopoTheme.success.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                                      child: Text('+$bonusCoins BONUS', style: const TextStyle(color: PopoTheme.success, fontSize: 9, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                  if (isPopular) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: PopoTheme.primary.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                                      child: const Text('HOT', style: TextStyle(color: PopoTheme.primary, fontSize: 9, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Seller Commission: +$commPoints pts (≈ \$${(commPoints / 1000).toStringAsFixed(2)})',
                                style: const TextStyle(color: PopoTheme.success, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: PopoTheme.surfaceLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '\$${price.toStringAsFixed(2)}',
                            style: const TextStyle(color: PopoTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),

            const SizedBox(height: 28),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: PopoTheme.gold,
                  disabledBackgroundColor: PopoTheme.surfaceLight,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 4,
                ),
                onPressed: (_isProcessingSale || _sellerCoinBalance <= 0) ? null : _processSale,
                child: _isProcessingSale
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2))
                    : const Text(
                        'Transfer Coins to Customer',
                        style: TextStyle(color: Colors.black, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: PopoTheme.gold,
      child: _sales.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long, color: PopoTheme.textSecondary, size: 48),
                  SizedBox(height: 12),
                  Text('No coin sales recorded yet.', style: TextStyle(color: PopoTheme.textSecondary, fontSize: 14)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _sales.length,
              itemBuilder: (ctx, index) {
                final s = _sales[index];
                final ref = s['saleReference']?.toString() ?? 'CS-REF';
                final custNick = s['customerNickname']?.toString() ?? 'Customer';
                final custPoppo = s['customerPoppoId']?.toString() ?? '';
                final coins = (s['coinsAmount'] as num?)?.toInt() ?? 0;
                final commPoints = (s['commissionPoints'] as num?)?.toInt() ?? 0;
                final fiat = (s['fiatAmount'] as num?)?.toDouble() ?? 0.0;
                final created = s['createdAt']?.toString() ?? '';

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: PopoTheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: PopoTheme.borderSubtle),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(ref, style: const TextStyle(color: PopoTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: PopoTheme.success.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('DELIVERED', style: TextStyle(color: PopoTheme.success, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: PopoTheme.surfaceLight,
                            child: Text(
                              custNick.isNotEmpty ? custNick[0].toUpperCase() : 'U',
                              style: const TextStyle(color: PopoTheme.cyan, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(custNick, style: const TextStyle(color: PopoTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                                Text('ID: $custPoppo • ${created.length > 10 ? created.substring(0, 10) : created}',
                                    style: const TextStyle(color: PopoTheme.textTertiary, fontSize: 11)),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${coins.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} coins',
                                style: const TextStyle(color: PopoTheme.gold, fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                              Text('+\$$commPoints pts comm', style: const TextStyle(color: PopoTheme.success, fontSize: 11)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
