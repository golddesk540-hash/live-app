import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
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
  bool _isLoading = true;

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
