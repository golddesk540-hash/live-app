import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_secondary_button.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_card.dart';
import '../../auth/auth_state.dart';
import 'login_screen.dart';

/// Mandatory 18+ Age Verification & Terms Acceptance Gate Screen
class AgeGateScreen extends StatefulWidget {
  const AgeGateScreen({Key? key}) : super(key: key);

  @override
  State<AgeGateScreen> createState() => _AgeGateScreenState();
}

class _AgeGateScreenState extends State<AgeGateScreen> {
  bool _isAgeConfirmed = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  Future<void> _handleAccept() async {
    if (!_isAgeConfirmed) {
      setState(() {
        _errorMessage = PopoStrings.get('err_terms_required');
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final success = await AuthState.instance.acceptTerms(
      language: PopoStrings.currentLanguage.value,
    );

    if (!mounted) return;

    if (success) {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
    } else {
      setState(() {
        _isSubmitting = false;
        _errorMessage =
            AuthState.instance.errorMessage ??
            'Failed to record compliance. Please try again.';
      });
    }
  }

  void _handleDecline() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: PopoTheme.borderSubtle),
        ),
        title: Row(
          children: [
            const Icon(
              Icons.shield_outlined,
              color: PopoTheme.danger,
              size: 24,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                PopoStrings.get('age_gate_decline'),
                style: const TextStyle(
                  color: PopoTheme.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          PopoStrings.get('age_gate_declined_msg'),
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 13,
            height: 1.45,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Back', style: TextStyle(color: PopoTheme.cyan)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            automaticallyImplyLeading: false,
            actions: [
              PopoIconButton(
                icon: Icons.translate_rounded,
                color: PopoTheme.cyan,
                tooltip: 'Switch Language (English / اردو)',
                onPressed: PopoStrings.toggleLanguage,
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 16.0,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Badge
                      Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.primary.withOpacity(0.14),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: PopoTheme.primary.withOpacity(0.35),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            PopoStrings.get('age_gate_badge'),
                            style: const TextStyle(
                              color: PopoTheme.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Shield Icon Emblem
                      Center(
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: PopoTheme.surface,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: PopoTheme.primary.withOpacity(0.4),
                              width: 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: PopoTheme.primary.withOpacity(0.2),
                                blurRadius: 24,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.verified_user_rounded,
                            color: PopoTheme.primary,
                            size: 40,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Heading
                      Text(
                        PopoStrings.get('age_gate_title'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Explanatory Body
                      Text(
                        PopoStrings.get('age_gate_desc'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Agreement Card
                      PopoCard(
                        padding: const EdgeInsets.all(16.0),
                        borderColor: _isAgeConfirmed
                            ? PopoTheme.primary.withOpacity(0.5)
                            : PopoTheme.borderSubtle,
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              _isAgeConfirmed = !_isAgeConfirmed;
                              if (_isAgeConfirmed) _errorMessage = null;
                            });
                          },
                          splashColor: Colors.transparent,
                          highlightColor: Colors.transparent,
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(
                                width: 24,
                                height: 24,
                                child: Checkbox(
                                  value: _isAgeConfirmed,
                                  onChanged: (val) {
                                    setState(() {
                                      _isAgeConfirmed = val ?? false;
                                      if (_isAgeConfirmed) _errorMessage = null;
                                    });
                                  },
                                  activeColor: PopoTheme.primary,
                                  checkColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  PopoStrings.get('age_gate_checkbox'),
                                  style: TextStyle(
                                    color: _isAgeConfirmed
                                        ? PopoTheme.textPrimary
                                        : PopoTheme.textSecondary,
                                    fontSize: 12.5,
                                    height: 1.4,
                                    fontWeight: _isAgeConfirmed
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      if (_errorMessage != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.danger.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: PopoTheme.danger.withOpacity(0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline_rounded,
                                color: PopoTheme.danger,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    color: PopoTheme.danger,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 32),

                      // CTA Actions
                      PopoPrimaryButton(
                        text: PopoStrings.get('accept_and_continue'),
                        isLoading: _isSubmitting,
                        onPressed: _handleAccept,
                        icon: Icons.check_circle_outline_rounded,
                      ),
                      const SizedBox(height: 12),
                      PopoSecondaryButton(
                        text: PopoStrings.get('age_gate_decline'),
                        onPressed: _handleDecline,
                        textColor: PopoTheme.textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
