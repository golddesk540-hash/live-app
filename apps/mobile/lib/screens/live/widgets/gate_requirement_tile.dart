import 'package:flutter/material.dart';

import '../../../theme/popo_theme.dart';

/// Reusable status tile for individual Go-Live requirements (Face KYC, Cover Image)
class GateRequirementTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool isCompleted;
  final String? statusLabel;
  final VoidCallback? onAction;
  final String? actionLabel;
  final bool isLoading;

  const GateRequirementTile({
    Key? key,
    required this.icon,
    required this.title,
    required this.description,
    required this.isCompleted,
    this.statusLabel,
    this.onAction,
    this.actionLabel,
    this.isLoading = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isCompleted
              ? PopoTheme.cyan.withOpacity(0.5)
              : PopoTheme.borderSubtle,
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isCompleted
                  ? PopoTheme.cyan.withOpacity(0.15)
                  : const Color(0xFF222232),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isCompleted ? PopoTheme.cyan : PopoTheme.textSecondary,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (isCompleted)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: PopoTheme.cyan.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          statusLabel ?? 'VERIFIED',
                          style: const TextStyle(
                            color: PopoTheme.cyan,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 12,
                    height: 1.25,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          if (isCompleted)
            const Icon(
              Icons.check_circle_rounded,
              color: PopoTheme.cyan,
              size: 24,
            )
          else if (onAction != null)
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: PopoTheme.primary,
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 0,
              ),
              onPressed: isLoading ? null : onAction,
              child: isLoading
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      actionLabel ?? 'Verify',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
        ],
      ),
    );
  }
}
