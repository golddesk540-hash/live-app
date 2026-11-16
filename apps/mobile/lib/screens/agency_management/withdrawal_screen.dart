import 'package:flutter/material.dart';
import '../../api/api.dart';
import '../../theme/popo_theme.dart';

/// Popo Live — Phase 4 Module 8: Agent & Host Withdrawal Screen
/// Payout Method Management (JazzCash, Easypaisa, Bank Transfer) & Secure Funds Withdrawal
class WithdrawalScreen extends StatefulWidget {
  const WithdrawalScreen({super.key});

  @override
  State<WithdrawalScreen> createState() => _WithdrawalScreenState();
}

class _WithdrawalScreenState extends State<WithdrawalScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _errorMessage;

  // Earnings & Balance
  int _availablePoints = 0;
  double _availableUsd = 0.0;
  int _pendingPoints = 0;

  // Payout Methods
  List<dynamic> _payoutMethods = [];
  String? _selectedMethodId;

  // Withdrawals History
  List<dynamic> _withdrawals = [];
  bool _isLoadingHistory = false;

  // Form
  final _amountController = TextEditingController();
  int _selectedPoints = 10000;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _amountController.text = '10000';
    _amountController.addListener(_onAmountChanged);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _onAmountChanged() {
    final parsed = int.tryParse(_amountController.text.trim()) ?? 0;
    setState(() {
      _selectedPoints = parsed;
    });
  }

  Future<void> _loadData() async {
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
  }

  Future<void> _submitWithdrawal() async {
    if (_selectedMethodId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or add a payout method.')),
      );
      return;
    }

    if (_selectedPoints < 10000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Minimum withdrawal is 10,000 points (\$10 USD).')),
      );
      return;
    }

    if (_selectedPoints > 5000000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum withdrawal is 5,000,000 points (\$5,000 USD).')),
      );
      return;
    }

    if (_selectedPoints > _availablePoints) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Withdrawal amount exceeds available points.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final res = await AgentFinancialService.instance.requestWithdrawal(
        pointsAmount: _selectedPoints,
        payoutMethodId: _selectedMethodId!,
      );

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      if (res.isSuccess) {
        final w = res.data['withdrawal'] as Map<String, dynamic>? ?? {};
        final ref = w['withdrawalReference'] ?? 'WTH-NEW';
        final fiat = w['fiatAmount'] ?? (_selectedPoints / 1000).toStringAsFixed(2);

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: PopoTheme.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: PopoTheme.success),
                SizedBox(width: 8),
                Text('Request Submitted', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18)),
              ],
            ),
            content: Text(
              'Your withdrawal request of \$$fiat ($_selectedPoints points) was submitted successfully!\n\nReference: $ref\nStatus: Pending Review',
              style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 14),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _loadData();
                  _tabController.animateTo(1);
                },
                child: const Text('View History', style: TextStyle(color: PopoTheme.cyan)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.primary),
                onPressed: () {
                  Navigator.of(ctx).pop();
                  _loadData();
                },
                child: const Text('OK', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.error ?? 'Failed to submit withdrawal request.'),
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
    }
  }

  void _showAddMethodModal() {
    final titleCtrl = TextEditingController();
    final numberCtrl = TextEditingController();
    final bankCtrl = TextEditingController();
    String provider = 'jazzcash';
    bool isDefault = _payoutMethods.isEmpty;
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Add Payout Method',
                      style: TextStyle(
                        color: PopoTheme.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: PopoTheme.textSecondary),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('Select Provider', style: TextStyle(color: PopoTheme.textSecondary, fontSize: 13)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildProviderChoiceChip('JazzCash', 'jazzcash', provider, (val) => setModalState(() => provider = val)),
                    const SizedBox(width: 8),
                    _buildProviderChoiceChip('Easypaisa', 'easypaisa', provider, (val) => setModalState(() => provider = val)),
                    const SizedBox(width: 8),
                    _buildProviderChoiceChip('Bank', 'bank_transfer', provider, (val) => setModalState(() => provider = val)),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: titleCtrl,
                  style: const TextStyle(color: PopoTheme.textPrimary),
                  decoration: InputDecoration(
                    labelText: 'Account Title (Full Name)',
                    labelStyle: const TextStyle(color: PopoTheme.textSecondary),
                    filled: true,
                    fillColor: PopoTheme.background,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: numberCtrl,
                  style: const TextStyle(color: PopoTheme.textPrimary),
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: provider == 'bank_transfer' ? 'IBAN / Account Number' : 'Mobile Account Number (03XXXXXXXXX)',
                    labelStyle: const TextStyle(color: PopoTheme.textSecondary),
                    filled: true,
                    fillColor: PopoTheme.background,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  ),
                ),
                if (provider == 'bank_transfer') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: bankCtrl,
                    style: const TextStyle(color: PopoTheme.textPrimary),
                    decoration: InputDecoration(
                      labelText: 'Bank Name (e.g. Meezan Bank, HBL)',
                      labelStyle: const TextStyle(color: PopoTheme.textSecondary),
                      filled: true,
                      fillColor: PopoTheme.background,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Set as default payout method', style: TextStyle(color: PopoTheme.textSecondary, fontSize: 13)),
                  value: isDefault,
                  activeColor: PopoTheme.primary,
                  onChanged: (val) => setModalState(() => isDefault = val ?? false),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PopoTheme.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: isSaving
                        ? null
                        : () async {
                            final title = titleCtrl.text.trim();
                            final number = numberCtrl.text.trim();
                            if (title.length < 3 || number.length < 8) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Please enter valid account title and number.')),
                              );
                              return;
                            }

                            setModalState(() => isSaving = true);
                            final res = await AgentFinancialService.instance.addPayoutMethod(
                              provider: provider,
                              accountTitle: title,
                              accountNumber: number,
                              bankName: provider == 'bank_transfer' ? bankCtrl.text.trim() : null,
                              isDefault: isDefault,
                            );

                            if (!context.mounted) return;
                            if (res.isSuccess) {
                              Navigator.of(ctx).pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Payout method added successfully!'), backgroundColor: PopoTheme.success),
                              );
                              _loadData();
                            } else {
                              setModalState(() => isSaving = false);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(res.error ?? 'Failed to add method.'), backgroundColor: PopoTheme.danger),
                              );
                            }
                          },
                    child: isSaving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Save Payout Method', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProviderChoiceChip(String label, String value, String current, ValueChanged<String> onSelected) {
    final isSelected = current == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => onSelected(value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? PopoTheme.primary.withValues(alpha: 0.15) : PopoTheme.background,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? PopoTheme.primary : PopoTheme.borderSubtle),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSelected ? PopoTheme.primary : PopoTheme.textSecondary,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 13,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        title: const Text('Earnings Withdrawal', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: PopoTheme.textPrimary, size: 18),
          onPressed: () => Navigator.of(context).pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: PopoTheme.primary,
          labelColor: PopoTheme.primary,
          unselectedLabelColor: PopoTheme.textSecondary,
          tabs: const [
            Tab(text: 'Request Payout'),
            Tab(text: 'History'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: PopoTheme.primary))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildRequestTab(),
                _buildHistoryTab(),
              ],
            ),
    );
  }

  Widget _buildRequestTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: PopoTheme.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Available Balance Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: PopoTheme.goldGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: PopoTheme.gold.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Available For Withdrawal', style: TextStyle(color: Colors.black87, fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text('\$${_availableUsd.toStringAsFixed(2)}', style: const TextStyle(color: Colors.black, fontSize: 32, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Text('USD', style: TextStyle(color: Colors.black.withValues(alpha: 0.7), fontSize: 14, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_availablePoints.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} Points (1,000 pts = \$1 USD)',
                    style: TextStyle(color: Colors.black.withValues(alpha: 0.8), fontSize: 12),
                  ),
                  if (_pendingPoints > 0) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Pending Review: ${_pendingPoints.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} pts',
                        style: const TextStyle(color: Colors.black, fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Payout Method Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Payout Method', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton.icon(
                  onPressed: _showAddMethodModal,
                  icon: const Icon(Icons.add, color: PopoTheme.cyan, size: 18),
                  label: const Text('Add Method', style: TextStyle(color: PopoTheme.cyan, fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (_payoutMethods.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: PopoTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: PopoTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.account_balance_wallet_outlined, color: PopoTheme.textSecondary, size: 36),
                    const SizedBox(height: 8),
                    const Text('No payout method added yet.', style: TextStyle(color: PopoTheme.textSecondary, fontSize: 13)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: PopoTheme.surfaceLight),
                      onPressed: _showAddMethodModal,
                      child: const Text('Add JazzCash, Easypaisa, or Bank', style: TextStyle(color: PopoTheme.cyan, fontSize: 13)),
                    ),
                  ],
                ),
              )
            else
              ..._payoutMethods.map((m) {
                final isSelected = _selectedMethodId == m['id']?.toString();
                final provider = m['provider']?.toString() ?? 'unknown';
                final isDefault = m['isDefault'] == true;
                return GestureDetector(
                  onTap: () => setState(() => _selectedMethodId = m['id']?.toString()),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected ? PopoTheme.primary.withValues(alpha: 0.08) : PopoTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isSelected ? PopoTheme.primary : PopoTheme.borderSubtle, width: isSelected ? 1.5 : 1),
                    ),
                    child: Row(
                      children: [
                        Radio<String>(
                          value: m['id']?.toString() ?? '',
                          groupValue: _selectedMethodId,
                          activeColor: PopoTheme.primary,
                          onChanged: (val) => setState(() => _selectedMethodId = val),
                        ),
                        Icon(
                          provider == 'bank_transfer'
                              ? Icons.account_balance
                              : provider == 'jazzcash'
                                  ? Icons.phone_android
                                  : Icons.wallet,
                          color: PopoTheme.gold,
                          size: 26,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    provider.toUpperCase().replaceAll('_', ' '),
                                    style: const TextStyle(color: PopoTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  if (isDefault) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: PopoTheme.cyan.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4)),
                                      child: const Text('DEFAULT', style: TextStyle(color: PopoTheme.cyan, fontSize: 9, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${m['accountTitle']} (${m['accountNumberMasked']})',
                                style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
                              ),
                              if (m['bankName'] != null)
                                Text(
                                  m['bankName'].toString(),
                                  style: const TextStyle(color: PopoTheme.textTertiary, fontSize: 11),
                                ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: PopoTheme.textTertiary, size: 20),
                          onPressed: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                backgroundColor: PopoTheme.surface,
                                title: const Text('Remove Payout Method?', style: TextStyle(color: PopoTheme.textPrimary)),
                                content: const Text('Are you sure you want to delete this payout method?', style: TextStyle(color: PopoTheme.textSecondary)),
                                actions: [
                                  TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
                                  TextButton(
                                    onPressed: () => Navigator.of(ctx).pop(true),
                                    child: const Text('Delete', style: TextStyle(color: PopoTheme.danger)),
                                  ),
                                ],
                              ),
                            );
                            if (confirm == true) {
                              await AgentFinancialService.instance.deletePayoutMethod(m['id'].toString());
                              _loadData();
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                );
              }),

            const SizedBox(height: 24),

            // Amount Section
            const Text('Withdrawal Points Amount', style: TextStyle(color: PopoTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: PopoTheme.borderSubtle),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: PopoTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.bold),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                        hintText: 'Min 10,000 pts',
                        hintStyle: TextStyle(color: PopoTheme.textTertiary, fontSize: 16),
                      ),
                    ),
                  ),
                  Text(
                    '≈ \$${(_selectedPoints / 1000).toStringAsFixed(2)} USD',
                    style: const TextStyle(color: PopoTheme.cyan, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // Quick Selection Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildQuickChip('10,000 (\$10)', 10000),
                  const SizedBox(width: 8),
                  _buildQuickChip('25,000 (\$25)', 25000),
                  const SizedBox(width: 8),
                  _buildQuickChip('50,000 (\$50)', 50000),
                  const SizedBox(width: 8),
                  _buildQuickChip('100,000 (\$100)', 100000),
                  const SizedBox(width: 8),
                  _buildQuickChip('Max Available', _availablePoints),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              '• Min: 10,000 pts (\$10)  • Max: 5,000,000 pts (\$5,000)  • Processing: 24–48 hours',
              style: TextStyle(color: PopoTheme.textTertiary, fontSize: 11),
            ),

            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: PopoTheme.primary,
                  disabledBackgroundColor: PopoTheme.surfaceLight,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 4,
                ),
                onPressed: (_isSubmitting || _availablePoints < 10000) ? null : _submitWithdrawal,
                child: _isSubmitting
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        'Withdraw \$${(_selectedPoints / 1000).toStringAsFixed(2)} USD',
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickChip(String label, int points) {
    final isSelected = _selectedPoints == points;
    return GestureDetector(
      onTap: () {
        _amountController.text = points.toString();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? PopoTheme.primary.withValues(alpha: 0.15) : PopoTheme.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? PopoTheme.primary : PopoTheme.borderSubtle),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? PopoTheme.primary : PopoTheme.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: PopoTheme.primary,
      child: _withdrawals.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history, color: PopoTheme.textSecondary, size: 48),
                  SizedBox(height: 12),
                  Text('No withdrawal history found.', style: TextStyle(color: PopoTheme.textSecondary, fontSize: 14)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _withdrawals.length,
              itemBuilder: (ctx, index) {
                final w = _withdrawals[index];
                final status = w['status']?.toString() ?? 'pending';
                final points = (w['pointsAmount'] as num?)?.toInt() ?? 0;
                final fiat = (w['fiatAmount'] as num?)?.toDouble() ?? (points / 1000);
                final ref = w['withdrawalReference']?.toString() ?? 'WTH-REF';
                final provider = w['provider']?.toString() ?? 'Payout';
                final accountMasked = w['accountNumberMasked']?.toString() ?? '';
                final created = w['createdAt']?.toString() ?? '';

                Color statusColor;
                String statusLabel;
                switch (status) {
                  case 'completed':
                    statusColor = PopoTheme.success;
                    statusLabel = 'COMPLETED';
                    break;
                  case 'approved':
                    statusColor = Colors.purpleAccent;
                    statusLabel = 'APPROVED';
                    break;
                  case 'under_review':
                    statusColor = PopoTheme.cyan;
                    statusLabel = 'UNDER REVIEW';
                    break;
                  case 'rejected':
                    statusColor = PopoTheme.danger;
                    statusLabel = 'REJECTED';
                    break;
                  default:
                    statusColor = PopoTheme.warning;
                    statusLabel = 'PENDING';
                }

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
                          Text(ref, style: const TextStyle(color: PopoTheme.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              statusLabel,
                              style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$provider $accountMasked',
                                style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 13),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                created.length > 10 ? created.substring(0, 10) : created,
                                style: const TextStyle(color: PopoTheme.textTertiary, fontSize: 11),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('\$${fiat.toStringAsFixed(2)}', style: const TextStyle(color: PopoTheme.gold, fontWeight: FontWeight.bold, fontSize: 16)),
                              Text('$points pts', style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                      if (w['rejectionReason'] != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Reason: ${w['rejectionReason']}',
                          style: const TextStyle(color: PopoTheme.danger, fontSize: 11),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
    );
  }
}
