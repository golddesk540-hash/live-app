import 'package:flutter/material.dart';

import '../theme/popo_theme.dart';

/// Accessible, branded icon button with touch target >= 44dp and optional badge counter
class PopoIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final Color? color;
  final Color? backgroundColor;
  final double iconSize;
  final double size;
  final int badgeCount;
  final Color? badgeColor;
  final Border? border;

  const PopoIconButton({
    Key? key,
    required this.icon,
    required this.onPressed,
    this.tooltip,
    this.color,
    this.backgroundColor,
    this.iconSize = 22.0,
    this.size = 44.0,
    this.badgeCount = 0,
    this.badgeColor,
    this.border,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool isInteractive = onPressed != null;

    Widget button = InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(size / 2),
      splashColor: (color ?? PopoTheme.primary).withOpacity(0.2),
      highlightColor: Colors.transparent,
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: backgroundColor ?? Colors.transparent,
          shape: BoxShape.circle,
          border: border,
        ),
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            Icon(
              icon,
              size: iconSize,
              color: isInteractive
                  ? (color ?? PopoTheme.textPrimary)
                  : PopoTheme.textSecondary.withOpacity(0.4),
            ),
            if (badgeCount > 0)
              Positioned(
                top: -2,
                right: -2,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 5,
                    vertical: 1.5,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  decoration: BoxDecoration(
                    color: badgeColor ?? PopoTheme.primary,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: PopoTheme.surface, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: (badgeColor ?? PopoTheme.primary).withOpacity(
                          0.4,
                        ),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Text(
                    badgeCount > 99 ? '99+' : '$badgeCount',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      height: 1.1,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );

    if (tooltip != null && tooltip!.isNotEmpty) {
      button = Tooltip(message: tooltip!, child: button);
    }

    return Semantics(
      button: true,
      enabled: isInteractive,
      label: tooltip,
      child: button,
    );
  }
}
