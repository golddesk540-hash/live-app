import 'package:flutter/material.dart';
import '../../services/host/host_task_service.dart';

/// Popo Live — Phase 4 Module 8: Host Earning Identity Screen
/// KYC identification verification, document masking and earning clearance.
class EarningIdentityScreen extends StatefulWidget {
  const EarningIdentityScreen({super.key});

  @override
  State<EarningIdentityScreen> createState() => _EarningIdentityScreenState();
}

class _EarningIdentityScreenState extends State<EarningIdentityScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;
  Map<String, dynamic>? _identityData;

  @override
  void initState() {
    super.initState();
    _loadIdentity();
  }

  Future<void> _loadIdentity() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await HostTaskService.instance.fetchEarningIdentity();
      if (!mounted) return;
      setState(() {
        _identityData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _showSubmitDialog() async {
    final nameCtrl = TextEditingController(text: _identityData?['legalName']?.toString() ?? '');
    final docCtrl = TextEditingController();
    String docType = _identityData?['documentType']?.toString() ?? 'national_id';
    String country = _identityData?['country']?.toString() ?? 'Pakistan';

    final submitted = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF1B0C35),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text(
            'Submit Identity Details',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Legal Full Name',
                    labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: Color(0x66A855F7)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: docCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Document / National ID Number',
                    labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                    hintText: 'e.g. 42101-1234567-8',
                    hintStyle: TextStyle(color: Colors.white30),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: Color(0x66A855F7)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: docType,
                  dropdownColor: const Color(0xFF1B0C35),
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Document Type',
                    labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'national_id', child: Text('National ID Card')),
                    DropdownMenuItem(value: 'passport', child: Text('Passport')),
                    DropdownMenuItem(value: 'drivers_license', child: Text('Driver\'s License')),
                  ],
                  onChanged: (v) {
                    if (v != null) setDialogState(() => docType = v);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel', style: TextStyle(color: Color(0xFFBBA9D6))),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF1A6C),
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                if (nameCtrl.text.trim().isEmpty || docCtrl.text.trim().isEmpty) {
                  return;
                }
                Navigator.pop(ctx, true);
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );

    if (submitted == true) {
      setState(() => _isSubmitting = true);
      try {
        await HostTaskService.instance.submitEarningIdentity(
          legalName: nameCtrl.text.trim(),
          country: country,
          documentType: docType,
          documentNumber: docCtrl.text.trim(),
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Identity submitted successfully for verification!'),
            backgroundColor: Color(0xFF34D399),
          ),
        );
        _loadIdentity();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: const Color(0xFFFF1A6C),
          ),
        );
      } finally {
        if (mounted) {
          setState(() => _isSubmitting = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Earning Identity',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadIdentity,
        color: const Color(0xFFFF1A6C),
        backgroundColor: const Color(0xFF160830),
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.shield_outlined, color: Color(0xFFFF1A6C), size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 14),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                ),
                onPressed: _loadIdentity,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final data = _identityData ?? {};
    final status = data['status']?.toString().toUpperCase() ?? 'INCOMPLETE';
    final legalName = data['legalName']?.toString() ?? 'Creator';
    final country = data['country']?.toString() ?? 'Pakistan';
    final docNumberMasked = data['documentNumberMasked']?.toString() ?? '•••• •••• ••••';
    final documentType = data['documentType']?.toString().replaceAll('_', ' ').toUpperCase() ?? 'NATIONAL ID';
    final earningEligible = data['earningEligible'] == true;

    Color statusColor;
    if (status == 'VERIFIED') {
      statusColor = const Color(0xFF34D399);
    } else if (status == 'SUBMITTED' || status == 'UNDER_REVIEW') {
      statusColor = const Color(0xFFFFD166);
    } else {
      statusColor = const Color(0xFFFF1A6C);
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        // Top Profile Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF1B0C35),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x55A855F7)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: statusColor, width: 3),
                      color: const Color(0xFF28124D),
                    ),
                    child: const Icon(Icons.person, color: Colors.white, size: 32),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          legalName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.flag_rounded, color: Color(0xFFD8B4FE), size: 13),
                            const SizedBox(width: 4),
                            Text(
                              country,
                              style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: statusColor.withOpacity(0.5)),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(
                              color: statusColor,
                              fontWeight: FontWeight.w800,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Color(0x33A855F7)),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Earning Eligibility',
                    style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 13),
                  ),
                  Row(
                    children: [
                      Icon(
                        earningEligible ? Icons.check_circle : Icons.error_outline,
                        color: earningEligible ? const Color(0xFF34D399) : const Color(0xFFFFD166),
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        earningEligible ? 'Authorized' : 'Verification Required',
                        style: TextStyle(
                          color: earningEligible ? const Color(0xFF34D399) : const Color(0xFFFFD166),
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        const Text(
          'Identity Information',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
        ),
        const SizedBox(height: 10),

        _infoCard('Legal Name', legalName),
        _infoCard('Country', country),
        _infoCard('Document Type', documentType),
        _infoCard('Masked Document Number', docNumberMasked),

        const SizedBox(height: 18),

        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF1A6C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: const StadiumBorder(),
            ),
            onPressed: _isSubmitting ? null : _showSubmitDialog,
            icon: _isSubmitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.verified_user_rounded),
            label: Text(
              status == 'VERIFIED' ? 'Update KYC Details' : 'Complete Verification',
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
            ),
          ),
        ),
      ],
    );
  }

  Widget _infoCard(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF180A33),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0x33A855F7)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFFD8B4FE), fontWeight: FontWeight.w700, fontSize: 13)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
        ],
      ),
    );
  }
}
