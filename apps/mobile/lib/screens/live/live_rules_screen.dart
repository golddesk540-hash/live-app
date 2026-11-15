import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../api/api.dart';
import '../../models/live/live_models.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_primary_button.dart';

/// Live Community Rules & Host Policy Screen
/// Implements GET /api/live/rules, GET /api/live/rules/status, and POST /api/live/rules/accept
class LiveRulesScreen extends StatefulWidget {
  const LiveRulesScreen({Key? key}) : super(key: key);

  @override
  State<LiveRulesScreen> createState() => _LiveRulesScreenState();
}

class _LiveRulesScreenState extends State<LiveRulesScreen> {
  final LiveApiService _apiService = LiveApiService();

  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  String _policyVersion = 'v1.0';
  String? _effectiveDate;
  List<LiveRuleItem> _rules = [];
  bool _hasAccepted = false;
  String? _acceptedAt;

  @override
  void initState() {
    super.initState();
    _loadRulesData();
  }

  Future<void> _loadRulesData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Fetch Rules Content
      final rulesRes = await _apiService.getRules();
      if (!rulesRes.isSuccess || rulesRes.data == null) {
        setState(() {
          _isLoading = false;
          _errorMessage = rulesRes.errorMessage ?? 'Failed to load live rules';
        });
        return;
      }

      final rulesData = rulesRes.data as Map<String, dynamic>;
      _policyVersion = rulesData['policyVersion']?.toString() ?? 'v1.0';
      _effectiveDate = rulesData['effectiveDate']?.toString();
      final rawList = rulesData['rules'] as List<dynamic>? ?? [];
      _rules = rawList
          .map((r) => LiveRuleItem.fromJson(r as Map<String, dynamic>))
          .toList();

      // 2. Fetch User Rules Acceptance Status
      final statusRes = await _apiService.getRulesStatus();
      if (statusRes.isSuccess && statusRes.data != null) {
        final statusData = statusRes.data as Map<String, dynamic>;
        _hasAccepted = statusData['hasAccepted'] == true;
        _acceptedAt = statusData['acceptedAt']?.toString();
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error loading rules: $e';
      });
    }
  }

  Future<void> _acceptRules() async {
    setState(() => _isSubmitting = true);

    try {
      final res = await _apiService.acceptRules(
        policyVersion: _policyVersion,
        acknowledgedCheckbox: true,
      );

      if (!mounted) return;

      if (res.isSuccess) {
        setState(() {
          _isSubmitting = false;
          _hasAccepted = true;
          _acceptedAt = DateTime.now().toIso8601String();
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Live Community Rules accepted successfully!'),
            backgroundColor: Color(0xFF00C853),
          ),
        );
      } else {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.errorMessage ?? 'Failed to accept rules.'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        title: const Text(
          'Live Community Rules',
          style: TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
            size: 18,
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _isLoading
          ? const Center(child: PopoLoadingIndicator())
          : _errorMessage != null
          ? PopoErrorState(message: _errorMessage!, onRetry: _loadRulesData)
          : _buildContent(),
      bottomNavigationBar:
          (!_isLoading && _errorMessage == null && !_hasAccepted)
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: const BoxDecoration(
                color: PopoTheme.surface,
                border: Border(
                  top: BorderSide(color: PopoTheme.borderSubtle, width: 1),
                ),
              ),
              child: SafeArea(
                child: PopoPrimaryButton(
                  text: 'I Accept Community Rules',
                  icon: Icons.check_circle_outline_rounded,
                  isLoading: _isSubmitting,
                  onPressed: _acceptRules,
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildContent() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Policy Header Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: PopoTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: PopoTheme.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: PopoTheme.primary.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.shield_rounded,
                      color: PopoTheme.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Safety & Fair Play Guidelines',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Policy $_policyVersion • ${_effectiveDate ?? "Effective Immediately"}',
                          style: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_hasAccepted)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C853).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: const Color(0xFF00C853).withOpacity(0.4),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(
                            Icons.check_circle_rounded,
                            color: Color(0xFF00C853),
                            size: 12,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Accepted',
                            style: TextStyle(
                              color: Color(0xFF00C853),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                'All broadcasters and audience members must follow these core policies. Violations will result in chat muting, room closure, or permanent account restriction.',
                style: TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 12,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        const Text(
          'Core Community Rules',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),

        // List of Rules
        ..._rules.map((rule) => _buildRuleCard(rule)),

        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildRuleCard(LiveRuleItem rule) {
    IconData iconData = Icons.rule_rounded;
    Color iconColor = PopoTheme.cyan;

    switch (rule.icon) {
      case 'smile':
      case 'heart':
        iconData = Icons.favorite_rounded;
        iconColor = PopoTheme.primary;
        break;
      case 'alert':
      case 'warning':
        iconData = Icons.warning_amber_rounded;
        iconColor = PopoTheme.warning;
        break;
      case 'lock':
      case 'security':
        iconData = Icons.lock_outline_rounded;
        iconColor = PopoTheme.gold;
        break;
      case 'flag':
        iconData = Icons.flag_rounded;
        iconColor = PopoTheme.danger;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: PopoTheme.borderSubtle.withOpacity(0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(iconData, color: iconColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        rule.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        rule.category,
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  rule.description,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 12,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
