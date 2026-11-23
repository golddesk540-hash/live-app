import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/wallet/financial_models.dart';
import '../../services/wallet/financial_service.dart';
import 'transaction_details_screen.dart';

class FinancialTransactionsScreen extends StatefulWidget {
  final String? initialCategory;
  final String? apiBaseUrl;

  const FinancialTransactionsScreen({
    Key? key,
    this.initialCategory,
    this.apiBaseUrl,
  }) : super(key: key);

  @override
  State<FinancialTransactionsScreen> createState() => _FinancialTransactionsScreenState();
}

class _FinancialTransactionsScreenState extends State<FinancialTransactionsScreen> {
  late final FinancialService _financialService;
  late final NumberFormat _currencyFmt;
  late final NumberFormat _numFmt;
  late final DateFormat _dateFmt;

  String _selectedCategory = 'all';
  String _selectedStatus = 'all';
  String _selectedPreset = 'all';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;
  List<FinancialTransactionItem> _transactions = [];
  FinancialHistorySummary _summary = const FinancialHistorySummary();
  int _currentPage = 1;
  int _totalPages = 1;

  final List<Map<String, String>> _categories = const [
    {'key': 'all', 'label': 'All', 'labelUr': 'تمام'},
    {'key': 'topup', 'label': 'Coin Top-up', 'labelUr': 'سکے ٹاپ اپ'},
    {'key': 'gift_sent', 'label': 'Gifts Sent', 'labelUr': 'تحائف'},
    {'key': 'earnings', 'label': 'Host Earnings', 'labelUr': 'ہوسٹ آمدنی'},
    {'key': 'vip', 'label': 'VIP & Subs', 'labelUr': 'وی آئی پی'},
    {'key': 'refunds', 'label': 'Refunds & Reversals', 'labelUr': 'واپسیاں'},
    {'key': 'reversal', 'label': 'Adjustments', 'labelUr': 'ایڈجسٹمنٹ'},
  ];

  final List<Map<String, String>> _datePresets = const [
    {'key': 'all', 'label': 'All Time'},
    {'key': 'today', 'label': 'Today'},
    {'key': '7d', 'label': 'Past 7 Days'},
    {'key': '30d', 'label': 'Past 30 Days'},
  ];

  @override
  void initState() {
    super.initState();
    _financialService = FinancialService(baseUrl: widget.apiBaseUrl ?? 'http://localhost:3000');
    _currencyFmt = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    _numFmt = NumberFormat('#,###');
    _dateFmt = DateFormat('MMM d, yyyy • h:mm a');

    if (widget.initialCategory != null) {
      _selectedCategory = widget.initialCategory!;
    }

    _loadFinancialHistory();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _financialService.dispose();
    super.dispose();
  }

  Future<void> _loadFinancialHistory({bool resetPage = false}) async {
    if (resetPage) {
      _currentPage = 1;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await _financialService.getFinancialHistory(
      category: _selectedCategory,
      status: _selectedStatus,
      search: _searchQuery.isNotEmpty ? _searchQuery : null,
      preset: _selectedPreset,
      page: _currentPage,
      limit: 20,
      previewDemo: true,
    );

    if (!mounted) return;

    if (res.isSuccess && res.data != null) {
      final items = res.data!['items'] as List<FinancialTransactionItem>;
      final summary = res.data!['summary'] as FinancialHistorySummary;
      final pagination = res.data!['pagination'] as Map<String, dynamic>;

      setState(() {
        _isLoading = false;
        _transactions = items;
        _summary = summary;
        _totalPages = (pagination['totalPages'] as num?)?.toInt() ?? 1;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = res.errorMessage ?? 'Failed to load financial transaction records';
      });
    }
  }

  void _showReconciliationDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF141423),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return _WalletReconciliationSheet(
          financialService: _financialService,
          onReconciliationCompleted: () => _loadFinancialHistory(resetPage: true),
        );
      },
    );
  }

  void _showPurchaseRecoveryDialog() {
    showDialog(
      context: context,
      builder: (ctx) {
        return _PurchaseRecoveryDialog(
          financialService: _financialService,
          onRecovered: () => _loadFinancialHistory(resetPage: true),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF141423),
        elevation: 0,
        title: const Text(
          'Financial Ledger & Receipts',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Reconcile Wallet',
            icon: const Icon(Icons.sync_problem_rounded, color: Color(0xFFFF9500)),
            onPressed: _showReconciliationDialog,
          ),
          IconButton(
            tooltip: 'Recover Purchases',
            icon: const Icon(Icons.history_toggle_off_rounded, color: Color(0xFF00E676)),
            onPressed: _showPurchaseRecoveryDialog,
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
            onPressed: () => _loadFinancialHistory(resetPage: true),
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. Summary KPI Bar
          _buildSummaryBar(),

          // 2. Search & Date Presets Filter
          _buildFilterBar(),

          // 3. Category Filter Chips
          _buildCategoryChips(),

          // 4. Main Transaction List View
          Expanded(
            child: _buildTransactionBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF18182B),
        border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.06))),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildSummaryMetricItem(
              label: 'Cash Spent',
              value: _currencyFmt.format(_summary.totalVerifiedTopupPaymentAmount),
              icon: Icons.payments_rounded,
              color: const Color(0xFF00E676),
            ),
          ),
          Container(width: 1, height: 36, color: Colors.white.withOpacity(0.08)),
          Expanded(
            child: _buildSummaryMetricItem(
              label: 'Coins Top-up',
              value: _numFmt.format(_summary.totalTopupCoinsReceived),
              icon: Icons.monetization_on_rounded,
              color: const Color(0xFFFFD700),
            ),
          ),
          Container(width: 1, height: 36, color: Colors.white.withOpacity(0.08)),
          Expanded(
            child: _buildSummaryMetricItem(
              label: 'Gift Coins',
              value: _numFmt.format(_summary.totalGiftCoinsSent),
              icon: Icons.card_giftcard_rounded,
              color: const Color(0xFFFF2A85),
            ),
          ),
          Container(width: 1, height: 36, color: Colors.white.withOpacity(0.08)),
          Expanded(
            child: _buildSummaryMetricItem(
              label: 'Host Points (70%)',
              value: _numFmt.format(_summary.totalHostPointsCredited),
              icon: Icons.diamond_rounded,
              color: const Color(0xFF2979FF),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryMetricItem({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white.withOpacity(0.6),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: [
          // Search Field
          Expanded(
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E34),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Search by record ID, title or receipt...',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 13),
                  prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Colors.white54),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 16, color: Colors.white54),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _searchQuery = '');
                            _loadFinancialHistory(resetPage: true);
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
                onSubmitted: (val) {
                  setState(() => _searchQuery = val.trim());
                  _loadFinancialHistory(resetPage: true);
                },
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Date Presets Dropdown
          Container(
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF1E1E34),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedPreset,
                dropdownColor: const Color(0xFF1E1E34),
                icon: const Icon(Icons.filter_list_rounded, color: Colors.white70, size: 18),
                style: const TextStyle(color: Colors.white, fontSize: 12),
                items: _datePresets.map((p) {
                  return DropdownMenuItem<String>(
                    value: p['key'],
                    child: Text(p['label']!),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null && val != _selectedPreset) {
                    setState(() => _selectedPreset = val);
                    _loadFinancialHistory(resetPage: true);
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChips() {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (ctx, i) {
          final cat = _categories[i];
          final isSelected = _selectedCategory == cat['key'];
          return ChoiceChip(
            label: Text(cat['label']!),
            selected: isSelected,
            onSelected: (selected) {
              if (selected) {
                setState(() => _selectedCategory = cat['key']!);
                _loadFinancialHistory(resetPage: true);
              }
            },
            backgroundColor: const Color(0xFF1E1E34),
            selectedColor: const Color(0xFF7C4DFF),
            labelStyle: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? Colors.white : Colors.white70,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(
                color: isSelected ? const Color(0xFF7C4DFF) : Colors.white.withOpacity(0.08),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTransactionBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF7C4DFF)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFFF5252), size: 48),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => _loadFinancialHistory(resetPage: true),
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C4DFF),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_transactions.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.receipt_long_rounded, size: 54, color: Colors.white.withOpacity(0.2)),
            const SizedBox(height: 12),
            Text(
              'No financial transactions found',
              style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 15),
            ),
            const SizedBox(height: 4),
            Text(
              'Verified top-ups, gifts, host earnings and refunds will appear here.',
              style: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 12),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: const Color(0xFF7C4DFF),
      backgroundColor: const Color(0xFF1E1E34),
      onRefresh: () => _loadFinancialHistory(resetPage: true),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: _transactions.length + (_totalPages > 1 ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (ctx, i) {
          if (i == _transactions.length) {
            return _buildPaginationBar();
          }
          final item = _transactions[i];
          return _buildTransactionCard(item);
        },
      ),
    );
  }

  Widget _buildTransactionCard(FinancialTransactionItem item) {
    // Determine category styling
    Color categoryColor = const Color(0xFF2979FF);
    IconData categoryIcon = Icons.swap_horiz_rounded;

    if (item.isTopup) {
      categoryColor = const Color(0xFF00E676);
      categoryIcon = Icons.add_circle_outline_rounded;
    } else if (item.isGiftSent) {
      categoryColor = const Color(0xFFFF2A85);
      categoryIcon = Icons.card_giftcard_rounded;
    } else if (item.isHostShare) {
      categoryColor = const Color(0xFF2979FF);
      categoryIcon = Icons.diamond_rounded;
    } else if (item.isVip) {
      categoryColor = const Color(0xFFFFD700);
      categoryIcon = Icons.workspace_premium_rounded;
    } else if (item.isRefundCategory) {
      categoryColor = const Color(0xFFFF9500);
      categoryIcon = Icons.undo_rounded;
    }

    // Determine status badge
    Color statusColor = const Color(0xFF00E676);
    if (item.isPending) statusColor = const Color(0xFFFF9500);
    if (item.isFailed) statusColor = const Color(0xFFFF5252);
    if (item.isCancelled) statusColor = Colors.grey;
    if (item.isRefunded) statusColor = const Color(0xFFFF9500);

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => TransactionDetailsScreen(
              transactionItem: item,
              receiptId: item.receiptId,
              apiBaseUrl: widget.apiBaseUrl,
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF18182B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.06)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Category Icon, Title, Status Chip
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: categoryColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(categoryIcon, color: categoryColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _dateFmt.format(item.issuedAt),
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.45),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withOpacity(0.4)),
                  ),
                  child: Text(
                    item.status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Description
            if (item.description.isNotEmpty)
              Text(
                item.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.65),
                  fontSize: 12,
                ),
              ),

            const SizedBox(height: 10),
            Divider(color: Colors.white.withOpacity(0.06), height: 1),
            const SizedBox(height: 10),

            // Financial Metrics Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Payment / Provider
                Row(
                  children: [
                    Icon(Icons.credit_card_rounded, size: 13, color: Colors.white.withOpacity(0.4)),
                    const SizedBox(width: 4),
                    Text(
                      item.paymentMethod.replaceAll('_', ' ').toUpperCase(),
                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
                    ),
                    if (item.receiptEligible) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7C4DFF).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'RECEIPT',
                          style: TextStyle(color: Color(0xFFB388FF), fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ],
                ),

                // Amount / Coins Display
                Row(
                  children: [
                    if (item.paymentAmount > 0)
                      Text(
                        _currencyFmt.format(item.paymentAmount),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    if (item.coinQuantity > 0) ...[
                      const SizedBox(width: 6),
                      Text(
                        '${item.isGiftSent ? '-' : '+'}${_numFmt.format(item.coinQuantity)} coins',
                        style: TextStyle(
                          color: item.isGiftSent ? const Color(0xFFFF2A85) : const Color(0xFFFFD700),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                    if (item.pointsQuantity > 0) ...[
                      const SizedBox(width: 6),
                      Text(
                        '+${_numFmt.format(item.pointsQuantity)} pts',
                        style: const TextStyle(
                          color: Color(0xFF2979FF),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaginationBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_rounded, size: 16, color: Colors.white70),
            onPressed: _currentPage > 1
                ? () {
                    setState(() => _currentPage--);
                    _loadFinancialHistory();
                  }
                : null,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Page $_currentPage of $_totalPages',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.white70),
            onPressed: _currentPage < _totalPages
                ? () {
                    setState(() => _currentPage++);
                    _loadFinancialHistory();
                  }
                : null,
          ),
        ],
      ),
    );
  }
}

/// Bottom Sheet for Server-Authoritative Wallet Reconciliation
class _WalletReconciliationSheet extends StatefulWidget {
  final FinancialService financialService;
  final VoidCallback onReconciliationCompleted;

  const _WalletReconciliationSheet({
    Key? key,
    required this.financialService,
    required this.onReconciliationCompleted,
  }) : super(key: key);

  @override
  State<_WalletReconciliationSheet> createState() => _WalletReconciliationSheetState();
}

class _WalletReconciliationSheetState extends State<_WalletReconciliationSheet> {
  bool _isLoading = true;
  String? _errorMessage;
  WalletReconciliationReport? _report;
  final NumberFormat _numFmt = NumberFormat('#,###');

  @override
  void initState() {
    super.initState();
    _runReconciliation();
  }

  Future<void> _runReconciliation({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await widget.financialService.reconcileWallet(
      forceRefresh: forceRefresh,
      previewDemo: true,
    );

    if (!mounted) return;

    if (res.isSuccess && res.data != null) {
      setState(() {
        _isLoading = false;
        _report = res.data!;
      });
      widget.onReconciliationCompleted();
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = res.errorMessage ?? 'Reconciliation check failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.82),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Wallet Reconciliation Audit',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Colors.white70),
                onPressed: () => _runReconciliation(forceRefresh: true),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Server-authoritative ledger verification between confirmed purchases, gift deductions, host shares and current balance.',
            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
          ),
          const SizedBox(height: 16),

          // Body
          Expanded(
            child: _buildReconciliationContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildReconciliationContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF7C4DFF)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, color: Color(0xFFFF5252), size: 40),
            const SizedBox(height: 8),
            Text(_errorMessage!, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => _runReconciliation(forceRefresh: true),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final rep = _report!;
    final isBalanced = rep.isBalanced;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isBalanced
                  ? const Color(0xFF00E676).withOpacity(0.12)
                  : const Color(0xFFFF9500).withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isBalanced ? const Color(0xFF00E676) : const Color(0xFFFF9500),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  isBalanced ? Icons.check_circle_rounded : Icons.warning_rounded,
                  color: isBalanced ? const Color(0xFF00E676) : const Color(0xFFFF9500),
                  size: 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isBalanced ? 'WALLET BALANCED & VERIFIED' : 'ATTENTION REQUIRED',
                        style: TextStyle(
                          color: isBalanced ? const Color(0xFF00E676) : const Color(0xFFFF9500),
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isBalanced
                            ? 'All confirmed top-ups, deductions and 70/30 host splits perfectly match.'
                            : '${rep.issues.length} discrepancies or pending transactions detected.',
                        style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Audit Breakdown Table
          const Text(
            'Ledger Breakdown',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          _buildAuditRow('Authoritative Balance', '${_numFmt.format(rep.currentCoins)} coins', isBold: true),
          _buildAuditRow('Total Top-up Purchased', '+${_numFmt.format(rep.totalPurchasedCoins)} coins'),
          _buildAuditRow('Gift Deductions Spent', '-${_numFmt.format(rep.totalGiftCoinsSpent)} coins'),
          _buildAuditRow('Store & VIP Expenditures', '-${_numFmt.format(rep.totalStoreVipCoinsSpent)} coins'),
          _buildAuditRow('Refunded & Reversed', '-${_numFmt.format(rep.totalRefundedCoins)} coins'),
          _buildAuditRow('Expected Ledger Balance', '${_numFmt.format(rep.expectedCoins)} coins', isBold: true),
          _buildAuditRow('Discrepancy (Current - Expected)', '${rep.discrepancyCoins > 0 ? "+" : ""}${_numFmt.format(rep.discrepancyCoins)} coins',
              highlight: rep.discrepancyCoins != 0),

          const SizedBox(height: 16),

          // Integrity Checks
          const Text(
            'Integrity Verification',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          _buildAuditRow('Missing Credits', rep.missingCreditsCount.toString(),
              highlight: rep.missingCreditsCount > 0),
          _buildAuditRow('Duplicate Credits (Idempotency)', rep.duplicateCreditsCount.toString(),
              highlight: rep.duplicateCreditsCount > 0),
          _buildAuditRow('Duplicate Deductions', rep.duplicateDeductionsCount.toString(),
              highlight: rep.duplicateDeductionsCount > 0),
          _buildAuditRow('Pending Unverified Purchases', rep.pendingTransactionsCount.toString()),

          const SizedBox(height: 16),

          // 70/30 Revenue Sharing Audit
          const Text(
            '70/30 Revenue Sharing Audit',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          _buildAuditRow('Host Share Rule', '${rep.hostSharePercent.toStringAsFixed(0)}% to Host'),
          _buildAuditRow('Platform Share Rule', '${rep.platformSharePercent.toStringAsFixed(0)}% to Platform'),
          _buildAuditRow('Confirmed Gift Revenue', '${_numFmt.format(rep.confirmedGiftCoins)} coins'),
          _buildAuditRow('Host Points Credited (70%)', '${_numFmt.format(rep.hostPointsCredited)} diamonds'),
          _buildAuditRow('Platform Share Credited (30%)', '${_numFmt.format(rep.platformCoinsCredited)} coins'),
          _buildAuditRow('Formula Integrity', rep.ruleFormulaVerified ? 'VERIFIED ✓' : 'FAILED ✗',
              highlight: !rep.ruleFormulaVerified),

          const SizedBox(height: 20),

          // Close / Done CTA
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C4DFF),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Close Audit', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAuditRow(String label, String value, {bool isBold = false, bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: highlight ? const Color(0xFFFF5252) : Colors.white,
              fontSize: 12,
              fontWeight: isBold || highlight ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

/// Dialog for Interrupted In-App Purchase Recovery
class _PurchaseRecoveryDialog extends StatefulWidget {
  final FinancialService financialService;
  final VoidCallback onRecovered;

  const _PurchaseRecoveryDialog({
    Key? key,
    required this.financialService,
    required this.onRecovered,
  }) : super(key: key);

  @override
  State<_PurchaseRecoveryDialog> createState() => _PurchaseRecoveryDialogState();
}

class _PurchaseRecoveryDialogState extends State<_PurchaseRecoveryDialog> {
  bool _isRecovering = false;
  String? _resultMessage;
  bool _isSuccess = false;

  Future<void> _startRecovery() async {
    setState(() {
      _isRecovering = true;
      _resultMessage = null;
    });

    final res = await widget.financialService.recoverPendingPurchases(
      simulateRecovery: true,
      previewDemo: true,
    );

    if (!mounted) return;

    if (res.isSuccess && res.data != null) {
      final data = res.data!;
      setState(() {
        _isRecovering = false;
        _isSuccess = true;
        _resultMessage = 'Recovery complete: Checked ${data.totalPendingChecked} pending orders. ${data.recoveredCount} purchase(s) recovered and verified.';
      });
      widget.onRecovered();
    } else {
      setState(() {
        _isRecovering = false;
        _isSuccess = false;
        _resultMessage = res.errorMessage ?? 'Purchase recovery failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF1E1E34),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Row(
        children: [
          Icon(Icons.history_toggle_off_rounded, color: Color(0xFF00E676)),
          SizedBox(width: 8),
          Text('Purchase Recovery', style: TextStyle(color: Colors.white, fontSize: 16)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'If your coin purchase was interrupted by network loss or a client crash, this tool scans the backend for unconfirmed Google Play and Apple StoreKit transactions and recovers them safely.',
            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13),
          ),
          if (_resultMessage != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _isSuccess
                    ? const Color(0xFF00E676).withOpacity(0.12)
                    : const Color(0xFFFF5252).withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _resultMessage!,
                style: TextStyle(
                  color: _isSuccess ? const Color(0xFF00E676) : const Color(0xFFFF5252),
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close', style: TextStyle(color: Colors.white60)),
        ),
        ElevatedButton(
          onPressed: _isRecovering ? null : _startRecovery,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E676)),
          child: _isRecovering
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                )
              : const Text('Start Recovery', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
