import 'package:flutter/material.dart';
import '../../models/wallet/wallet_models.dart';
import '../../services/wallet/wallet_session_manager.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/popo_loading_indicator.dart';

/// ============================================================================
/// Popo Live — Phase 3 Prompt 05/08: Wallet Coin Transaction History Screen
/// Displays coin ledger transactions from GET /api/wallet/coins/history
/// ============================================================================
class TransactionHistoryScreen extends StatefulWidget {
  final String userId;
  final String? authToken;
  final bool isSandbox;

  const TransactionHistoryScreen({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.authToken,
    this.isSandbox = true,
  }) : super(key: key);

  @override
  State<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  final WalletSessionManager _manager = WalletSessionManager.instance;
  String _selectedFilter = 'all';

  @override
  void initState() {
    super.initState();
    _manager.loadCoinTransactions(
      userId: widget.userId,
      authToken: widget.authToken,
      status: _selectedFilter,
      previewDemo: widget.isSandbox,
    );
  }

  void _onFilterChanged(String filter) {
    setState(() => _selectedFilter = filter);
    _manager.loadCoinTransactions(
      userId: widget.userId,
      authToken: widget.authToken,
      status: filter,
      previewDemo: widget.isSandbox,
    );
  }

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'topup':
      case 'purchase':
        return Icons.add_card_rounded;
      case 'gift_sent':
        return Icons.card_giftcard_rounded;
      case 'reversal':
        return Icons.undo_rounded;
      case 'admin_credit':
        return Icons.admin_panel_settings_rounded;
      default:
        return Icons.monetization_on_rounded;
    }
  }

  String _formatTypeName(String type) {
    switch (type.toLowerCase()) {
      case 'topup':
        return 'Coin Top-Up';
      case 'gift_sent':
        return 'Gift Sent';
      case 'reversal':
        return 'Transaction Reversal';
      case 'admin_credit':
        return 'Admin Credit';
      case 'admin_debit':
        return 'Admin Debit';
      default:
        return type.replaceAll('_', ' ').toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _manager,
      builder: (context, _) {
        final txns = _manager.coinTransactions;

        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: AppBar(
            backgroundColor: PopoTheme.surface,
            elevation: 0,
            title: const Text(
              'Coin Transactions',
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
              // 1. Transaction Category Filter
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
                    _buildFilterChip('all', 'All Transactions'),
                    _buildFilterChip('gift_sent', 'Gifts Sent'),
                    _buildFilterChip('topup', 'Top-Ups'),
                    _buildFilterChip('reversal', 'Reversals'),
                  ],
                ),
              ),

              // 2. Transactions List
              Expanded(
                child: _manager.isLoading
                    ? const Center(child: PopoLoadingIndicator())
                    : txns.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.history_rounded, color: Colors.white24, size: 48),
                                SizedBox(height: 12),
                                Text(
                                  'No coin transactions found',
                                  style: TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => _manager.loadCoinTransactions(
                              userId: widget.userId,
                              authToken: widget.authToken,
                              status: _selectedFilter,
                              previewDemo: widget.isSandbox,
                            ),
                            color: PopoTheme.primary,
                            child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: txns.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final txn = txns[index];
                                final isCredit = txn.isCredit;
                                final amountColor = isCredit ? const Color(0xFF00C853) : PopoTheme.primary;
                                final amountPrefix = isCredit ? '+' : '-';

                                return Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: PopoTheme.surface,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: PopoTheme.borderSubtle),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      // Leading Icon
                                      Container(
                                        width: 42,
                                        height: 42,
                                        decoration: BoxDecoration(
                                          color: isCredit
                                              ? const Color(0xFF00C853).withOpacity(0.12)
                                              : PopoTheme.primary.withOpacity(0.12),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          _getTypeIcon(txn.transactionType),
                                          color: isCredit ? const Color(0xFF00C853) : PopoTheme.primary,
                                          size: 20,
                                        ),
                                      ),

                                      const SizedBox(width: 14),

                                      // Middle Details
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              _formatTypeName(txn.transactionType),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            if (txn.description != null && txn.description!.isNotEmpty)
                                              Text(
                                                txn.description!,
                                                style: const TextStyle(
                                                  color: PopoTheme.textSecondary,
                                                  fontSize: 11,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            const SizedBox(height: 3),
                                            Text(
                                              txn.createdAt.toLocal().toString().split('.')[0],
                                              style: const TextStyle(
                                                color: PopoTheme.textSecondary,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      const SizedBox(width: 10),

                                      // Trailing Coins & Balance
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            '$amountPrefix${txn.coinAmount} 🪙',
                                            style: TextStyle(
                                              color: amountColor,
                                              fontSize: 15,
                                              fontWeight: FontWeight.w900,
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            'Bal: ${txn.newBalance}',
                                            style: const TextStyle(
                                              color: PopoTheme.textSecondary,
                                              fontSize: 10.5,
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

  Widget _buildFilterChip(String filter, String label) {
    final isSelected = _selectedFilter == filter;
    return GestureDetector(
      onTap: () => _onFilterChanged(filter),
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
