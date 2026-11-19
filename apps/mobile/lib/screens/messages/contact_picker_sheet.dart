import 'package:flutter/material.dart';
import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';

/// Modal bottom sheet allowing user to select a fixture contact to start a new chat
class ContactPickerSheet extends StatefulWidget {
  final ValueChanged<FixtureUserProfile> onSelectUser;

  const ContactPickerSheet({
    super.key,
    required this.onSelectUser,
  });

  @override
  State<ContactPickerSheet> createState() => _ContactPickerSheetState();
}

class _ContactPickerSheetState extends State<ContactPickerSheet> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final allUsers = DesignFixtures.userProfiles;
    final currentUserId = DesignFixtures.currentUserProfile.userId;

    final filteredUsers = allUsers.where((u) {
      if (u.userId == currentUserId) return false;
      if (_query.isEmpty) return true;
      final q = _query.toLowerCase();
      return u.nickname.toLowerCase().contains(q) ||
          u.poppoId.toLowerCase().contains(q) ||
          u.country.toLowerCase().contains(q);
    }).toList();

    return Material(
      color: PopoTheme.surface,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: Column(
          children: [
            // Drag Handle
            const SizedBox(height: 10),
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'New Message',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    key: const Key('contact_picker_close_button'),
                    icon:
                        const Icon(Icons.close_rounded, color: Colors.white70),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Search Field
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                height: 42,
                decoration: BoxDecoration(
                  color: PopoTheme.background,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: PopoTheme.borderSubtle),
                ),
                child: TextField(
                  key: const Key('contact_search_input'),
                  controller: _searchController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search people by name or ID...',
                    hintStyle: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 13,
                    ),
                    prefixIcon: const Icon(
                      Icons.search_rounded,
                      color: PopoTheme.textSecondary,
                      size: 18,
                    ),
                    suffixIcon: _query.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              Icons.clear_rounded,
                              color: PopoTheme.textSecondary,
                              size: 16,
                            ),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _query = '');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onChanged: (val) {
                    setState(() => _query = val.trim());
                  },
                ),
              ),
            ),

            // Users List
            Expanded(
              child: filteredUsers.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.person_off_rounded,
                            color: PopoTheme.textSecondary,
                            size: 38,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _query.isEmpty
                                ? 'No available contacts'
                                : 'No contacts found for "$_query"',
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      itemCount: filteredUsers.length,
                      separatorBuilder: (_, __) => const Divider(
                        color: PopoTheme.borderSubtle,
                        height: 1,
                      ),
                      itemBuilder: (context, index) {
                        final user = filteredUsers[index];
                        return ListTile(
                          key: Key('contact_user_${user.userId}'),
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 4,
                            horizontal: 4,
                          ),
                          leading: CircleAvatar(
                            radius: 22,
                            backgroundColor: Colors.white12,
                            backgroundImage: NetworkImage(user.avatarUrl),
                          ),
                          title: Row(
                            children: [
                              Flexible(
                                child: Text(
                                  user.nickname,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(user.flagEmoji,
                                  style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                          subtitle: Text(
                            'ID: ${user.poppoId} · Lv.${user.wealthLevel}',
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: PopoTheme.primary.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: PopoTheme.primary.withOpacity(0.5),
                              ),
                            ),
                            child: const Text(
                              'Chat',
                              style: TextStyle(
                                color: PopoTheme.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          onTap: () {
                            Navigator.of(context).pop();
                            widget.onSelectUser(user);
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
