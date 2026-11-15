import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/popo_theme.dart';
import '../l10n/strings.dart';

/// Premium 5-Tab Bottom Navigation Bar for Popo Live
/// Tabs: [Home] [Party] [Go Live (Center CTA)] [Inbox] [Me]
class PopoBottomNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;

  const PopoBottomNavigation({
    Key? key,
    required this.currentIndex,
    required this.onTabSelected,
  }) : super(key: key);

  void _handleTap(int index) {
    if (currentIndex != index) {
      HapticFeedback.selectionClick();
      onTabSelected(index);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        border: const Border(
          top: BorderSide(color: PopoTheme.borderSubtle, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: EdgeInsets.only(
        top: 8,
        bottom: bottomPadding > 0 ? bottomPadding : 10,
        left: 12,
        right: 12,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(
            index: 0,
            icon: Icons.explore_outlined,
            activeIcon: Icons.explore_rounded,
            label: PopoStrings.tabHome,
          ),
          _buildNavItem(
            index: 1,
            icon: Icons.celebration_outlined,
            activeIcon: Icons.celebration_rounded,
            label: PopoStrings.tabParty,
          ),
          _buildCenterGoLiveButton(),
          _buildNavItem(
            index: 3,
            icon: Icons.mail_outline_rounded,
            activeIcon: Icons.mail_rounded,
            label: PopoStrings.tabInbox,
          ),
          _buildNavItem(
            index: 4,
            icon: Icons.person_outline_rounded,
            activeIcon: Icons.person_rounded,
            label: PopoStrings.tabMe,
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isSelected = currentIndex == index;

    return InkWell(
      onTap: () => _handleTap(index),
      borderRadius: BorderRadius.circular(16),
      splashColor: PopoTheme.primary.withOpacity(0.15),
      highlightColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        constraints: const BoxConstraints(minWidth: 54, minHeight: 46),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: isSelected ? 1.12 : 1.0,
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              child: Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? PopoTheme.primary : PopoTheme.textSecondary,
                size: 22,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? PopoTheme.primary : PopoTheme.textSecondary,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                letterSpacing: 0.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterGoLiveButton() {
    final isSelected = currentIndex == 2;

    return InkWell(
      onTap: () => _handleTap(2),
      borderRadius: BorderRadius.circular(30),
      splashColor: PopoTheme.primaryDark.withOpacity(0.3),
      highlightColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        constraints: const BoxConstraints(minWidth: 54),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: PopoTheme.primaryGradient,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? Colors.white : Colors.white.withOpacity(0.2),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: PopoTheme.primary.withOpacity(0.45),
                    blurRadius: 10,
                    spreadRadius: 1,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.videocam_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              PopoStrings.tabGoLive,
              style: TextStyle(
                color: isSelected ? PopoTheme.primary : PopoTheme.textSecondary,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
