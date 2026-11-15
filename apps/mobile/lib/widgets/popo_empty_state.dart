import 'package:flutter/material.dart';
import '../theme/popo_theme.dart';
import 'popo_primary_button.dart';

/// Clean, informative empty state with branded icon container and optional CTA
class PopoEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionText;
  final VoidCallback? onActionTap;
  final Color? iconColor;
  final EdgeInsetsGeometry padding;

  const PopoEmptyState({
    Key? key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionText,
    this.onActionTap,
    this.iconColor,
    this.padding = const EdgeInsets.all(28.0),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final effectiveColor = iconColor ?? PopoTheme.primary;

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
                  color: effectiveColor.withOpacity(0.3),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: effectiveColor.withOpacity(0.12),
                    blurRadius: 18,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: effectiveColor,
                size: 38,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
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
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 13,
                  height: 1.45,
                ),
              ),
            ),
            if (actionText != null && onActionTap != null) ...[
              const SizedBox(height: 24),
              PopoPrimaryButton(
                text: actionText!,
                onPressed: onActionTap,
                height: 44,
                isFullWidth: false,
                width: 180,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
