import 'package:flutter/material.dart';

import '../theme/popo_theme.dart';

/// Premium dark surface card with subtle borders, optional glow, and tap interactions
class PopoCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final double borderRadius;
  final Color? backgroundColor;
  final Color? borderColor;
  final Gradient? gradient;
  final bool hasGlow;
  final Color? glowColor;

  const PopoCard({
    Key? key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.borderRadius = 16.0,
    this.backgroundColor,
    this.borderColor,
    this.gradient,
    this.hasGlow = false,
    this.glowColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final effectiveBorderRadius = BorderRadius.circular(borderRadius);
    final effectiveGlowColor = glowColor ?? PopoTheme.primary;

    Widget cardContent = Container(
      padding: padding ?? const EdgeInsets.all(16.0),
      child: child,
    );

    if (onTap != null) {
      cardContent = Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: effectiveBorderRadius,
          splashColor: PopoTheme.primary.withOpacity(0.12),
          highlightColor: Colors.transparent,
          child: cardContent,
        ),
      );
    }

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: gradient == null ? (backgroundColor ?? PopoTheme.surface) : null,
        gradient: gradient,
        borderRadius: effectiveBorderRadius,
        border: Border.all(
          color: borderColor ?? PopoTheme.borderSubtle,
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
          if (hasGlow)
            BoxShadow(
              color: effectiveGlowColor.withOpacity(0.2),
              blurRadius: 16,
              spreadRadius: 1,
              offset: const Offset(0, 2),
            ),
        ],
      ),
      child: ClipRRect(
        borderRadius: effectiveBorderRadius,
        child: Material(
          color: Colors.transparent,
          child: cardContent,
        ),
      ),
    );
  }
}
