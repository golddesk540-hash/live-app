import 'package:flutter/material.dart';

import '../theme/popo_theme.dart';

/// Premium CTA Button with Popo Live Rose Pink gradient and glowing shadow
class PopoPrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? width;
  final double height;
  final bool isFullWidth;

  const PopoPrimaryButton({
    Key? key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.width,
    this.height = 48,
    this.isFullWidth = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool enabled = onPressed != null && !isLoading;

    return Container(
      width: isFullWidth ? (width ?? double.infinity) : width,
      height: height,
      decoration: BoxDecoration(
        gradient: enabled ? PopoTheme.primaryGradient : null,
        color: enabled ? null : PopoTheme.surface,
        borderRadius: BorderRadius.circular(height / 2),
        border: enabled ? null : Border.all(color: PopoTheme.borderSubtle),
        boxShadow: enabled
            ? [
                BoxShadow(
                  color: PopoTheme.primary.withOpacity(0.35),
                  blurRadius: 12,
                  spreadRadius: 1,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? onPressed : null,
          borderRadius: BorderRadius.circular(height / 2),
          splashColor: Colors.white.withOpacity(0.2),
          highlightColor: Colors.transparent,
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, color: Colors.white, size: 18),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        text,
                        style: TextStyle(
                          color: enabled
                              ? Colors.white
                              : PopoTheme.textSecondary,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
