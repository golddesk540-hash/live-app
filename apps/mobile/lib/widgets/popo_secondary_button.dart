import 'package:flutter/material.dart';
import '../theme/popo_theme.dart';

/// Secondary / Outlined Button with subtle surface styling and optional icon
class PopoSecondaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final double? width;
  final double height;
  final bool isFullWidth;
  final Color? borderColor;
  final Color? textColor;
  final Color? backgroundColor;

  const PopoSecondaryButton({
    Key? key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.width,
    this.height = 48,
    this.isFullWidth = true,
    this.borderColor,
    this.textColor,
    this.backgroundColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final bool enabled = onPressed != null && !isLoading;
    final Color effectiveBorder = borderColor ?? PopoTheme.borderSubtle;
    final Color effectiveText = textColor ?? (enabled ? PopoTheme.textPrimary : PopoTheme.textSecondary);
    final Color effectiveBg = backgroundColor ?? PopoTheme.surface;

    return Container(
      width: isFullWidth ? (width ?? double.infinity) : width,
      height: height,
      decoration: BoxDecoration(
        color: effectiveBg,
        borderRadius: BorderRadius.circular(height / 2),
        border: Border.all(
          color: enabled ? effectiveBorder : effectiveBorder.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? onPressed : null,
          borderRadius: BorderRadius.circular(height / 2),
          splashColor: Colors.white.withOpacity(0.08),
          highlightColor: Colors.transparent,
          child: Center(
            child: isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.0,
                      valueColor: AlwaysStoppedAnimation<Color>(effectiveText),
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, color: effectiveText, size: 18),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        text,
                        style: TextStyle(
                          color: effectiveText,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
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
