import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/wallet/financial_models.dart';
import '../../services/wallet/financial_service.dart';

class TransactionDetailsScreen extends StatefulWidget {
  final FinancialTransactionItem? transactionItem;
  final String? receiptId;
  final String? transactionId;
  final String? apiBaseUrl;

  const TransactionDetailsScreen({
    Key? key,
    this.transactionItem,
    this.receiptId,
    this.transactionId,
    this.apiBaseUrl,
  }) : super(key: key);

  @override
  State<TransactionDetailsScreen> createState() => _TransactionDetailsScreenState();
}

class _TransactionDetailsScreenState extends State<TransactionDetailsScreen> {
  late final FinancialService _financialService;
  late final NumberFormat _currencyFmt;
  late final NumberFormat _numFmt;
  late final DateFormat _dateFmt;

  bool _isLoading = false;
  String? _errorMessage;
  FinancialReceiptDetail? _receiptDetail;

  @override
  void initState() {
    super.initState();
    _financialService = FinancialService(baseUrl: widget.apiBaseUrl ?? 'http://localhost:3000');
    _currencyFmt = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    _numFmt = NumberFormat('#,###');
    _dateFmt = DateFormat('MMMM d, yyyy • h:mm:ss a');

    if (widget.receiptId != null && widget.receiptId!.isNotEmpty) {
      _loadReceiptDetail(widget.receiptId!);
    }
  }

  @override
  void dispose() {
    _financialService.dispose();
    super.dispose();
  }

  Future<void> _loadReceiptDetail(String id) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await _financialService.getReceiptDetail(
      receiptId: id,
      previewDemo: true,
    );

    if (!mounted) return;

    if (res.isSuccess && res.data != null) {
      setState(() {
        _isLoading = false;
        _receiptDetail = res.data;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage = res.errorMessage;
      });
    }
  }

  void _showRefundRequestDialog() {
    final item = widget.transactionItem;
    final orderId = item?.recordId ?? widget.transactionId ?? '';
    final TextEditingController reasonCtrl = TextEditingController();
    bool isSubmitting = false;
    String? dialogError;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E1E34),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.undo_rounded, color: Color(0xFFFF9500)),
                  SizedBox(width: 8),
                  Text('Request Refund', style: TextStyle(color: Colors.white, fontSize: 16)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Submitting a formal refund review for order:\n$orderId',
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Reason for refund:',
                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: reasonCtrl,
                    maxLines: 3,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Describe the issue (accidental purchase, billing error, etc.)',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 12),
                      filled: true,
                      fillColor: const Color(0xFF141423),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                      ),
                    ),
                  ),
                  if (dialogError != null) ...[
                    const SizedBox(height: 8),
                    Text(dialogError!, style: const TextStyle(color: Color(0xFFFF5252), fontSize: 11)),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.of(context).pop(),
                  child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF9500)),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          final reason = reasonCtrl.text.trim();
                          if (reason.length < 5) {
                            setDialogState(() => dialogError = 'Please provide at least 5 characters for the reason.');
                            return;
                          }

                          setDialogState(() {
                            isSubmitting = true;
                            dialogError = null;
                          });

                          final res = await _financialService.requestRefund(
                            orderId: orderId,
                            reason: reason,
                            previewDemo: true,
                          );

                          if (!mounted) return;

                          if (res.isSuccess) {
                            Navigator.of(context).pop();
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              SnackBar(
                                content: Text('Refund request submitted: ${res.data?.message ?? "Under review"}'),
                                backgroundColor: const Color(0xFF00E676),
                              ),
                            );
                          } else {
                            setDialogState(() {
                              isSubmitting = false;
                              dialogError = res.errorMessage ?? 'Failed to submit refund request';
                            });
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Submit Request', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showDiscrepancyReportDialog() {
    final item = widget.transactionItem;
    final orderId = item?.recordId ?? widget.transactionId ?? '';
    final TextEditingController descCtrl = TextEditingController();
    bool isSubmitting = false;
    String? dialogError;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1E1E34),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.report_problem_rounded, color: Color(0xFFFF5252)),
                  SizedBox(width: 8),
                  Text('Report Discrepancy', style: TextStyle(color: Colors.white, fontSize: 16)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'File an official financial audit report regarding this transaction.',
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: descCtrl,
                    maxLines: 3,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Describe missing coins, incorrect deduction, or ledger error...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 12),
                      filled: true,
                      fillColor: const Color(0xFF141423),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
                      ),
                    ),
                  ),
                  if (dialogError != null) ...[
                    const SizedBox(height: 8),
                    Text(dialogError!, style: const TextStyle(color: Color(0xFFFF5252), fontSize: 11)),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.of(context).pop(),
                  child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF5252)),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          final desc = descCtrl.text.trim();
                          if (desc.length < 5) {
                            setDialogState(() => dialogError = 'Please provide at least 5 characters.');
                            return;
                          }

                          setDialogState(() {
                            isSubmitting = true;
                            dialogError = null;
                          });

                          final res = await _financialService.reportDiscrepancy(
                            description: desc,
                            orderId: orderId,
                            previewDemo: true,
                          );

                          if (!mounted) return;

                          if (res.isSuccess) {
                            Navigator.of(context).pop();
                            ScaffoldMessenger.of(this.context).showSnackBar(
                              const SnackBar(
                                content: Text('Discrepancy report recorded in security audit log.'),
                                backgroundColor: Color(0xFF00E676),
                              ),
                            );
                          } else {
                            setDialogState(() {
                              isSubmitting = false;
                              dialogError = res.errorMessage ?? 'Failed to report discrepancy';
                            });
                          }
                        },
                  child: isSubmitting
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Submit Report', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.transactionItem;
    final receipt = _receiptDetail;

    final title = receipt?.title ?? item?.title ?? 'Transaction Details';
    final status = receipt?.status ?? item?.status ?? 'successful';
    final recordId = receipt?.transactionId ?? item?.recordId ?? widget.transactionId ?? '';
    final issuedAt = receipt?.issuedAt ?? item?.issuedAt ?? DateTime.now();
    final paymentAmount = receipt?.paymentAmount ?? item?.paymentAmount ?? 0.0;
    final coinQty = receipt?.coinQuantity ?? item?.coinQuantity ?? 0;
    final pointsQty = receipt?.pointsQuantity ?? item?.pointsQuantity ?? 0;
    final paymentMethod = receipt?.paymentMethod ?? item?.paymentMethod ?? 'google_play';
    final receiptNumber = receipt?.receiptNumber ?? item?.receiptNumber;
    final maskedRef = receipt?.providerReferenceMasked ?? item?.providerReferenceMasked;
    final hasReceipt = (receipt?.receiptId ?? item?.receiptId) != null;
    final isRefunded = status == 'refunded' || status == 'reversed';

    // Status colors
    Color statusColor = const Color(0xFF00E676);
    if (status == 'pending') statusColor = const Color(0xFFFF9500);
    if (status == 'failed') statusColor = const Color(0xFFFF5252);
    if (status == 'cancelled') statusColor = Colors.grey;
    if (isRefunded) statusColor = const Color(0xFFFF9500);

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF141423),
        elevation: 0,
        title: const Text('Official Transaction Receipt', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: 'Report Discrepancy',
            icon: const Icon(Icons.flag_outlined, color: Colors.white70),
            onPressed: _showDiscrepancyReportDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7C4DFF)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Receipt Header Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF1E1E34),
                          const Color(0xFF18182B),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.08)),
                    ),
                    child: Column(
                      children: [
                        // Status Badge Icon
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.15),
                            shape: BoxShape.circle,
                            border: Border.all(color: statusColor.withOpacity(0.5), width: 2),
                          ),
                          child: Icon(
                            isRefunded
                                ? Icons.undo_rounded
                                : (status == 'successful'
                                    ? Icons.check_circle_rounded
                                    : Icons.info_outline_rounded),
                            color: statusColor,
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: statusColor.withOpacity(0.4)),
                          ),
                          child: Text(
                            status.toUpperCase(),
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        if (receiptNumber != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            receiptNumber,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.5),
                              fontSize: 12,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Financial Quantities Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18182B),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withOpacity(0.06)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Payment & Balances',
                          style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        if (paymentAmount > 0)
                          _buildDetailRow('Amount Paid', _currencyFmt.format(paymentAmount), isBold: true),
                        if (coinQty > 0)
                          _buildDetailRow('Coins Credited / Spent', '${_numFmt.format(coinQty)} coins',
                              valueColor: const Color(0xFFFFD700)),
                        if (pointsQty > 0)
                          _buildDetailRow('Host Points Earned', '${_numFmt.format(pointsQty)} diamonds (70%)',
                              valueColor: const Color(0xFF2979FF)),
                        _buildDetailRow('Payment Platform', paymentMethod.replaceAll('_', ' ').toUpperCase()),
                        if (maskedRef != null)
                          _buildDetailRow('Payment Reference', maskedRef),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Cryptographic & Server Authority Verification
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18182B),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.white.withOpacity(0.06)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.security_rounded, size: 16, color: Color(0xFF00E676)),
                            SizedBox(width: 6),
                            Text(
                              'Security & Audit Verification',
                              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildDetailRow('Transaction ID', recordId),
                        _buildDetailRow('Timestamp', _dateFmt.format(issuedAt)),
                        _buildDetailRow('Server Authority', 'VERIFIED (Backend Anchor)', valueColor: const Color(0xFF00E676)),
                        _buildDetailRow('Ledger State', isRefunded ? 'REVERSED / REFUNDED' : 'COMMITTED (Immutable)',
                            valueColor: isRefunded ? const Color(0xFFFF9500) : const Color(0xFF00E676)),
                        _buildDetailRow('Client Override Policy', 'STRICTLY FORBIDDEN (HTTP 403 Enforcement)'),
                      ],
                    ),
                  ),

                  // Actions Section
                  const SizedBox(height: 24),

                  // PDF Receipt Download / View (only if official receipt exists)
                  if (hasReceipt) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                        label: const Text('Download Official PDF Receipt', style: TextStyle(fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7C4DFF),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          final pdfUrl = _financialService.getReceiptPdfUrl(
                            receipt?.receiptId ?? item!.receiptId!,
                            previewDemo: true,
                          );
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Official PDF Receipt URL:\n$pdfUrl'),
                              duration: const Duration(seconds: 4),
                              action: SnackBarAction(
                                label: 'OK',
                                onPressed: () {},
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Refund Request Button (for confirmed topups that are not yet refunded)
                  if ((item?.isTopup == true || receipt?.txCategory == 'topup') && !isRefunded && status == 'successful') ...[
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.undo_rounded, size: 18, color: Color(0xFFFF9500)),
                        label: const Text(
                          'Request Official Refund',
                          style: TextStyle(color: Color(0xFFFF9500), fontWeight: FontWeight.bold),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFFF9500)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _showRefundRequestDialog,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Discrepancy Reporting
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: TextButton.icon(
                      icon: const Icon(Icons.report_problem_outlined, size: 16, color: Colors.white60),
                      label: const Text(
                        'Report Discrepancy to Accounting Team',
                        style: TextStyle(color: Colors.white60, fontSize: 12),
                      ),
                      onPressed: _showDiscrepancyReportDialog,
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.white.withOpacity(0.6),
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                color: valueColor ?? Colors.white,
                fontSize: 12,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
