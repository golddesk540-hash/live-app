import 'package:flutter/material.dart';
import '../theme/popo_theme.dart';
import 'popo_icon_button.dart';

/// Unified branded App Bar for Popo Live
class PopoAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final Widget? titleWidget;
  final bool showBrandLogo;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final List<Widget>? actions;
  final Widget? bottom;
  final double bottomHeight;
  final bool centerTitle;

  const PopoAppBar({
    Key? key,
    this.title,
    this.titleWidget,
    this.showBrandLogo = false,
    this.showBackButton = true,
    this.onBackPressed,
    this.actions,
    this.bottom,
    this.bottomHeight = 0.0,
    this.centerTitle = false,
  }) : super(key: key);

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight + bottomHeight);

  @override
  Widget build(BuildContext context) {
    final ModalRoute<dynamic>? parentRoute = ModalRoute.of(context);
    final bool canPop = parentRoute?.canPop ?? false;
    final bool displayBack = showBackButton && canPop;

    Widget? leading;
    if (displayBack) {
      leading = PopoIconButton(
        icon: Icons.arrow_back_ios_new_rounded,
        iconSize: 18,
        tooltip: 'Back',
        onPressed: onBackPressed ?? () => Navigator.of(context).maybePop(),
      );
    } else if (showBrandLogo) {
      leading = Padding(
        padding: const EdgeInsets.only(left: 16.0, right: 8.0),
        child: Center(
          child: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: PopoTheme.primaryGradient,
              borderRadius: BorderRadius.circular(9),
              boxShadow: [
                BoxShadow(
                  color: PopoTheme.primary.withOpacity(0.35),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            alignment: Alignment.center,
            child: const Text(
              'PL',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ),
      );
    }

    Widget? effectiveTitle;
    if (titleWidget != null) {
      effectiveTitle = titleWidget;
    } else if (title != null) {
      effectiveTitle = Text(
        title!,
        style: const TextStyle(
          color: PopoTheme.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.2,
        ),
      );
    }

    return AppBar(
      backgroundColor: PopoTheme.surface,
      elevation: 0,
      centerTitle: centerTitle,
      leading: leading,
      leadingWidth: displayBack ? 52 : (showBrandLogo ? 48 : null),
      title: effectiveTitle,
      titleSpacing: (displayBack || showBrandLogo) ? 4.0 : 16.0,
      actions: actions != null
          ? [
              ...actions!,
              const SizedBox(width: 8),
            ]
          : null,
      bottom: bottom != null
          ? PreferredSize(
              preferredSize: Size.fromHeight(bottomHeight),
              child: bottom!,
            )
          : null,
      shape: const Border(
        bottom: BorderSide(
          color: PopoTheme.borderSubtle,
          width: 1.0,
        ),
      ),
    );
  }
}
