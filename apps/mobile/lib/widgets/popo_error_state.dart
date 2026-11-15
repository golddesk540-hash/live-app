import 'package:flutter/material.dart';

import '../theme/popo_theme.dart';
import '../l10n/strings.dart';
import 'popo_primary_button.dart';

/// Error state widget for connection failures and API errors with retry CTA
class PopoErrorState extends StatelessWidget {
  final String? title;
  final String? message;
  final VoidCallback? onRetry;
  final String? retryText;
  final IconData icon;
  final EdgeInsetsGeometry padding;

  const PopoErrorState({
    Key? key,
    this.title,
    this.message,
    this.onRetry,
    this.retryText,
    this.icon = Icons.wifi_off_rounded,
    this.padding = const EdgeInsets.all(28.0),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: padding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: PopoTheme.surface,
                shape: BoxShape.circle,
                border: Border.all(
                  color: PopoTheme.danger.withOpacity(0.35),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: PopoTheme.danger.withOpacity(0.15),
                    blurRadius: 18,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(icon, color: PopoTheme.danger, size: 38),
            ),
            const SizedBox(height: 20),
            Text(
              title ?? PopoStrings.get('error_unknown'),
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320),
              child: Text(
                message ?? PopoStrings.get('error_network'),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                  height: 1.45,
                ),
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 24),
              PopoPrimaryButton(
                text: retryText ?? PopoStrings.get('retry'),
                onPressed: onRetry,
                icon: Icons.refresh_rounded,
                height: 44,
                isFullWidth: false,
                width: 170,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
