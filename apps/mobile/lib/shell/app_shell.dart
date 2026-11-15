import 'package:flutter/material.dart';
import '../theme/popo_theme.dart';
import '../l10n/strings.dart';
import '../widgets/popo_bottom_navigation.dart';
import '../widgets/popo_app_bar.dart';
import '../widgets/popo_icon_button.dart';
import '../widgets/popo_card.dart';
import '../widgets/popo_empty_state.dart';
import '../widgets/popo_secondary_button.dart';

/// Master 5-Tab Application Shell for Popo Live
/// Tabs: [0: Home] [1: Party] [2: Go Live] [3: Inbox] [4: Me]
class AppShell extends StatefulWidget {
  final int initialIndex;

  const AppShell({Key? key, this.initialIndex = 0}) : super(key: key);

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  void _onTabTapped(int index) {
    if (_currentIndex != index) {
      setState(() {
        _currentIndex = index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: _buildAppBarForCurrentTab(),
          body: IndexedStack(
            index: _currentIndex,
            children: [
              _buildHomeTab(),
              _buildLockedTab(
                title: PopoStrings.tabParty,
                subtitle: PopoStrings.partyOpensSprint2,
                icon: Icons.celebration_rounded,
                accentColor: PopoTheme.cyan,
              ),
              _buildLockedTab(
                title: PopoStrings.tabGoLive,
                subtitle: PopoStrings.goLiveOpensSprint2,
                icon: Icons.videocam_rounded,
                accentColor: PopoTheme.primary,
              ),
              _buildLockedTab(
                title: PopoStrings.tabInbox,
                subtitle: PopoStrings.inboxOpensSprint4,
                icon: Icons.mail_rounded,
                accentColor: PopoTheme.gold,
              ),
              _buildMeTab(),
            ],
          ),
          bottomNavigationBar: PopoBottomNavigation(
            currentIndex: _currentIndex,
            onTabSelected: _onTabTapped,
          ),
        );
      },
    );
  }

  PreferredSizeWidget _buildAppBarForCurrentTab() {
    String title = PopoStrings.appName;
    bool showBrandLogo = true;

    if (_currentIndex == 1) {
      title = PopoStrings.tabParty;
      showBrandLogo = false;
    } else if (_currentIndex == 2) {
      title = PopoStrings.tabGoLive;
      showBrandLogo = false;
    } else if (_currentIndex == 3) {
      title = PopoStrings.tabInbox;
      showBrandLogo = false;
    } else if (_currentIndex == 4) {
      title = PopoStrings.profileTitle;
      showBrandLogo = false;
    }

    return PopoAppBar(
      title: title,
      showBrandLogo: showBrandLogo,
      showBackButton: false,
      actions: [
        PopoIconButton(
          icon: Icons.translate_rounded,
          color: PopoTheme.cyan,
          iconSize: 20,
          tooltip: 'Switch Language (English / اردو)',
          onPressed: PopoStrings.toggleLanguage,
        ),
      ],
    );
  }

  /// Tab 0: Home / Explore Entry Point (Activates in Sprint 1 - M2 Explore)
  Widget _buildHomeTab() {
    return SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              PopoCard(
                hasGlow: true,
                glowColor: PopoTheme.primary,
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: PopoTheme.primary.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: PopoTheme.primary.withOpacity(0.4), width: 1.5),
                      ),
                      child: const Icon(
                        Icons.explore_rounded,
                        color: PopoTheme.primary,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      PopoStrings.explorePopular,
                      style: const TextStyle(
                        color: PopoTheme.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Ready for M2 Explore: Next.js live streaming room feeds, banners, country filters, and rankings.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 13,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Tab 4: Me / Profile Entry Point (Activates in Sprint 1 - M1 Me Center)
  Widget _buildMeTab() {
    return SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              PopoCard(
                hasGlow: true,
                glowColor: PopoTheme.gold,
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: PopoTheme.gold.withOpacity(0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: PopoTheme.gold.withOpacity(0.4), width: 1.5),
                      ),
                      child: const Icon(
                        Icons.account_circle_rounded,
                        color: PopoTheme.gold,
                        size: 36,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      PopoStrings.profileTitle,
                      style: const TextStyle(
                        color: PopoTheme.textPrimary,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Ready for M1: Live user profile, 18+ Age verification, ID copy, and secure authentication.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 13,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Placeholder for tabs locked until future sprints
  Widget _buildLockedTab({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color accentColor,
  }) {
    return SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              PopoEmptyState(
                icon: icon,
                iconColor: accentColor,
                title: title,
                message: subtitle,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: accentColor.withOpacity(0.3)),
                ),
                child: Text(
                  PopoStrings.comingSoonSprint,
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              PopoSecondaryButton(
                text: PopoStrings.get('back_to_explore'),
                icon: Icons.arrow_back_rounded,
                width: 190,
                height: 42,
                isFullWidth: false,
                onPressed: () => _onTabTapped(0),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
