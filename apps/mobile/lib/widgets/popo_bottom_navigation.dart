import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/popo_theme.dart';
import '../l10n/strings.dart';

/// Premium 5-Destination Bottom Navigation Bar for Popo Live (Phase 2 - D1)
/// Destinations in exact order:
/// [0: Live] → [1: Explore] → [2: Square] → [3: Message] → [4: Me]
///
/// Clean, uniform bottom navigation without a raised or floating Go Live button.
class PopoBottomNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTabSelected;
  final int messageBadgeCount;
  final int inboxBadgeCount;

  const PopoBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTabSelected,
    this.messageBadgeCount = 0,
    this.inboxBadgeCount = 0,
  });

  int get _effectiveMessageBadge =>
      messageBadgeCount > 0 ? messageBadgeCount : inboxBadgeCount;

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
        left: 8,
        right: 8,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          // 0: Live
          _buildNavItem(
            index: 0,
            icon: Icons.live_tv_outlined,
            activeIcon: Icons.live_tv_rounded,
            label: PopoStrings.tabLive,
          ),
          // 1: Explore / Sparkle
          _buildNavItem(
            index: 1,
            icon: Icons.auto_awesome_outlined,
            activeIcon: Icons.auto_awesome_rounded,
            label: PopoStrings.tabExplore,
          ),
          // 2: Square
          _buildNavItem(
            index: 2,
            icon: Icons.grid_view_outlined,
            activeIcon: Icons.grid_view_rounded,
            label: PopoStrings.tabSquare,
          ),
          // 3: Message / Chat
          _buildNavItem(
            index: 3,
            icon: Icons.chat_bubble_outline_rounded,
            activeIcon: Icons.chat_bubble_rounded,
            label: PopoStrings.tabMessage,
            badgeCount: _effectiveMessageBadge,
          ),
          // 4: Me / Bag
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
    int badgeCount = 0,
  }) {
    final isSelected = currentIndex == index;

    return InkWell(
      onTap: () => _handleTap(index),
      borderRadius: BorderRadius.circular(16),
      splashColor: PopoTheme.primary.withOpacity(0.15),
      highlightColor: Colors.transparent,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        constraints: const BoxConstraints(minWidth: 56, minHeight: 48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                AnimatedScale(
                  scale: isSelected ? 1.12 : 1.0,
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOutCubic,
                  child: Icon(
                    isSelected ? activeIcon : icon,
                    color: isSelected
                        ? PopoTheme.primary
                        : PopoTheme.textSecondary,
                    size: 22,
                  ),
                ),
                if (badgeCount > 0)
                  Positioned(
                    top: -2,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 4,
                        vertical: 1,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 14,
                        minHeight: 14,
                      ),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary,
                        borderRadius: BorderRadius.circular(7),
                        border: Border.all(
                          color: PopoTheme.surface,
                          width: 1.5,
                        ),
                      ),
                      child: Text(
                        badgeCount > 99 ? '99+' : '$badgeCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? PopoTheme.primary : PopoTheme.textSecondary,
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                letterSpacing: 0.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: isSelected ? 4 : 0,
              height: isSelected ? 4 : 0,
              decoration: BoxDecoration(
                color: isSelected ? PopoTheme.primary : Colors.transparent,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
