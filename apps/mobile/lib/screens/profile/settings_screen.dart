import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_secondary_button.dart';
import '../../widgets/popo_card.dart';
import '../../auth/auth_state.dart';
import '../auth/login_screen.dart';
import '../../services/notifications/notification_preferences_service.dart';

/// Settings screen managing language preference, application information, and secure logout
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: PopoTheme.borderSubtle),
        ),
        title: Text(
          PopoStrings.get('logout'),
          style: const TextStyle(
            color: PopoTheme.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Text(
          PopoStrings.get('confirm_logout'),
          style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              PopoStrings.get('cancel'),
              style: const TextStyle(color: PopoTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: PopoTheme.danger,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              await AuthState.instance.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            child: Text(PopoStrings.get('logout')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, currentLang, _) {
        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: PopoIconButton(
              icon: Icons.arrow_back_ios_new_rounded,
              iconSize: 18,
              tooltip: 'Back',
              onPressed: () => Navigator.of(context).maybePop(),
            ),
            title: Text(
              PopoStrings.get('settings_title'),
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              children: [
                // User Information Card (R4)
                PopoCard(
                  key: const Key('settings_user_info_card'),
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundImage: DesignFixtures
                                .currentUserProfile.avatarUrl.isNotEmpty
                            ? NetworkImage(
                                DesignFixtures.currentUserProfile.avatarUrl)
                            : null,
                        backgroundColor: const Color(0xFF2A124C),
                        child: DesignFixtures
                                .currentUserProfile.avatarUrl.isEmpty
                            ? const Icon(Icons.person,
                                color: Colors.white, size: 28)
                            : null,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  DesignFixtures.currentUserProfile.nickname,
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  DesignFixtures.currentUserProfile.flagEmoji,
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'ID: ${DesignFixtures.currentUserProfile.poppoId} • ${DesignFixtures.currentUserProfile.country}',
                              style: const TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0x33FFB800),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                        color: const Color(0x66FFB800)),
                                  ),
                                  child: Text(
                                    'Wealth Lv.${DesignFixtures.currentUserProfile.wealthLevel}',
                                    style: const TextStyle(
                                      color: Color(0xFFFFB800),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0x3300E5FF),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                        color: const Color(0x6600E5FF)),
                                  ),
                                  child: Text(
                                    'Host Lv.${DesignFixtures.currentUserProfile.hostLevel}',
                                    style: const TextStyle(
                                      color: Color(0xFF00E5FF),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Language Selection Card
                PopoCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.language_rounded,
                            color: PopoTheme.cyan,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            PopoStrings.get('language'),
                            style: const TextStyle(
                              color: PopoTheme.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      RadioListTile<String>(
                        title: const Text(
                          'English (Default)',
                          style: TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 14,
                          ),
                        ),
                        value: 'en',
                        groupValue: currentLang,
                        activeColor: PopoTheme.primary,
                        onChanged: (val) {
                          if (val != null) PopoStrings.setLanguage(val);
                        },
                      ),
                      RadioListTile<String>(
                        title: const Text(
                          'اردو (Urdu - Nastaliq)',
                          style: TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 14,
                          ),
                        ),
                        value: 'ur',
                        groupValue: currentLang,
                        activeColor: PopoTheme.primary,
                        onChanged: (val) {
                          if (val != null) PopoStrings.setLanguage(val);
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Push Notification Preferences Card
                const _NotificationPreferencesCard(),
                const SizedBox(height: 16),

                // Blocked Users Card (R4)
                const _BlockedUsersCard(),
                const SizedBox(height: 16),

                // App Info Card
                PopoCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildSettingRow(
                        icon: Icons.info_outline_rounded,
                        title: PopoStrings.get('app_version'),
                        trailing: '1.0.0 (Build 1)',
                      ),
                      const Divider(color: PopoTheme.borderSubtle, height: 20),
                      _buildSettingRow(
                        icon: Icons.verified_user_outlined,
                        title: PopoStrings.get('terms_and_privacy'),
                        trailing: 'v4.2.0 (Active)',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Logout Button
                PopoSecondaryButton(
                  text: PopoStrings.get('logout'),
                  icon: Icons.logout_rounded,
                  textColor: PopoTheme.danger,
                  borderColor: PopoTheme.danger.withOpacity(0.35),
                  onPressed: () => _confirmLogout(context),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSettingRow({
    required IconData icon,
    required String title,
    required String trailing,
  }) {
    return Row(
      children: [
        Icon(icon, color: PopoTheme.textSecondary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Text(
          trailing,
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 12.5,
          ),
        ),
      ],
    );
  }
}

class _NotificationPreferencesCard extends StatefulWidget {
  const _NotificationPreferencesCard({Key? key}) : super(key: key);

  @override
  State<_NotificationPreferencesCard> createState() => _NotificationPreferencesCardState();
}

class _NotificationPreferencesCardState extends State<_NotificationPreferencesCard> {
  UserNotificationPreferences _prefs = const UserNotificationPreferences();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final fetched = await NotificationPreferencesService.instance.fetchPreferences();
    if (mounted) {
      setState(() {
        _prefs = fetched;
        _isLoading = false;
      });
    }
  }

  Future<void> _updatePref(UserNotificationPreferences updated) async {
    setState(() => _prefs = updated);
    await NotificationPreferencesService.instance.updatePreferences(updated);
  }

  @override
  Widget build(BuildContext context) {
    final isUrdu = PopoStrings.currentLanguage.value == 'ur';

    return PopoCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.notifications_active_outlined, color: PopoTheme.primary, size: 20),
              const SizedBox(width: 10),
              Text(
                isUrdu ? 'نوٹیفیکیشن ترجیحات' : 'Notification Preferences',
                style: const TextStyle(
                  color: PopoTheme.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_isLoading)
            const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator(color: PopoTheme.primary)))
          else ...[
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(isUrdu ? 'ڈائریکٹ میسجز' : 'Direct Messages', style: const TextStyle(color: Colors.white, fontSize: 13)),
              subtitle: Text(isUrdu ? 'پرائیویٹ پیغامات کے الرٹس' : 'Alerts for private chats', style: const TextStyle(color: Colors.white54, fontSize: 11)),
              value: _prefs.directMessages,
              activeColor: PopoTheme.primary,
              onChanged: (val) => _updatePref(UserNotificationPreferences(
                directMessages: val,
                giftAlerts: _prefs.giftAlerts,
                liveBroadcasts: _prefs.liveBroadcasts,
                systemAnnouncements: _prefs.systemAnnouncements,
                promotional: _prefs.promotional,
              )),
            ),
            const Divider(color: PopoTheme.borderSubtle, height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(isUrdu ? 'گفٹس کے الرٹس' : 'Gift Received Alerts', style: const TextStyle(color: Colors.white, fontSize: 13)),
              subtitle: Text(isUrdu ? 'موصول ہونے والے ورچوئل تحائف' : 'Alerts when supporters send gifts', style: const TextStyle(color: Colors.white54, fontSize: 11)),
              value: _prefs.giftAlerts,
              activeColor: PopoTheme.gold,
              onChanged: (val) => _updatePref(UserNotificationPreferences(
                directMessages: _prefs.directMessages,
                giftAlerts: val,
                liveBroadcasts: _prefs.liveBroadcasts,
                systemAnnouncements: _prefs.systemAnnouncements,
                promotional: _prefs.promotional,
              )),
            ),
            const Divider(color: PopoTheme.borderSubtle, height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(isUrdu ? 'فالوورز کے لائیو براڈکاسٹس' : 'Followed Host Live Alerts', style: const TextStyle(color: Colors.white, fontSize: 13)),
              subtitle: Text(isUrdu ? 'پسندیدہ ہوسٹس کے لائیو آنے پر الرٹ' : 'Alerts when hosts you follow go live', style: const TextStyle(color: Colors.white54, fontSize: 11)),
              value: _prefs.liveBroadcasts,
              activeColor: PopoTheme.cyan,
              onChanged: (val) => _updatePref(UserNotificationPreferences(
                directMessages: _prefs.directMessages,
                giftAlerts: _prefs.giftAlerts,
                liveBroadcasts: val,
                systemAnnouncements: _prefs.systemAnnouncements,
                promotional: _prefs.promotional,
              )),
            ),
            const Divider(color: PopoTheme.borderSubtle, height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(isUrdu ? 'سسٹم اعلانات' : 'System Announcements', style: const TextStyle(color: Colors.white, fontSize: 13)),
              subtitle: Text(isUrdu ? 'پلیٹ فارم اور سیکیورٹی نوٹس' : 'Platform & security notices', style: const TextStyle(color: Colors.white54, fontSize: 11)),
              value: _prefs.systemAnnouncements,
              activeColor: PopoTheme.primary,
              onChanged: (val) => _updatePref(UserNotificationPreferences(
                directMessages: _prefs.directMessages,
                giftAlerts: _prefs.giftAlerts,
                liveBroadcasts: _prefs.liveBroadcasts,
                systemAnnouncements: val,
                promotional: _prefs.promotional,
              )),
            ),
          ],
        ],
      ),
    );
  }
}


class _BlockedUsersCard extends StatefulWidget {
  const _BlockedUsersCard({Key? key}) : super(key: key);

  @override
  State<_BlockedUsersCard> createState() => _BlockedUsersCardState();
}

class _BlockedUsersCardState extends State<_BlockedUsersCard> {
  void _openBlockedUsersSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final blocked = DesignFixtures.blockedUsers;

          return Container(
            key: const Key('blocked_users_sheet'),
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Color(0xFF1B1829),
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              border: Border(
                top: BorderSide(color: Color(0x44FF1A6C), width: 1.5),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.block_rounded,
                            color: Color(0xFFFF1A6C), size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'Blocked People (${blocked.length})',
                          style: const TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded,
                          color: PopoTheme.textSecondary),
                      onPressed: () => Navigator.of(ctx).pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Users you have blocked cannot message you or attend your private rooms.',
                  style: TextStyle(
                      color: PopoTheme.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 16),
                if (blocked.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'No blocked users in your list.',
                        style: TextStyle(
                            color: PopoTheme.textSecondary, fontSize: 13),
                      ),
                    ),
                  )
                else
                  ...blocked.map((u) => Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: PopoTheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: PopoTheme.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundImage: u.avatarUrl.isNotEmpty
                                  ? NetworkImage(u.avatarUrl)
                                  : null,
                              backgroundColor: const Color(0xFF2A124C),
                              child: u.avatarUrl.isEmpty
                                  ? const Icon(Icons.person,
                                      color: Colors.white, size: 20)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    u.nickname,
                                    style: const TextStyle(
                                      color: PopoTheme.textPrimary,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${u.reason} • ${u.blockedDate}',
                                    style: const TextStyle(
                                      color: PopoTheme.textSecondary,
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: PopoTheme.cyan,
                                side: const BorderSide(
                                    color: PopoTheme.cyan),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                shape: const StadiumBorder(),
                              ),
                              onPressed: () {
                                final unblocked =
                                    DesignFixtures.unblockUser(u.id);
                                if (unblocked) {
                                  setSheetState(() {});
                                  setState(() {});
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'Unblocked ${u.nickname} successfully.'),
                                      backgroundColor: PopoTheme.surface,
                                      duration:
                                          const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              },
                              child: const Text('Unblock',
                                  style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      )),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final count = DesignFixtures.blockedUsers.length;

    return PopoCard(
      key: const Key('settings_blocked_users_card'),
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: () => _openBlockedUsersSheet(context),
        borderRadius: BorderRadius.circular(12),
        child: Row(
          children: [
            const Icon(Icons.block_rounded,
                color: Color(0xFFFF1A6C), size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Blocked People',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$count user${count == 1 ? "" : "s"} blocked',
                    style: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded,
                color: PopoTheme.textSecondary, size: 14),
          ],
        ),
      ),
    );
  }
}
