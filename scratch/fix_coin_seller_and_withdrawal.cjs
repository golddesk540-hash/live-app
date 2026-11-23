const fs = require('fs');

function checkBalance(file, code) {
  let p = 0, b = 0, k = 0;
  for (const ch of code) {
    if (ch === '(') p++;
    if (ch === ')') p--;
    if (ch === '{') b++;
    if (ch === '}') b--;
    if (ch === '[') k++;
    if (ch === ']') k--;
  }
  if (p !== 0 || b !== 0 || k !== 0) {
    throw new Error(`Imbalance in ${file}: ` + JSON.stringify({ p, b, k }));
  }
}

// 1. Update CoinSellerScreen
{
  const file = 'apps/mobile/lib/screens/agency_management/coin_seller_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../theme/popo_theme.dart';",
      "import '../../theme/popo_theme.dart';\nimport '../../design/design_fixtures.dart';\nimport '../../widgets/popo_empty_state.dart';\nimport '../../widgets/popo_error_state.dart';"
    );
  }

  // Find Future<void> _loadData() async { ... }
  const loadStart = c.indexOf('  Future<void> _loadData() async {');
  const loadEnd = c.indexOf('  Future<void> _processSale() async {');
  if (loadStart !== -1 && loadEnd !== -1) {
    const newLoad = `  Future<void> _loadData() async {
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

`;
    c = c.substring(0, loadStart) + newLoad + c.substring(loadEnd);
    console.log('1a. Replaced _loadData in CoinSellerScreen');
  }

  // Replace _processSale
  const procStart = c.indexOf('  Future<void> _processSale() async {');
  const procEnd = c.indexOf('  @override\n  Widget build(BuildContext context) {');
  if (procStart !== -1 && procEnd !== -1) {
    const newProc = `  Future<void> _processSale() async {
    final customer = _customerController.text.trim();
    if (customer.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Please enter customer Poppo ID, User ID, or Phone.')),
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
    final commissionEarned =
        (priceAmount * (_commissionRate / 100) * 1000).round();

    if (_sellerCoinBalance < totalCoins) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Insufficient coin inventory. Required: $totalCoins coins, Available: $_sellerCoinBalance coins.'),
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
        title: const Text('Confirm Coin Transfer',
            style: TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Customer: $customer',
                style: const TextStyle(
                    color: PopoTheme.cyan,
                    fontWeight: FontWeight.bold,
                    fontSize: 15)),
            const SizedBox(height: 8),
            Text(
                'Coins to Deliver: \${totalCoins.toString().replaceAllMapped(RegExp(r"(\\d{1,3})(?=(\\d{3})+(?!\\d))"), (m) => "\${m[1]},")} coins',
                style: const TextStyle(color: PopoTheme.gold, fontSize: 14)),
            Text('Package Price: \\\$$priceAmount USD',
                style: const TextStyle(
                    color: PopoTheme.textSecondary, fontSize: 13)),
            const Divider(color: PopoTheme.borderSubtle, height: 20),
            Text(
                'Your Commission: +$commissionEarned pts (≈ \\\$\${(commissionEarned / 1000).toStringAsFixed(2)})',
                style: const TextStyle(
                    color: PopoTheme.success,
                    fontWeight: FontWeight.bold,
                    fontSize: 13)),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirm & Send',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isProcessingSale = true);

    try {
      final ref = 'CS-\${DateTime.now().millisecondsSinceEpoch % 100000}';
      setState(() {
        _sellerCoinBalance -= totalCoins;
        _totalCoinsSold += totalCoins;
        _totalSalesCount += 1;
        _sales.insert(0, {
          'id': 'sale_\${DateTime.now().millisecondsSinceEpoch}',
          'saleReference': ref,
          'customerNickname': customer,
          'coinsDelivered': totalCoins,
          'priceAmount': priceAmount,
          'commissionEarnedPoints': commissionEarned,
          'createdAt': 'Just now',
        });
        _isProcessingSale = false;
      });

      _customerController.clear();

      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: PopoTheme.surface,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: PopoTheme.success),
              SizedBox(width: 8),
              Text('Sale Completed!',
                  style: TextStyle(
                      color: PopoTheme.textPrimary, fontSize: 18)),
            ],
          ),
          content: Text(
            'Successfully transferred $totalCoins coins to $customer!\\n\\nReference: $ref\\nCommission Earned: +$commissionEarned points (Fixture simulation)',
            style:
                const TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                _tabController.animateTo(1);
              },
              child: const Text('View Sales',
                  style: TextStyle(color: PopoTheme.cyan)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: PopoTheme.primary),
              onPressed: () => Navigator.of(ctx).pop(),
              child:
                  const Text('Done', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessingSale = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Error: $e'), backgroundColor: PopoTheme.danger),
      );
    }
  }

`;
    c = c.substring(0, procStart) + newProc + c.substring(procEnd);
    console.log('1b. Replaced _processSale in CoinSellerScreen');
  }

  // Header card in _buildSellTab with Fixture details
  if (!c.includes('Authorized Seller Info Card (R4)')) {
    const invTarget = '        padding: const EdgeInsets.all(16),\n        child: Column(\n          crossAxisAlignment: CrossAxisAlignment.start,\n          children: [\n            // Inventory & Stats Card';
    const invReplacement = `        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Authorized Seller Info Card (R4)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E132D),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x44FFB800)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0x22FFB800),
                          border: Border.all(color: const Color(0xFFFFB800)),
                        ),
                        child: const Icon(Icons.storefront_rounded,
                            color: Color(0xFFFFB800), size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  DesignFixtures.coinSellerInfo.sellerName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.verified_rounded,
                                    color: Color(0xFF00E5FF), size: 16),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Agent: \${DesignFixtures.coinSellerInfo.agentName} • \${DesignFixtures.coinSellerInfo.verificationBadge}',
                              style: const TextStyle(
                                  color: Color(0xFFBBA9D6), fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.phone_rounded,
                          color: Color(0xFF34D399), size: 14),
                      const SizedBox(width: 6),
                      Text(
                        'WhatsApp: \${DesignFixtures.coinSellerInfo.whatsappContact}',
                        style: const TextStyle(
                          color: Color(0xFF34D399),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded,
                              color: Color(0xFFFFB800), size: 16),
                          const SizedBox(width: 3),
                          Text(
                            '\${DesignFixtures.coinSellerInfo.rating} (\${DesignFixtures.coinSellerInfo.totalOrdersCompleted} orders)',
                            style: const TextStyle(
                              color: Color(0xFFFFB800),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Accepted: \${DesignFixtures.coinSellerInfo.paymentMethods.join(" • ")}',
                    style:
                        const TextStyle(color: Color(0xFF8E7AA8), fontSize: 11),
                  ),
                ],
              ),
            ),

            // Inventory & Stats Card`;
    if (c.includes(invTarget)) {
      c = c.replace(invTarget, invReplacement);
      console.log('1c. Added Authorized Seller Info Card to CoinSellerScreen');
    }
  }

  // Error handling in build()
  const oldBody = `      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: PopoTheme.gold))
          : TabBarView(`;
  const newBody = `      body: (DesignFixtures.isError || _errorMessage != null)
          ? Center(
              child: PopoErrorState(
                key: const Key('coin_seller_error_state'),
                title: 'Seller Directory Unavailable',
                message: _errorMessage ?? 'Directory offline [ERR_SELLER_503]',
                retryText: 'Retry',
                onRetry: _loadData,
              ),
            )
          : _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: PopoTheme.gold))
              : TabBarView(`;
  if (c.includes(oldBody)) {
    c = c.replace(oldBody, newBody);
    console.log('1d. Added PopoErrorState in CoinSellerScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 2. Update WithdrawalScreen
{
  const file = 'apps/mobile/lib/screens/agency_management/withdrawal_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../theme/popo_theme.dart';",
      "import '../../theme/popo_theme.dart';\nimport '../../design/design_fixtures.dart';\nimport '../../widgets/popo_empty_state.dart';\nimport '../../widgets/popo_error_state.dart';"
    );
  }

  // Replace _loadData
  const loadStart = c.indexOf('  Future<void> _loadData() async {');
  const loadEnd = c.indexOf('  Future<void> _submitWithdrawal() async {');
  if (loadStart !== -1 && loadEnd !== -1) {
    const newLoad = `  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Withdrawal settlement ledger failed [ERR_PAYOUT_TIMEOUT]',
        );
      }

      if (DesignFixtures.isEmpty) {
        setState(() {
          _availablePoints = 0;
          _availableUsd = 0.0;
          _pendingPoints = 0;
          _payoutMethods = [];
          _selectedMethodId = null;
          _withdrawals = [];
          _isLoading = false;
        });
        return;
      }

      final fixturePoints = DesignFixtures.points.points;
      final fixtureRecords = DesignFixtures.withdrawalRecords;

      _availablePoints = fixturePoints;
      _availableUsd = fixturePoints / 1000.0;
      _pendingPoints = 30000;

      _payoutMethods = [
        {
          'id': 'pm_easypaisa',
          'provider': 'easypaisa',
          'accountTitle': 'Amina Noor',
          'accountNumber': '0300-8765432',
          'bankName': null,
          'isDefault': true,
        },
        {
          'id': 'pm_jazzcash',
          'provider': 'jazzcash',
          'accountTitle': 'Amina Noor',
          'accountNumber': '0321-9876543',
          'bankName': null,
          'isDefault': false,
        },
        {
          'id': 'pm_meezan',
          'provider': 'bank_transfer',
          'accountTitle': 'Amina Noor',
          'accountNumber': 'PK89MEZN00018839201',
          'bankName': 'Meezan Bank Ltd',
          'isDefault': false,
        },
      ];
      _selectedMethodId ??= 'pm_easypaisa';

      _withdrawals = fixtureRecords
          .map((r) => {
                'id': r.id,
                'pointsAmount': r.amountPoints,
                'usdAmount': r.amountUsd,
                'currencyAmount': r.amountPkr.toDouble(),
                'targetCurrency': 'PKR',
                'payoutMethod': {
                  'provider': r.paymentMethod,
                  'accountTitle': 'Amina Noor'
                },
                'status': r.status.toLowerCase(),
                'createdAt': r.timestamp,
              })
          .toList();

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

`;
    c = c.substring(0, loadStart) + newLoad + c.substring(loadEnd);
    console.log('2a. Replaced _loadData in WithdrawalScreen');
  }

  // Replace _submitWithdrawal
  const subStart = c.indexOf('  Future<void> _submitWithdrawal() async {');
  const subEnd = c.indexOf('  void _showAddMethodModal() {');
  if (subStart !== -1 && subEnd !== -1) {
    const newSub = `  Future<void> _submitWithdrawal() async {
    if (_selectedMethodId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or add a payout method.')),
      );
      return;
    }

    if (_selectedPoints < 10000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Minimum withdrawal is 10,000 points (\\\$10 USD).')),
      );
      return;
    }

    if (_selectedPoints > 5000000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content:
                Text('Maximum withdrawal is 5,000,000 points (\\\$5,000 USD).')),
      );
      return;
    }

    if (_selectedPoints > _availablePoints) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Withdrawal amount exceeds available points.')),
      );
      return;
    }

    final selectedMethod = _payoutMethods.firstWhere(
      (m) => m['id'] == _selectedMethodId,
      orElse: () => {'provider': 'Easypaisa'},
    );
    final methodLabel =
        '\${selectedMethod["provider"]} (\${selectedMethod["accountNumber"] ?? "Direct"})';

    setState(() => _isSubmitting = true);

    final success = DesignFixtures.submitWithdrawal(
      points: _selectedPoints,
      paymentMethod: methodLabel,
    );

    if (!success) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Withdrawal points exceed available balance.'),
          backgroundColor: PopoTheme.danger,
        ),
      );
      return;
    }

    _loadData();
    setState(() => _isSubmitting = false);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: PopoTheme.success),
            SizedBox(width: 8),
            Text('Withdrawal Submitted',
                style: TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          'Your request to withdraw \\\$\${(_selectedPoints / 1000).toStringAsFixed(2)} USD (\${_selectedPoints.toString().replaceAllMapped(RegExp(r"(\\d{1,3})(?=(\\d{3})+(?!\\d))"), (m) => "\${m[1]},")} pts) via $methodLabel has been submitted for review.\\n\\nStatus: Processing\\nSettlement: 24–48 hours (Fixture simulation)',
          style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _tabController.animateTo(1);
            },
            child: const Text('View Ledger',
                style: TextStyle(color: PopoTheme.cyan)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: PopoTheme.primary),
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Done', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

`;
    c = c.substring(0, subStart) + newSub + c.substring(subEnd);
    console.log('2b. Replaced _submitWithdrawal in WithdrawalScreen');
  }

  // Error handling in build()
  const oldWithdrawBody = `      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: PopoTheme.primary))
          : TabBarView(`;
  const newWithdrawBody = `      body: (DesignFixtures.isError || _errorMessage != null)
          ? Center(
              child: PopoErrorState(
                key: const Key('withdrawal_error_state'),
                title: 'Ledger Temporarily Unavailable',
                message: _errorMessage ?? 'Payout ledger error [ERR_PAYOUT_TIMEOUT]',
                retryText: 'Retry',
                onRetry: _loadData,
              ),
            )
          : _isLoading
              ? const Center(
                  child: CircularProgressIndicator(color: PopoTheme.primary))
              : TabBarView(`;
  if (c.includes(oldWithdrawBody)) {
    c = c.replace(oldWithdrawBody, newWithdrawBody);
    console.log('2c. Added PopoErrorState in WithdrawalScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

console.log('ALL FIXES FOR COIN SELLER & WITHDRAWAL APPLIED SUCCESSFULLY');
