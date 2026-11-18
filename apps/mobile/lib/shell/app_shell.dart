import 'package:flutter/material.dart';

import '../theme/popo_theme.dart';
import '../l10n/strings.dart';
import '../widgets/popo_bottom_navigation.dart';
import '../screens/discovery/explore_home_screen.dart';
import '../screens/party/party_discovery_screen.dart';
import '../screens/square/square_discovery_screen.dart';
import '../screens/inbox/inbox_screen.dart';
import '../screens/profile/me_screen.dart';

/// Master 5-Destination Application Shell for Popo Live (Phase 2 - D1)
/// Order: [0: Live] → [1: Explore] → [2: Square] → [3: Message] → [4: Me]
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
          body: IndexedStack(
            index: _currentIndex,
            children: const [
              ExploreHomeScreen(), // 0: Live (broadcast discovery & live feeds)
              PartyDiscoveryScreen(), // 1: Explore (explore / sparkle discovery)
              SquareDiscoveryScreen(), // 2: Square (community posts & creator feeds)
              InboxScreen(), // 3: Message (direct chats & official notices)
              MeScreen(), // 4: Me (user profile, wallet, VIP, bag, agency)
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
}
