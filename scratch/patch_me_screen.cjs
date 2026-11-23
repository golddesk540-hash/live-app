const fs = require('fs');
const filePath = 'apps/mobile/lib/screens/profile/me_screen.dart';
let content = fs.readFileSync(filePath, 'utf8');

const oldFriends = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.friends,
                  count: user.friendsCount,
                ),
              ),
            ),`;

const newFriends = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.friends,
                  count: user.friendsCount,
                  userId: user.userId,
                ),
              ),
            ).then((_) {
              if (mounted && ApiConfig.useFinalApi) _loadLiveProfile();
            }),`;

const oldFollowing = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.following,
                  count: user.followingCount,
                ),
              ),
            ),`;

const newFollowing = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.following,
                  count: user.followingCount,
                  userId: user.userId,
                ),
              ),
            ).then((_) {
              if (mounted && ApiConfig.useFinalApi) _loadLiveProfile();
            }),`;

const oldFollowers = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.followers,
                  count: user.followersCount,
                ),
              ),
            ),`;

const newFollowers = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.followers,
                  count: user.followersCount,
                  userId: user.userId,
                ),
              ),
            ).then((_) {
              if (mounted && ApiConfig.useFinalApi) _loadLiveProfile();
            }),`;

const oldVisitors = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.visitors,
                  count: user.visitorCount,
                ),
              ),
            ),`;

const newVisitors = `            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => UserRelationListScreen(
                  type: UserRelationType.visitors,
                  count: user.visitorCount,
                  userId: user.userId,
                ),
              ),
            ).then((_) {
              if (mounted && ApiConfig.useFinalApi) _loadLiveProfile();
            }),`;

// Normalize \r\n to \n for matching and then restore or keep consistent
const isCRLF = content.includes('\r\n');
let normContent = content.replace(/\r\n/g, '\n');

if (normContent.includes(oldFriends)) {
  normContent = normContent.replace(oldFriends, newFriends);
  console.log('Patched friends');
} else {
  console.log('Friends not found');
}

if (normContent.includes(oldFollowing)) {
  normContent = normContent.replace(oldFollowing, newFollowing);
  console.log('Patched following');
} else {
  console.log('Following not found');
}

if (normContent.includes(oldFollowers)) {
  normContent = normContent.replace(oldFollowers, newFollowers);
  console.log('Patched followers');
} else {
  console.log('Followers not found');
}

if (normContent.includes(oldVisitors)) {
  normContent = normContent.replace(oldVisitors, newVisitors);
  console.log('Patched visitors');
} else {
  console.log('Visitors not found');
}

fs.writeFileSync(filePath, isCRLF ? normContent.replace(/\n/g, '\r\n') : normContent, 'utf8');
console.log('me_screen.dart successfully updated!');
