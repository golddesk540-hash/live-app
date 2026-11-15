import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_primary_button.dart';
import '../../api/api.dart';

/// Modal bottom sheet for requesting password reset instructions
class ForgotPasswordSheet extends StatefulWidget {
  const ForgotPasswordSheet({Key? key}) : super(key: key);

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const ForgotPasswordSheet(),
    );
  }

  @override
  State<ForgotPasswordSheet> createState() => _ForgotPasswordSheetState();
}

class _ForgotPasswordSheetState extends State<ForgotPasswordSheet> {
  final TextEditingController _idController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _isSuccess = false;

  @override
  void dispose() {
    _idController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final identifier = _idController.text.trim();
    if (identifier.isEmpty) {
      setState(() {
        _errorMessage = PopoStrings.get('err_empty_identifier');
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await ApiClient.instance.post(
      '/api/auth/forgot-password',
      body: {'identifier': identifier},
    );

    if (!mounted) return;

    if (response.isSuccess) {
      setState(() {
        _isLoading = false;
        _isSuccess = true;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage =
            response.message ?? 'Failed to send reset instructions.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: bottomInset > 0 ? bottomInset + 16 : 32,
      ),
      decoration: const BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(
          top: BorderSide(color: PopoTheme.borderSubtle, width: 1),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
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
          const SizedBox(height: 20),
          Text(
            PopoStrings.get('forgot_password_title'),
            style: const TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            PopoStrings.get('forgot_password_desc'),
            style: const TextStyle(
              color: PopoTheme.textSecondary,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 20),

          if (_isSuccess) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: PopoTheme.success.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: PopoTheme.success.withOpacity(0.3)),
              ),
              child: Text(
                PopoStrings.get('reset_link_sent'),
                style: const TextStyle(color: PopoTheme.success, fontSize: 13),
              ),
            ),
            const SizedBox(height: 20),
          ] else ...[
            TextField(
              controller: _idController,
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 14,
              ),
              decoration: InputDecoration(
                filled: true,
                fillColor: PopoTheme.background,
                hintText: PopoStrings.get('email_or_phone'),
                hintStyle: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                ),
                prefixIcon: const Icon(
                  Icons.mail_outline_rounded,
                  color: PopoTheme.textSecondary,
                  size: 20,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: PopoTheme.borderSubtle),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: PopoTheme.borderSubtle),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(
                    color: PopoTheme.primary,
                    width: 1.5,
                  ),
                ),
              ),
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 10),
              Text(
                _errorMessage!,
                style: const TextStyle(color: PopoTheme.danger, fontSize: 12),
              ),
            ],
            const SizedBox(height: 24),
            PopoPrimaryButton(
              text: PopoStrings.get('send_reset_link'),
              isLoading: _isLoading,
              onPressed: _handleSubmit,
            ),
          ],
        ],
      ),
    );
  }
}
