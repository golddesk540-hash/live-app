import 'package:flutter/material.dart';
import '../../models/wallet/wallet_models.dart';
import '../../services/wallet/wallet_session_manager.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/popo_loading_indicator.dart';

/// ============================================================================
/// Popo Live — Phase 3 Prompt 05/08: Top-Up Purchase History Screen
/// Displays verified in-app purchase orders from GET /api/topup/history
/// ============================================================================
class PurchaseHistoryScreen extends StatefulWidget {
  final String userId;
  final String? authToken;
  final bool isSandbox;

  const PurchaseHistoryScreen({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.authToken,
    this.isSandbox = true,
  }) : super(key: key);

  @override
  State<PurchaseHistoryScreen> createState() => _PurchaseHistoryScreenState();
}

class _PurchaseHistoryScreenState extends State<PurchaseHistoryScreen> {
  final WalletSessionManager _manager = WalletSessionManager.instance;
  String _selectedStatus = 'all';

  @override
  void initState() {
    super.initState();
    _manager.loadPurchaseHistory(
      userId: widget.userId,
      authToken: widget.authToken,
      status: _selectedStatus,
      previewDemo: widget.isSandbox,
    );
  }

  void _onFilterChanged(String status) {
    setState(() => _selectedStatus = status);
    _manager.loadPurchaseHistory(
      userId: widget.userId,
      authToken: widget.authToken,
      status: status,
      previewDemo: widget.isSandbox,
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'successful':
      case 'completed':
        return const Color(0xFF00C853); // Green
      case 'pending':
      case 'processing':
      case 'created':
        return PopoTheme.gold; // Yellow
      case 'refunded':
      case 'reversed':
        return PopoTheme.cyan; // Cyan
      case 'failed':
      case 'cancelled':
      case 'expired':
      default:
        return PopoTheme.primary; // Red/Pink
    }
  }

  IconData _getPlatformIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'ios':
        return Icons.apple_rounded;
      case 'android':
        return Icons.android_rounded;
      default:
        return Icons.language_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _manager,
      builder: (context, _) {
        final items = _manager.purchaseHistory;

        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: AppBar(
            backgroundColor: PopoTheme.surface,
            elevation: 0,
            title: const Text(
              'Purchase Orders',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            centerTitle: true,
          ),
          body: Column(
            children: [
              // 1. Status Filter Bar
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: const BoxDecoration(
                  color: PopoTheme.surface,
                  border: Border(
                    bottom: BorderSide(color: PopoTheme.borderSubtle, width: 1),
                  ),
                ),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildFilterChip('all', 'All Orders'),
                    _buildFilterChip('successful', 'Successful'),
                    _buildFilterChip('pending', 'Pending'),
                    _buildFilterChip('failed', 'Failed'),
                    _buildFilterChip('refunded', 'Refunded'),
                  ],
                ),
              ),

              // 2. Orders List
              Expanded(
                child: _manager.isLoading
                    ? const Center(child: PopoLoadingIndicator())
                    : items.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.receipt_outlined, color: Colors.white24, size: 48),
                                SizedBox(height: 12),
                                Text(
                                  'No purchase orders found',
                                  style: TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _manager.loadPurchaseHistory(
                              userId: widget.userId,
                              authToken: widget.authToken,
                              status: _selectedStatus,
                              previewDemo: widget.isSandbox,
                            ),
                            color: PopoTheme.primary,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: items.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final record = items[index];
                                final statusColor = _getStatusColor(record.status);

                                return Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: PopoTheme.surface,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: PopoTheme.borderSubtle),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Top Row: Order ID & Status
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              Icon(_getPlatformIcon(record.platform), size: 16, color: PopoTheme.textSecondary),
                                              const SizedBox(width: 6),
                                              Text(
                                                record.orderId,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: statusColor.withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: statusColor.withOpacity(0.4)),
                                            ),
                                            child: Text(
                                              record.status.toUpperCase(),
                                              style: TextStyle(
                                                color: statusColor,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),

                                      const SizedBox(height: 10),

                                      // Middle Row: Package Info & Price
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                record.packageName,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(
                                                '${record.totalCoins} Coins (${record.baseCoins} + ${record.bonusCoins} Bonus)',
                                                style: const TextStyle(
                                                  color: PopoTheme.gold,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ],
                                          ),
                                          Text(
                                            '\$${record.amount.toStringAsFixed(2)} ${record.currency}',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                        ],
                                      ),

                                      const Divider(color: PopoTheme.borderSubtle, height: 16),

                                      // Bottom Row: Date & Provider
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            record.createdAt.toLocal().toString().split('.')[0],
                                            style: const TextStyle(
                                              color: PopoTheme.textSecondary,
                                              fontSize: 11,
                                            ),
                                          ),
                                          Text(
                                            record.providerKey,
                                            style: const TextStyle(
                                              color: PopoTheme.textSecondary,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterChip(String status, String label) {
    final isSelected = _selectedStatus == status;
    return GestureDetector(
      onTap: () => _onFilterChanged(status),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? PopoTheme.primary : PopoTheme.background,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? PopoTheme.primary : PopoTheme.borderSubtle,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : PopoTheme.textSecondary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
