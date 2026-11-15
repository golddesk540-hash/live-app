import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';

/// Reusable 3:4 aspect-ratio Live Stream Room Card for Discovery feeds
class RoomCard extends StatelessWidget {
  final Map<String, dynamic> room;
  final VoidCallback? onTap;

  const RoomCard({Key? key, required this.room, this.onTap}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final title = room['title']?.toString() ?? 'Live Stream';
    final coverUrl = room['coverUrl']?.toString();
    final isPk = room['isPk'] == true || room['category'] == 'pk';
    final isLive = room['isLive'] != false;
    final viewers =
        room['viewersFormatted']?.toString() ??
        (room['viewerCount']?.toString() ?? '0');
    final country = room['country']?.toString() ?? '';
    final flagEmoji = room['flagEmoji']?.toString() ?? '🌐';

    final host = room['host'] is Map ? room['host'] as Map : null;
    final hostNickname = host?['nickname']?.toString() ?? 'Broadcaster';
    final hostAvatar = host?['avatarUrl']?.toString();
    final isVerified = host?['isVerified'] == true;

    return AspectRatio(
      aspectRatio: 3 / 4,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: PopoTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: PopoTheme.borderSubtle, width: 1.0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.35),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // 1. Cover Image with Fallback
              _buildCoverImage(coverUrl),

              // 2. Gradient Overlay for Text Readability
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black38,
                      Colors.transparent,
                      Colors.transparent,
                      Colors.black87,
                    ],
                    stops: [0.0, 0.25, 0.6, 1.0],
                  ),
                ),
              ),

              // 3. Top Badges (LIVE + PK Badge + Viewers)
              Positioned(
                top: 10,
                left: 10,
                right: 10,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // LIVE / PK Badge
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isLive)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Text(
                                  'LIVE',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (isPk) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'PK',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),

                    // Viewer Count Badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.remove_red_eye_rounded,
                            size: 11,
                            color: Colors.white70,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            viewers,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 4. Bottom Host Info & Room Title
              Positioned(
                bottom: 10,
                left: 10,
                right: 10,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Title
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        shadows: [
                          Shadow(
                            color: Colors.black87,
                            blurRadius: 4,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Host Row (Avatar, Nickname, Flag)
                    Row(
                      children: [
                        // Host Avatar
                        _buildHostAvatar(hostAvatar, hostNickname),
                        const SizedBox(width: 6),

                        // Host Nickname
                        Expanded(
                          child: Row(
                            children: [
                              Flexible(
                                child: Text(
                                  hostNickname,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              if (isVerified) ...[
                                const SizedBox(width: 3),
                                const Icon(
                                  Icons.verified,
                                  color: PopoTheme.cyan,
                                  size: 12,
                                ),
                              ],
                            ],
                          ),
                        ),

                        // Country Flag
                        if (flagEmoji.isNotEmpty)
                          Text(flagEmoji, style: const TextStyle(fontSize: 12)),
                      ],
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

  Widget _buildCoverImage(String? coverUrl) {
    if (coverUrl != null &&
        coverUrl.isNotEmpty &&
        (coverUrl.startsWith('http') || coverUrl.startsWith('/'))) {
      final effectiveUrl = coverUrl.startsWith('http')
          ? coverUrl
          : 'https://kigolive.com$coverUrl';
      return Image.network(
        effectiveUrl,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildFallbackBackground(),
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return _buildFallbackBackground();
        },
      );
    }
    return _buildFallbackBackground();
  }

  Widget _buildFallbackBackground() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2A1435), Color(0xFF161622)],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.live_tv_rounded,
          size: 40,
          color: PopoTheme.primary.withOpacity(0.3),
        ),
      ),
    );
  }

  Widget _buildHostAvatar(String? avatarUrl, String nickname) {
    final initials = nickname.isNotEmpty ? nickname[0].toUpperCase() : 'P';
    if (avatarUrl != null &&
        avatarUrl.isNotEmpty &&
        !avatarUrl.contains('default.png') &&
        avatarUrl.startsWith('http')) {
      return CircleAvatar(radius: 11, backgroundImage: NetworkImage(avatarUrl));
    }
    return CircleAvatar(
      radius: 11,
      backgroundColor: PopoTheme.primary.withOpacity(0.3),
      child: Text(
        initials,
        style: const TextStyle(
          color: PopoTheme.primary,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
