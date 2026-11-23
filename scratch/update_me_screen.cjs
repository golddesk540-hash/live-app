const fs = require('fs');
const path = 'apps/mobile/lib/screens/profile/me_screen.dart';

let content = fs.readFileSync(path, 'utf8');

// 1. Add import 'user_relation_list_screen.dart' if not present
if (!content.includes("import 'user_relation_list_screen.dart';")) {
  content = content.replace(
    "import 'settings_screen.dart';",
    "import 'settings_screen.dart';\nimport 'user_relation_list_screen.dart';"
  );
}

// 2. Remove _showCountPreview function
const showCountPreviewRegex = /\s*\/\/ Interactive sheet preview for profile counts\s*void _showCountPreview\(String title, int count, String description\) \{[\s\S]*?\n  \}/;
if (showCountPreviewRegex.test(content)) {
  content = content.replace(showCountPreviewRegex, '');
  console.log('Removed _showCountPreview');
} else {
  console.log('Could not find _showCountPreview');
}

// 3. Update _buildCountsRow to open UserRelationListScreen
const oldCountsRow = `          _buildCountItem(
            entryKey: const Key('me_friends_entry'),
            countKey: const Key('me_friends_count'),
            count: user.friendsCount,
            title: 'Friends',
            icon: Icons.people_alt_rounded,
            onTap: () => _showCountPreview(
              'Friends',
              user.friendsCount,
              'Mutual friends connected with you on Popo Live.',
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_following_entry'),
            countKey: const Key('me_following_count'),
            count: user.followingCount,
            title: 'Following',
            icon: Icons.person_add_alt_1_rounded,
            onTap: () => _showCountPreview(
              'Following',
              user.followingCount,
              'Broadcasters and friends you currently follow.',
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_followers_entry'),
            countKey: const Key('me_followers_count'),
            count: user.followersCount,
            title: 'Followers',
            icon: Icons.favorite_rounded,
            onTap: () => _showCountPreview(
              'Followers',
              user.followersCount,
              'Users and fans following your broadcasts and profile.',
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_visitors_entry'),
            countKey: const Key('me_visitors_count'),
            count: user.visitorCount,
            title: 'Visitors',
            icon: Icons.remove_red_eye_rounded,
            onTap: () => _showCountPreview(
              'Visitors',
              user.visitorCount,
              'Recent viewers who browsed your profile page.',
            ),
          ),`;

const newCountsRow = `          _buildCountItem(
            entryKey: const Key('me_friends_entry'),
            countKey: const Key('me_friends_count'),
            count: user.friendsCount,
            title: 'Friends',
            icon: Icons.people_alt_rounded,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.friends,
                  count: user.friendsCount,
                ),
              ),
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_following_entry'),
            countKey: const Key('me_following_count'),
            count: user.followingCount,
            title: 'Following',
            icon: Icons.person_add_alt_1_rounded,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.following,
                  count: user.followingCount,
                ),
              ),
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_followers_entry'),
            countKey: const Key('me_followers_count'),
            count: user.followersCount,
            title: 'Followers',
            icon: Icons.favorite_rounded,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.followers,
                  count: user.followersCount,
                ),
              ),
            ),
          ),
          _buildCountDivider(),
          _buildCountItem(
            entryKey: const Key('me_visitors_entry'),
            countKey: const Key('me_visitors_count'),
            count: user.visitorCount,
            title: 'Visitors',
            icon: Icons.remove_red_eye_rounded,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.visitors,
                  count: user.visitorCount,
                ),
              ),
            ),
          ),`;

// Normalize CRLF to LF for matching, then restore CRLF
const isCRLF = content.includes('\r\n');
let normContent = content.replace(/\r\n/g, '\n');
const normOld = oldCountsRow.replace(/\r\n/g, '\n');
const normNew = newCountsRow.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  normContent = normContent.replace(normOld, normNew);
  console.log('Replaced _buildCountsRow with UserRelationListScreen pushes');
} else {
  console.log('Could not find old _buildCountsRow');
}

if (isCRLF) {
  normContent = normContent.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, normContent, 'utf8');
console.log('Successfully wrote updated UTF-8 content to', path);
