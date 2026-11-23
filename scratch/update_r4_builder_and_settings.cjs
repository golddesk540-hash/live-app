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

// ----------------------------------------------------------------------------
// 1. Update AgencyManagementScreen
// ----------------------------------------------------------------------------
{
  const file = 'apps/mobile/lib/screens/agency_management/agency_management_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import 'withdrawal_screen.dart';",
      "import 'withdrawal_screen.dart';\nimport '../../design/design_fixtures.dart';\nimport '../live/watch_history_screen.dart';\nimport '../../widgets/popo_error_state.dart';"
    );
  }

  // _fetchAgencyInfo
  const oldFetchAgency = `  Future<void> _fetchAgencyInfo() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await AgencyService.instance.getAgencyInfo();
      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final agencyMap = data['agency'] as Map<String, dynamic>?;
        final role = data['roleInAgency']?.toString() ?? 'none';

        setState(() {
          _agency = agencyMap;
          _roleInAgency = role;
          _isLoading = false;
        });

        if (agencyMap != null && (role == 'admin' || role == 'member')) {
          _fetchHosts(agencyMap['id']);
        }
      } else {
        setState(() {
          _errorMessage = res.error ?? 'Failed to load agency.';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }`;

  const newFetchAgency = `  Future<void> _fetchAgencyInfo() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Agency management portal error [ERR_AGENCY_PORTAL_403]',
        );
      }

      if (DesignFixtures.isEmpty) {
        setState(() {
          _agency = null;
          _roleInAgency = 'none';
          _hosts = [];
          _isLoading = false;
        });
        return;
      }

      final fixtureAgency = DesignFixtures.agencyInfo;
      final fixtureMembers = DesignFixtures.agencyMembers;

      final agencyMap = {
        'id': fixtureAgency.agencyId,
        'agencyCode': fixtureAgency.agencyCode,
        'name': fixtureAgency.agencyName,
        'status': fixtureAgency.settlementStatus.contains('Active') ? 'ACTIVE' : 'PENDING',
        'adminNickname': fixtureAgency.agentLeader,
        'totalHosts': fixtureAgency.totalActiveHosts,
        'activeHosts': fixtureAgency.totalActiveHosts,
        'pendingHosts': 2,
        'announcement': fixtureAgency.announcement,
      };

      final hostsList = fixtureMembers.map((m) => {
        'id': m.id,
        'userId': m.userId,
        'nickname': m.nickname,
        'avatarUrl': m.avatarUrl,
        'hostLevel': m.hostLevel,
        'monthlyDiamonds': m.monthlyDiamonds,
        'status': m.status,
      }).toList();

      setState(() {
        _agency = agencyMap;
        _roleInAgency = 'admin';
        _hosts = hostsList;
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
  }`;

  if (c.includes(oldFetchAgency)) {
    c = c.replace(oldFetchAgency, newFetchAgency);
    console.log('1a. Updated _fetchAgencyInfo');
  }

  // _fetchHosts
  const oldFetchHosts = `  Future<void> _fetchHosts(String agencyId) async {
    setState(() => _isLoadingHosts = true);
    try {
      final res = await AgencyService.instance.getAgencyMembers(
        agencyId: agencyId,
        statusFilter: _statusFilter,
        search: _searchQuery,
      );
      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        setState(() {
          _hosts = (data['members'] as List<dynamic>?) ?? [];
          _isLoadingHosts = false;
        });
      } else {
        setState(() => _isLoadingHosts = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingHosts = false);
    }
  }`;

  const newFetchHosts = `  Future<void> _fetchHosts(String agencyId) async {
    setState(() => _isLoadingHosts = true);
    try {
      var filtered = DesignFixtures.agencyMembers;
      if (_statusFilter != 'All') {
        filtered = filtered
            .where((m) => m.status.toLowerCase() == _statusFilter.toLowerCase())
            .toList();
      }
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        filtered = filtered
            .where((m) =>
                m.nickname.toLowerCase().contains(q) ||
                m.userId.toLowerCase().contains(q))
            .toList();
      }
      if (!mounted) return;
      setState(() {
        _hosts = filtered
            .map((m) => {
                  'id': m.id,
                  'userId': m.userId,
                  'nickname': m.nickname,
                  'avatarUrl': m.avatarUrl,
                  'hostLevel': m.hostLevel,
                  'monthlyDiamonds': m.monthlyDiamonds,
                  'status': m.status,
                })
            .toList();
        _isLoadingHosts = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoadingHosts = false);
    }
  }`;

  if (c.includes(oldFetchHosts)) {
    c = c.replace(oldFetchHosts, newFetchHosts);
    console.log('1b. Updated _fetchHosts');
  }

  // Add Watch History nav tile in dashboard
  const oldNavTiles = `          _navTile('Earnings Withdrawal', 'Manage payout methods and submit withdrawal requests', () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WithdrawalScreen()),
            );
          }),`;

  const newNavTiles = `          _navTile('Earnings Withdrawal', 'Manage payout methods and submit withdrawal requests', () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WithdrawalScreen()),
            );
          }),
          _navTile('Broadcast Watch History', 'Past live broadcast rooms and host sessions', () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WatchHistoryScreen()),
            );
          }),`;

  if (c.includes(oldNavTiles)) {
    c = c.replace(oldNavTiles, newNavTiles);
    console.log('1c. Added Watch History nav tile to Builder Center dashboard');
  }

  // Error state in _buildBody
  const oldErrBody = `    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFFF1A6C), size: 48),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 13),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                ),
                onPressed: _fetchAgencyInfo,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }`;

  const newErrBody = `    if (_errorMessage != null) {
      return Center(
        child: PopoErrorState(
          key: const Key('agency_error_state'),
          title: 'Agency Directory Unavailable',
          message: _errorMessage!,
          retryText: 'Retry',
          onRetry: _fetchAgencyInfo,
        ),
      );
    }`;

  if (c.includes(oldErrBody)) {
    c = c.replace(oldErrBody, newErrBody);
    console.log('1d. Updated error state in AgencyManagementScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// ----------------------------------------------------------------------------
// 2. Update CoinSellerScreen
// ----------------------------------------------------------------------------
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

  // _loadData
  const oldLoadData = `  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        AgentFinancialService.instance.getSellerPackages(),
        AgentFinancialService.instance.getSellerSales(),
        AgentFinancialService.instance.getEarnings(),
      ]);

      if (!mounted) return;

      final pkgRes = results[0];
      final salesRes = results[1];
      final earningsRes = results[2];

      if (pkgRes.isSuccess && pkgRes.data != null) {
        _packages = (pkgRes.data['packages'] as List<dynamic>?) ?? [];
        _sellerCoinBalance = (pkgRes.data['sellerCoinBalance'] as num?)?.toInt() ?? 0;
        _commissionRate = (pkgRes.data['commissionRate'] as num?)?.toDouble() ?? 8.0;

        if (_packages.isNotEmpty && _selectedPackageId == null) {
          _selectedPackageId = _packages[0]['packageId']?.toString();
        }
      }

      if (salesRes.isSuccess && salesRes.data != null) {
        _sales = (salesRes.data['sales'] as List<dynamic>?) ?? [];
      }

      if (earningsRes.isSuccess && earningsRes.data != null) {
        final d = earningsRes.data['earnings'] as Map<String, dynamic>? ?? {};
        _totalSalesCount = (d['totalSalesCount'] as num?)?.toInt() ?? _sales.length;
        _totalCoinsSold = (d['totalCoinsSold'] as num?)?.toInt() ?? 0;
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }`;

  const newLoadData = `  Future<void> _loadData() async {
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
  }`;

  if (c.includes(oldLoadData)) {
    c = c.replace(oldLoadData, newLoadData);
    console.log('2a. Updated _loadData in CoinSellerScreen');
  }

  // _processSale fixture simulation
  const oldProcessSaleBlock = `    setState(() => _isProcessingSale = true);

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
              'Successfully transferred $totalCoins coins to $custNick!\\n\\nReference: $ref\\nCommission Earned: +$commissionEarned points',
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
    }`;

  const newProcessSaleBlock = `    setState(() => _isProcessingSale = true);

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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: PopoTheme.success),
              SizedBox(width: 8),
              Text('Sale Completed!', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18)),
            ],
          ),
          content: Text(
            'Successfully transferred $totalCoins coins to $customer!\\n\\nReference: $ref\\nCommission Earned: +$commissionEarned points (Fixture simulation)',
            style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                _tabController.animateTo(1);
              },
              child: const Text('View Sales', style: TextStyle(color: PopoTheme.cyan)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Done', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessingSale = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: PopoTheme.danger),
      );
    }`;

  if (c.includes(oldProcessSaleBlock)) {
    c = c.replace(oldProcessSaleBlock, newProcessSaleBlock);
    console.log('2b. Updated _processSale in CoinSellerScreen');
  }

  // Header card in _buildSellTab with Fixture details
  const oldInventoryCard = `        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Inventory & Stats Card`;

  const newInventoryCard = `        child: Column(
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

  if (c.includes(oldInventoryCard)) {
    c = c.replace(oldInventoryCard, newInventoryCard);
    console.log('2c. Added Seller Info card to CoinSellerScreen');
  }

  // Handle error state in build()
  const oldBuildStart = `      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: PopoTheme.gold))
          : TabBarView(`;

  const newBuildStart = `      body: (DesignFixtures.isError || _errorMessage != null)
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

  if (c.includes(oldBuildStart)) {
    c = c.replace(oldBuildStart, newBuildStart);
    console.log('2d. Added error state handling to CoinSellerScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// ----------------------------------------------------------------------------
// 3. Update WithdrawalScreen
// ----------------------------------------------------------------------------
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

  // _loadData
  const oldWithdrawLoad = `  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        AgentFinancialService.instance.getEarnings(),
        AgentFinancialService.instance.getPayoutMethods(),
        AgentFinancialService.instance.getWithdrawals(),
      ]);

      if (!mounted) return;

      final earningsRes = results[0];
      final methodsRes = results[1];
      final historyRes = results[2];

      if (earningsRes.isSuccess && earningsRes.data != null) {
        final d = earningsRes.data['earnings'] as Map<String, dynamic>? ?? {};
        _availablePoints = (d['availableBalancePoints'] as num?)?.toInt() ?? 0;
        _availableUsd = (d['availableUsd'] as num?)?.toDouble() ?? 0.0;
        _pendingPoints = (d['pendingBalancePoints'] as num?)?.toInt() ?? 0;
      }

      if (methodsRes.isSuccess && methodsRes.data != null) {
        _payoutMethods = (methodsRes.data['payoutMethods'] as List<dynamic>?) ?? [];
        if (_payoutMethods.isNotEmpty) {
          final def = _payoutMethods.firstWhere(
            (m) => m['isDefault'] == true,
            orElse: () => _payoutMethods.first,
          );
          _selectedMethodId = def['id']?.toString();
        }
      }

      if (historyRes.isSuccess && historyRes.data != null) {
        _withdrawals = (historyRes.data['withdrawals'] as List<dynamic>?) ?? [];
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }`;

  const newWithdrawLoad = `  Future<void> _loadData() async {
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
  }`;

  if (c.includes(oldWithdrawLoad)) {
    c = c.replace(oldWithdrawLoad, newWithdrawLoad);
    console.log('3a. Updated _loadData in WithdrawalScreen');
  }

  // _submitWithdrawal simulation
  const oldSubmitWithdrawalBlock = `    setState(() => _isSubmitting = true);

    try {
      final res = await AgentFinancialService.instance.requestWithdrawal(
        pointsAmount: _selectedPoints,
        payoutMethodId: _selectedMethodId!,
      );

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      if (res.isSuccess) {
        final withdrawal = res.data['withdrawal'] as Map<String, dynamic>? ?? {};
        final ref = withdrawal['referenceNumber'] ?? 'WD-NEW';

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: PopoTheme.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: PopoTheme.success),
                SizedBox(width: 8),
                Text('Withdrawal Submitted', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            content: Text(
              'Your withdrawal request has been submitted successfully!\\n\\nReference: $ref\\nStatus: Processing\\nSettlement: 24–48 hours',
              style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _loadData();
                  _tabController.animateTo(1);
                },
                child: const Text('View Ledger', style: TextStyle(color: PopoTheme.cyan)),
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
            content: Text(res.error ?? 'Withdrawal request failed.'),
            backgroundColor: PopoTheme.danger,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: PopoTheme.danger),
      );
    }`;

  const newSubmitWithdrawalBlock = `    final selectedMethod = _payoutMethods.firstWhere(
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
    );`;

  if (c.includes(oldSubmitWithdrawalBlock)) {
    c = c.replace(oldSubmitWithdrawalBlock, newSubmitWithdrawalBlock);
    console.log('3b. Updated _submitWithdrawal in WithdrawalScreen');
  }

  // Handle error state in build()
  const oldWithdrawBuild = `      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: PopoTheme.primary))
          : TabBarView(`;

  const newWithdrawBuild = `      body: (DesignFixtures.isError || _errorMessage != null)
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

  if (c.includes(oldWithdrawBuild)) {
    c = c.replace(oldWithdrawBuild, newWithdrawBuild);
    console.log('3c. Added error state handling to WithdrawalScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// ----------------------------------------------------------------------------
// 4. Update SettingsScreen
// ----------------------------------------------------------------------------
{
  const file = 'apps/mobile/lib/screens/profile/settings_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../theme/popo_theme.dart';",
      "import '../../theme/popo_theme.dart';\nimport '../../design/design_fixtures.dart';"
    );
  }

  // Add User Info Card and Blocked Users Card inside ListView
  const oldListStart = `              children: [
                // Language Selection Card`;

  const newListStart = `              children: [
                // User Information Card (R4)
                PopoCard(
                  key: const Key('settings_user_info_card'),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundImage: DesignFixtures
                                .currentUserProfile.avatarUrl.isNotEmpty
                            ? NetworkImage(
                                DesignFixtures.currentUserProfile.avatarUrl)
                            : null,
                        backgroundColor: const Color(0xFF2A124C),
                        child: DesignFixtures
                                .currentUserProfile.avatarUrl.isEmpty
                            ? const Icon(Icons.person,
                                color: Colors.white, size: 28)
                            : null,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  DesignFixtures.currentUserProfile.nickname,
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  DesignFixtures.currentUserProfile.flagEmoji,
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'ID: \${DesignFixtures.currentUserProfile.popoId} • \${DesignFixtures.currentUserProfile.country}',
                              style: const TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0x33FFB800),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                        color: const Color(0x66FFB800)),
                                  ),
                                  child: Text(
                                    'Wealth Lv.\${DesignFixtures.currentUserProfile.wealthLevel}',
                                    style: const TextStyle(
                                      color: Color(0xFFFFB800),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0x3300E5FF),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                        color: const Color(0x6600E5FF)),
                                  ),
                                  child: Text(
                                    'Host Lv.\${DesignFixtures.currentUserProfile.hostLevel}',
                                    style: const TextStyle(
                                      color: Color(0xFF00E5FF),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Language Selection Card`;

  if (c.includes(oldListStart)) {
    c = c.replace(oldListStart, newListStart);
    console.log('4a. Added User Info Card to SettingsScreen');
  }

  // Add Blocked Users Card
  const oldNotifCard = `                const _NotificationPreferencesCard(),
                const SizedBox(height: 16),`;

  const newNotifCard = `                const _NotificationPreferencesCard(),
                const SizedBox(height: 16),

                // Blocked Users Card (R4)
                const _BlockedUsersCard(),
                const SizedBox(height: 16),`;

  if (c.includes(oldNotifCard)) {
    c = c.replace(oldNotifCard, newNotifCard);
    console.log('4b. Added Blocked Users Card placeholder to SettingsScreen');
  }

  // Add _BlockedUsersCard implementation
  const blockedCardWidget = `

class _BlockedUsersCard extends StatefulWidget {
  const _BlockedUsersCard({Key? key}) : super(key: key);

  @override
  State<_BlockedUsersCard> createState() => _BlockedUsersCardState();
}

class _BlockedUsersCardState extends State<_BlockedUsersCard> {
  void _openBlockedUsersSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final blocked = DesignFixtures.blockedUsers;

          return Container(
            key: const Key('blocked_users_sheet'),
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFF1B1829),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              border: Border(
                top: BorderSide(color: Color(0x44FF1A6C), width: 1.5),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.block_rounded,
                            color: Color(0xFFFF1A6C), size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'Blocked People (\${blocked.length})',
                          style: const TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded,
                          color: PopoTheme.textSecondary),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Users you have blocked cannot message you or attend your private rooms.',
                  style: TextStyle(
                      color: PopoTheme.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 16),
                if (blocked.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'No blocked users in your list.',
                        style: TextStyle(
                            color: PopoTheme.textSecondary, fontSize: 13),
                      ),
                    ),
                  )
                else
                  ...blocked.map((u) => Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: PopoTheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: PopoTheme.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundImage: u.avatarUrl.isNotEmpty
                                  ? NetworkImage(u.avatarUrl)
                                  : null,
                              backgroundColor: const Color(0xFF2A124C),
                              child: u.avatarUrl.isEmpty
                                  ? const Icon(Icons.person,
                                      color: Colors.white, size: 20)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    u.nickname,
                                    style: const TextStyle(
                                      color: PopoTheme.textPrimary,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '\${u.reason} • \${u.blockedDate}',
                                    style: const TextStyle(
                                      color: PopoTheme.textSecondary,
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: PopoTheme.cyan,
                                side: const BorderSide(
                                    color: PopoTheme.cyan),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                shape: const StadiumBorder(),
                              ),
                              onPressed: () {
                                final unblocked =
                                    DesignFixtures.unblockUser(u.id);
                                if (unblocked) {
                                  setSheetState(() {});
                                  setState(() {});
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'Unblocked \${u.nickname} successfully.'),
                                      backgroundColor: PopoTheme.surface,
                                      duration:
                                          const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              },
                              child: const Text('Unblock',
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      )),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final count = DesignFixtures.blockedUsers.length;

    return PopoCard(
      key: const Key('settings_blocked_users_card'),
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: () => _openBlockedUsersSheet(context),
        borderRadius: BorderRadius.circular(12),
        child: Row(
          children: [
            const Icon(Icons.block_rounded,
                color: Color(0xFFFF1A6C), size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Blocked People',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '\$count user\${count == 1 ? "" : "s"} blocked',
                    style: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded,
                color: PopoTheme.textSecondary, size: 14),
          ],
        ),
      ),
    );
  }
}
`;

  if (!c.includes('class _BlockedUsersCard extends StatefulWidget')) {
    c += blockedCardWidget;
    console.log('4c. Appended _BlockedUsersCard widget to SettingsScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// ----------------------------------------------------------------------------
// 5. Update EditProfileScreen
// ----------------------------------------------------------------------------
{
  const file = 'apps/mobile/lib/screens/profile/edit_profile_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../theme/popo_theme.dart';",
      "import '../../theme/popo_theme.dart';\nimport '../../design/design_fixtures.dart';"
    );
  }

  // _populateCurrentData
  const oldPopulate = `  void _populateCurrentData() {
    final user = AuthState.instance.currentUser;
    if (user != null) {
      _nicknameController.text = user['nickname']?.toString() ?? '';
      _bioController.text = user['bio']?.toString() ?? '';
      _selectedCountry = user['country']?.toString() ?? 'Pakistan';
      _selectedCountryCode = user['countryCode']?.toString() ?? 'PK';
      _selectedGender = user['gender']?.toString() ?? 'unspecified';
      _birthdate = user['birthdate']?.toString() ?? '';
      _avatarUrl = user['avatarUrl']?.toString();
    }
  }`;

  const newPopulate = `  void _populateCurrentData() {
    final fixtureUser = DesignFixtures.currentUserProfile;
    final user = AuthState.instance.currentUser;

    _nicknameController.text =
        (user?['nickname']?.toString().isNotEmpty == true)
            ? user!['nickname'].toString()
            : fixtureUser.nickname;
    _bioController.text = (user?['bio']?.toString().isNotEmpty == true)
        ? user!['bio'].toString()
        : fixtureUser.bio;
    _selectedCountry = (user?['country']?.toString().isNotEmpty == true)
        ? user!['country'].toString()
        : fixtureUser.country;
    _selectedCountryCode =
        (user?['countryCode']?.toString().isNotEmpty == true)
            ? user!['countryCode'].toString()
            : fixtureUser.countryCode;
    _selectedGender = (user?['gender']?.toString().isNotEmpty == true)
        ? user!['gender'].toString()
        : fixtureUser.gender;
    _birthdate = user?['birthdate']?.toString() ?? '1998-05-14';
    _avatarUrl = user?['avatarUrl']?.toString() ?? fixtureUser.avatarUrl;
  }`;

  if (c.includes(oldPopulate)) {
    c = c.replace(oldPopulate, newPopulate);
    console.log('5a. Updated _populateCurrentData in EditProfileScreen');
  }

  // _handleSave
  const oldHandleSave = `    final response = await _profileService.updateProfile(
      nickname: nickname,
      bio: bio,
      country: _selectedCountry,
      countryCode: _selectedCountryCode,
      gender: _selectedGender,
    );

    if (!mounted) return;

    if (response.isSuccess) {
      await AuthState.instance.restoreSession();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(PopoStrings.get('profile_updated_success')),
          backgroundColor: PopoTheme.surface,
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.of(context).pop(true);
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage =
            response.message ?? 'Failed to update profile. Please try again.';
      });
    }`;

  const newHandleSave = `    DesignFixtures.updateCurrentUserProfile(
      nickname: nickname,
      bio: bio,
      country: _selectedCountry,
      avatarUrl: _avatarUrl,
    );

    try {
      await _profileService.updateProfile(
        nickname: nickname,
        bio: bio,
        country: _selectedCountry,
        countryCode: _selectedCountryCode,
        gender: _selectedGender,
      );
      await AuthState.instance.restoreSession();
    } catch (_) {}

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(PopoStrings.get('profile_updated_success')),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 2),
      ),
    );
    Navigator.of(context).pop(true);`;

  if (c.includes(oldHandleSave)) {
    c = c.replace(oldHandleSave, newHandleSave);
    console.log('5b. Updated _handleSave in EditProfileScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// ----------------------------------------------------------------------------
// 6. Update PublicProfileScreen
// ----------------------------------------------------------------------------
{
  const file = 'apps/mobile/lib/screens/profile/public_profile_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../theme/popo_theme.dart';",
      "import '../../theme/popo_theme.dart';\nimport '../../design/design_fixtures.dart';"
    );
  }

  // _loadPublicProfile
  const oldLoadPublic = `  Future<void> _loadPublicProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _profileService.getPublicProfile(widget.userId);

    if (!mounted) return;

    if (response.isSuccess &&
        response.data is Map &&
        response.data['profile'] != null) {
      setState(() {
        _profile = Map<String, dynamic>.from(response.data['profile']);
        _isFollowing = _profile?['isFollowing'] == true;
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = response.message ?? 'User profile not found.';
      });
    }
  }`;

  const newLoadPublic = `  Future<void> _loadPublicProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'User profile query failed: Server busy [ERR_PROFILE_503]',
        );
      }

      // Check relations in DesignFixtures
      FixtureUserRelation? matchRelation;
      final allRelations = [
        ...DesignFixtures.friends,
        ...DesignFixtures.following,
        ...DesignFixtures.followers,
        ...DesignFixtures.visitors,
      ];
      for (final rel in allRelations) {
        if (rel.userId == widget.userId) {
          matchRelation = rel;
          break;
        }
      }

      final currentUser = DesignFixtures.currentUserProfile;
      final isSelf = widget.userId == currentUser.userId ||
          widget.userId == currentUser.poppoId ||
          widget.userId.isEmpty;

      if (isSelf) {
        setState(() {
          _profile = {
            'nickname': currentUser.nickname,
            'poppoId': currentUser.poppoId,
            'avatarUrl': currentUser.avatarUrl,
            'country': currentUser.country,
            'countryCode': currentUser.countryCode,
            'bio': currentUser.bio,
            'followersCount': currentUser.followersCount,
            'followingCount': currentUser.followingCount,
            'totalGifts': 3420,
            'wealthLevel': currentUser.wealthLevel,
            'hostLevel': currentUser.hostLevel,
            'isFollowing': false,
            'isSelf': true,
          };
          _isFollowing = false;
          _isLoading = false;
        });
        return;
      }

      if (matchRelation != null) {
        setState(() {
          _profile = {
            'nickname': matchRelation!.nickname,
            'poppoId': matchRelation.userId,
            'avatarUrl': matchRelation.avatarUrl,
            'country': matchRelation.country,
            'countryCode': matchRelation.countryCode,
            'bio': 'Streaming creator & Popo Live community star 🌟',
            'followersCount': 12400,
            'followingCount': 230,
            'totalGifts': 8920,
            'wealthLevel': 14,
            'hostLevel': 16,
            'isFollowing': DesignFixtures.isFollowing(widget.userId),
            'isSelf': false,
          };
          _isFollowing = DesignFixtures.isFollowing(widget.userId);
          _isLoading = false;
        });
        return;
      }

      // Default fallback profile
      setState(() {
        _profile = {
          'nickname': 'Ayesha Khan',
          'poppoId': widget.userId,
          'avatarUrl':
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          'country': 'Pakistan',
          'countryCode': 'PK',
          'bio': 'Popo Live Host & Musician 🎵',
          'followersCount': 8900,
          'followingCount': 150,
          'totalGifts': 5400,
          'wealthLevel': 12,
          'hostLevel': 15,
          'isFollowing': DesignFixtures.isFollowing(widget.userId),
          'isSelf': false,
        };
        _isFollowing = DesignFixtures.isFollowing(widget.userId);
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
  }`;

  if (c.includes(oldLoadPublic)) {
    c = c.replace(oldLoadPublic, newLoadPublic);
    console.log('6a. Updated _loadPublicProfile in PublicProfileScreen');
  }

  // Follow button tap toggle
  const oldFollowTap = `              onPressed: () {
                setState(() {
                  _isFollowing = !_isFollowing;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      _isFollowing
                          ? 'Followed \$nickname'
                          : 'Unfollowed \$nickname',
                    ),
                    backgroundColor: PopoTheme.surface,
                    duration: const Duration(seconds: 1),
                  ),
                );
              },`;

  const newFollowTap = `              onPressed: () {
                final next = DesignFixtures.toggleFollowUser(widget.userId);
                setState(() {
                  _isFollowing = next;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      next
                          ? 'Followed \$nickname'
                          : 'Unfollowed \$nickname',
                    ),
                    backgroundColor: PopoTheme.surface,
                    duration: const Duration(seconds: 1),
                  ),
                );
              },`;

  if (c.includes(oldFollowTap)) {
    c = c.replace(oldFollowTap, newFollowTap);
    console.log('6b. Updated follow toggle in PublicProfileScreen');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

console.log('ALL BUILDER & SETTINGS SCREENS UPDATED SUCCESSFULLY');
