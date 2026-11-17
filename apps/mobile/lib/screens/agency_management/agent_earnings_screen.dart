import 'package:flutter/material.dart';
import '../../api/api.dart';
import '../../theme/popo_theme.dart';
import 'withdrawal_screen.dart';
import 'coin_seller_screen.dart';

/// Popo Live — Phase 4 Module 8: Agent Earnings & Commission Dashboard
/// Financial Reporting, Available Balances, Commission Audit & Payout Initiation
class AgentEarningsScreen extends StatefulWidget {
  const AgentEarningsScreen({super.key});

  @override
  State<AgentEarningsScreen> createState() => _AgentEarningsScreenState();
}

class _AgentEarningsScreenState extends State<AgentEarningsScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _earningsData;
  List<dynamic> _recentEarnings = [];

  @override
  void initState() {
    super.initState();
    _fetchEarnings();
  }

  Future<void> _fetchEarnings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await AgentFinancialService.instance.getEarnings();
      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final d = res.data['earnings'] as Map<String, dynamic>? ?? {};
        setState(() {
          _earningsData = d;
          _recentEarnings = (d['recentEarnings'] as List<dynamic>?) ?? [];
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = res.error ?? 'Failed to load agent earnings.';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _earningsData ?? {};
    final availablePts = (d['availableBalancePoints'] as num?)?.toInt() ?? 0;
    final availableUsd = (d['availableUsd'] as num?)?.toDouble() ?? (availablePts / 1000);
    final totalPts = (d['totalEarningsPoints'] as num?)?.toInt() ?? 0;
    final totalUsd = (d['totalUsd'] as num?)?.toDouble() ?? (totalPts / 1000);
    final pendingPts = (d['pendingBalancePoints'] as num?)?.toInt() ?? 0;
    final pendingUsd = (d['pendingUsd'] as num?)?.toDouble() ?? (pendingPts / 1000);
    final withdrawnPts = (d['withdrawnPoints'] as num?)?.toInt() ?? 0;
    final withdrawnUsd = (d['withdrawnUsd'] as num?)?.toDouble() ?? (withdrawnPts / 1000);
    final confirmedCommPts = (d['confirmedCommissionsPoints'] as num?)?.toInt() ?? 0;
    final isEligible = d['isWithdrawalEligible'] == true;
    final ineligibilityReason = d['ineligibilityReason']?.toString();
    final role = d['role']?.toString() ?? 'agent';
    final isCoinSeller = d['isCoinSeller'] == true;
    final sellerCoins = (d['sellerCoinBalance'] as num?)?.toInt() ?? 0;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        title: const Text('Agent Earnings', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: PopoTheme.textPrimary, size: 18),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: PopoTheme.textPrimary),
            onPressed: _fetchEarnings,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: PopoTheme.gold))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, color: PopoTheme.danger, size: 48),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 14), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
                          onPressed: _fetchEarnings,
                          child: const Text('Retry', style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchEarnings,
                  color: PopoTheme.gold,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Role Badge & Status
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: PopoTheme.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: PopoTheme.borderSubtle),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: PopoTheme.gold.withOpacity(0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.shield, color: PopoTheme.gold, size: 24),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          role.toUpperCase().replaceAll('_', ' '),
                                          style: const TextStyle(color: PopoTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        if (isCoinSeller) ...[
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: PopoTheme.cyan.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text('COIN SELLER', style: TextStyle(color: PopoTheme.cyan, fontSize: 9, fontWeight: FontWeight.bold)),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Exchange Rate: 1,000 Points = \$1.00 USD',
                                      style: TextStyle(color: PopoTheme.textSecondary.withOpacity(0.8), fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Available Balance Highlight Card
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            gradient: PopoTheme.goldGradient,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(color: PopoTheme.gold.withOpacity(0.25), blurRadius: 16, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Available Earnings Balance', style: TextStyle(color: Colors.black87, fontSize: 13, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 8),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text('\$${availableUsd.toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 34, fontWeight: FontWeight.bold)),
                                  const SizedBox(width: 8),
                                  Text('USD', style: TextStyle(color: Colors.black.withOpacity(0.7), fontSize: 15, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${availablePts.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} Points',
                                style: TextStyle(color: Colors.black.withOpacity(0.85), fontSize: 13, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.black,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        padding: const EdgeInsets.symmetric(vertical: 12),
                                      ),
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(builder: (_) => const WithdrawalScreen()),
                                        ).then((_) => _fetchEarnings());
                                      },
                                      icon: const Icon(Icons.arrow_upward, color: PopoTheme.gold, size: 18),
                                      label: const Text('Withdraw', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                  if (isCoinSeller) ...[
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: Colors.black, width: 1.5),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                        ),
                                        onPressed: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(builder: (_) => const CoinSellerScreen()),
                                          ).then((_) => _fetchEarnings());
                                        },
                                        icon: const Icon(Icons.monetization_on, color: Colors.black, size: 18),
                                        label: const Text('Coin Seller', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Eligibility Banner
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: isEligible ? PopoTheme.success.withOpacity(0.1) : PopoTheme.warning.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isEligible ? PopoTheme.success.withOpacity(0.3) : PopoTheme.warning.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(isEligible ? Icons.check_circle : Icons.info_outline,
                                  color: isEligible ? PopoTheme.success : PopoTheme.warning, size: 20),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  isEligible
                                      ? 'Account is eligible for immediate withdrawal.'
                                      : (ineligibilityReason ?? 'Complete requirements to withdraw.'),
                                  style: TextStyle(
                                    color: isEligible ? PopoTheme.success : PopoTheme.warning,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Financial Metric Breakdown Grid
                        const Text('Financial Breakdown', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(child: _buildMetricCard('Total Earnings', '\$${totalUsd.toStringAsFixed(2)}', '$totalPts pts', PopoTheme.cyan, Icons.account_balance)),
                            const SizedBox(width: 10),
                            Expanded(child: _buildMetricCard('Commissions', '${confirmedCommPts.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} pts', '8% sales cut', PopoTheme.gold, Icons.percent)),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(child: _buildMetricCard('Pending Review', '\$${pendingUsd.toStringAsFixed(2)}', '$pendingPts pts', PopoTheme.warning, Icons.hourglass_top)),
                            const SizedBox(width: 10),
                            Expanded(child: _buildMetricCard('Total Withdrawn', '\$${withdrawnUsd.toStringAsFixed(2)}', '$withdrawnPts pts', PopoTheme.success, Icons.check_circle_outline)),
                          ],
                        ),
                        if (isCoinSeller) ...[
                          const SizedBox(height: 10),
                          _buildMetricCard(
                            'Seller Inventory',
                            '${sellerCoins.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} Coins',
                            'Available to transfer to customers',
                            PopoTheme.gold,
                            Icons.monetization_on,
                          ),
                        ],
                        const SizedBox(height: 24),

                        // Recent Activity
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Recent Activity', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => const WithdrawalScreen()),
                                );
                              },
                              child: const Text('View All', style: TextStyle(color: PopoTheme.cyan, fontSize: 13)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (_recentEarnings.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: PopoTheme.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: PopoTheme.borderSubtle),
                            ),
                            child: const Center(
                              child: Text('No recent earning transactions recorded.', style: TextStyle(color: PopoTheme.textSecondary, fontSize: 13)),
                            ),
                          )
                        else
                          ..._recentEarnings.map((r) {
                            final type = r['type']?.toString() ?? 'transaction';
                            final pts = (r['points'] as num?)?.toInt() ?? 0;
                            final desc = r['description']?.toString() ?? '';
                            final isCredit = pts >= 0 && !type.contains('debit');

                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: PopoTheme.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: PopoTheme.borderSubtle),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    isCredit ? Icons.add_circle_outline : Icons.remove_circle_outline,
                                    color: isCredit ? PopoTheme.success : PopoTheme.danger,
                                    size: 22,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(desc, style: const TextStyle(color: PopoTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w500)),
                                        Text(type.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(color: PopoTheme.textTertiary, fontSize: 10)),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    '${isCredit ? '+' : ''}${pts.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} pts',
                                    style: TextStyle(color: isCredit ? PopoTheme.success : PopoTheme.danger, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                ],
                              ),
                            );
                          }),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildMetricCard(String title, String value, String subtitle, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w500)),
              Icon(icon, color: color, size: 16),
            ],
          ),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(color: PopoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(subtitle, style: TextStyle(color: PopoTheme.textTertiary, fontSize: 11)),
        ],
      ),
    );
  }
}
