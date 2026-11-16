import 'package:flutter/material.dart';

import '../theme/popo_theme.dart';
import '../l10n/strings.dart';
import '../widgets/popo_bottom_navigation.dart';
import '../widgets/popo_app_bar.dart';
import '../widgets/popo_icon_button.dart';
import '../widgets/popo_card.dart';
import '../widgets/popo_empty_state.dart';
import '../widgets/popo_secondary_button.dart';
import '../screens/profile/me_screen.dart';
import '../screens/discovery/explore_home_screen.dart';
import '../screens/live/go_live_gate_screen.dart';
import '../screens/party/party_discovery_screen.dart';
import '../screens/inbox/inbox_screen.dart';

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
              const ExploreHomeScreen(),
              const PartyDiscoveryScreen(),
              const GoLiveGateScreen(),
              const InboxScreen(),
              const MeScreen(),
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

  PreferredSizeWidget? _buildAppBarForCurrentTab() {
    // All 5 tabs (Explore, Party, Go Live, Inbox, Me) manage their own specialized AppBars
    return null;
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
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 5,
                ),
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
