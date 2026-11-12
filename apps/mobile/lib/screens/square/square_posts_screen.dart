import 'package:flutter/material.dart';

/// Popo Live — Phase 8.3: Square Posts Frontend
/// Frontend-only local state matching 08_03_square_posts.png dark purple theme.
class SquareCommentModel {
  final String id;
  final String authorName;
  final String text;
  final String timestamp;

  SquareCommentModel({
    required this.id,
    required this.authorName,
    required this.text,
    required this.timestamp,
  });
}

class SquarePostModel {
  final String id;
  final String creatorId;
  final String creatorName;
  final String creatorHandle;
  final bool isVerified;
  final bool isVip;
  final Color ringColor;
  final String publishedAgo;
  final String visibility;
  final String text;
  final List<String> hashtags;
  final String mediaType; // single_image | multi_image | video | live_invite | none
  final String? liveRoomLabel;
  int likesCount;
  bool isLiked;
  bool isSaved;
  int sharesCount;
  final int popularityScore;
  final List<SquareCommentModel> comments;

  SquarePostModel({
    required this.id,
    required this.creatorId,
    required this.creatorName,
    required this.creatorHandle,
    this.isVerified = false,
    this.isVip = false,
    required this.ringColor,
    required this.publishedAgo,
    required this.visibility,
    required this.text,
    required this.hashtags,
    this.mediaType = 'none',
    this.liveRoomLabel,
    required this.likesCount,
    this.isLiked = false,
    this.isSaved = false,
    required this.sharesCount,
    required this.popularityScore,
    required this.comments,
  });
}

class SquarePostsScreen extends StatefulWidget {
  const SquarePostsScreen({super.key});

  @override
  State<SquarePostsScreen> createState() => _SquarePostsScreenState();
}

class _SquarePostsScreenState extends State<SquarePostsScreen> {
  static const _bgDeep = Color(0xFF0C041C);
  static const _cardBg = Color(0xFF180A33);
  static const _surfaceBg = Color(0xFF211042);
  static const _neonPink = Color(0xFFFF1A6C);
  static const _gold = Color(0xFFFBBF24);

  String _activeTab = 'for_you'; // for_you | following | popular
  bool _showSearch = false;
  bool _savedOnly = false;
  String _searchQuery = '';
  final Set<String> _followedCreators = {'usr_ayesha', 'usr_hamza', 'usr_mina'};
  final Set<String> _hiddenPostIds = {};

  late List<SquarePostModel> _posts;

  @override
  void initState() {
    super.initState();
    _initSamplePosts();
  }

  void _initSamplePosts() {
    _posts = [
      SquarePostModel(
        id: 'p1',
        creatorId: 'usr_ayesha',
        creatorName: 'Ayesha Khan',
        creatorHandle: '@ayesha.live',
        isVerified: true,
        isVip: true,
        ringColor: _neonPink,
        publishedAgo: '2 hours ago',
        visibility: 'Public',
        text: 'Beautiful evening with my Popo family! Ready for tonight’s acoustic live session and team PK!',
        hashtags: ['#AcousticLive', '#PopoFamily'],
        mediaType: 'single_image',
        likesCount: 248,
        sharesCount: 19,
        popularityScore: 950,
        comments: [
          SquareCommentModel(
            id: 'c1',
            authorName: 'Hamza Ali',
            text: 'Count me in for tonight’s PK stage!',
            timestamp: '1 hour ago',
          ),
          SquareCommentModel(
            id: 'c2',
            authorName: 'Sara Noor',
            text: 'Love the warm lighting vibes.',
            timestamp: '42m ago',
          ),
        ],
      ),
      SquarePostModel(
        id: 'p2',
        creatorId: 'usr_hamza',
        creatorName: 'Hamza Ali',
        creatorHandle: '@hamza.pk',
        isVerified: true,
        isVip: true,
        ringColor: const Color(0xFF3B82F6),
        publishedAgo: '5 hours ago',
        visibility: 'Public',
        text: 'New live room is open. Come say hello! Nine seats unlocked — drop your favorite song.',
        hashtags: ['#LiveRoom', '#PartyTime'],
        mediaType: 'live_invite',
        liveRoomLabel: 'LIVE ROOM • JOIN',
        likesCount: 412,
        sharesCount: 48,
        popularityScore: 990,
        comments: [
          SquareCommentModel(
            id: 'c3',
            authorName: 'Zaid Star',
            text: 'Joining in 5 mins with a duet request!',
            timestamp: '3 hours ago',
          ),
        ],
      ),
      SquarePostModel(
        id: 'p3',
        creatorId: 'usr_sara',
        creatorName: 'Sara Noor',
        creatorHandle: '@sara.noor',
        isVerified: true,
        ringColor: const Color(0xFFA855F7),
        publishedAgo: '8 hours ago',
        visibility: 'Public',
        text: 'Weekend backstage gallery from the Dubai creator meetup. Grateful for every supporter!',
        hashtags: ['#CreatorMeetup', '#Highlights'],
        mediaType: 'multi_image',
        likesCount: 684,
        sharesCount: 64,
        popularityScore: 980,
        comments: [],
      ),
      SquarePostModel(
        id: 'p4',
        creatorId: 'usr_mina',
        creatorName: 'Mina Official',
        creatorHandle: '@mina.official',
        isVerified: true,
        isVip: true,
        ringColor: const Color(0xFF10B981),
        publishedAgo: '1 day ago',
        visibility: 'VIP Lounge',
        text: 'Highlights reel from yesterday’s Golden Crown celebration! Check out the entrance effects.',
        hashtags: ['#GoldenCrown', '#VIPHighlights'],
        mediaType: 'video',
        likesCount: 1290,
        sharesCount: 152,
        popularityScore: 1000,
        comments: [
          SquareCommentModel(
            id: 'c4',
            authorName: 'Ayesha Khan',
            text: 'Iconic performance Queen!',
            timestamp: '16 hours ago',
          ),
        ],
      ),
      SquarePostModel(
        id: 'p5',
        creatorId: 'usr_zaid',
        creatorName: 'Zaid Star',
        creatorHandle: '@zaid.star',
        ringColor: _gold,
        publishedAgo: '2 days ago',
        visibility: 'Followers Only',
        text: 'Quick question: Friday night karaoke theme — 90s Classics or Pop Hits? Vote in the comments!',
        hashtags: ['#KaraokeNight', '#CommunityPoll'],
        mediaType: 'none',
        likesCount: 175,
        sharesCount: 12,
        popularityScore: 760,
        comments: [],
      ),
    ];
  }

  List<SquarePostModel> get _visiblePosts {
    final q = _searchQuery.trim().toLowerCase();
    var items = _posts.where((p) {
      if (_hiddenPostIds.contains(p.id)) return false;
      if (_savedOnly && !p.isSaved) return false;
      if (_activeTab == 'following' && !_followedCreators.contains(p.creatorId)) {
        return false;
      }
      if (q.isNotEmpty) {
        final match = p.creatorName.toLowerCase().contains(q) ||
            p.creatorHandle.toLowerCase().contains(q) ||
            p.text.toLowerCase().contains(q) ||
            p.hashtags.any((t) => t.toLowerCase().contains(q));
        if (!match) return false;
      }
      return true;
    }).toList();

    if (_activeTab == 'popular') {
      items.sort((a, b) => (b.popularityScore + b.likesCount).compareTo(a.popularityScore + a.likesCount));
    }
    return items;
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF28124D),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _openCommentsSheet(SquarePostModel post) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF14072A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Comments (${post.comments.length})',
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white70),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white12),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 240),
                    child: post.comments.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 28),
                            child: Center(
                              child: Text('No comments yet. Start the conversation!',
                                  style: TextStyle(color: Colors.white54, fontSize: 12)),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            itemCount: post.comments.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (_, idx) {
                              final c = post.comments[idx];
                              return Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  CircleAvatar(
                                    radius: 14,
                                    backgroundColor: _neonPink,
                                    child: Text(c.authorName[0], style: const TextStyle(fontSize: 11, color: Colors.white)),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(c.authorName,
                                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                                            const SizedBox(width: 6),
                                            Text(c.timestamp, style: const TextStyle(color: Colors.white38, fontSize: 10)),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(c.text, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: controller,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Write a demo comment...',
                            hintStyle: const TextStyle(color: Colors.white38),
                            filled: true,
                            fillColor: _surfaceBg,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _neonPink,
                          shape: const CircleBorder(),
                          padding: const EdgeInsets.all(12),
                        ),
                        onPressed: () {
                          final txt = controller.text.trim();
                          if (txt.isEmpty) return;
                          setState(() {
                            post.comments.add(
                              SquareCommentModel(
                                id: 'c_${DateTime.now().millisecondsSinceEpoch}',
                                authorName: 'You',
                                text: txt,
                                timestamp: 'Just now',
                              ),
                            );
                          });
                          setSheetState(() {});
                          controller.clear();
                        },
                        child: const Icon(Icons.send_rounded, size: 18, color: Colors.white),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _openCreatePreviewSheet() {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF14072A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('New Square Post (Demo)',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            const Text('Full composer arrives in Module 8.4. Publish a quick text demo below.',
                style: TextStyle(color: Colors.white54, fontSize: 12)),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 3,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Share a community update with #PopoSquare...',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: _surfaceBg,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _neonPink,
                  shape: const StadiumBorder(),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: () {
                  final txt = controller.text.trim();
                  if (txt.isEmpty) return;
                  setState(() {
                    _posts.insert(
                      0,
                      SquarePostModel(
                        id: 'p_local_${DateTime.now().millisecondsSinceEpoch}',
                        creatorId: 'usr_ayesha',
                        creatorName: 'Ayesha Khan',
                        creatorHandle: '@ayesha.live',
                        isVerified: true,
                        ringColor: _neonPink,
                        publishedAgo: 'Just now',
                        visibility: 'Public',
                        text: txt,
                        hashtags: ['#PopoSquare'],
                        likesCount: 1,
                        isLiked: true,
                        sharesCount: 0,
                        popularityScore: 600,
                        comments: [],
                      ),
                    );
                    _activeTab = 'for_you';
                  });
                  Navigator.pop(ctx);
                  _showSnack('Published post to Square locally');
                },
                child: const Text('Publish Demo Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openPostOptions(SquarePostModel post) {
    final isFollowing = _followedCreators.contains(post.creatorId);
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF14072A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(post.isSaved ? Icons.bookmark : Icons.bookmark_border, color: _neonPink),
              title: Text(post.isSaved ? 'Unsave post' : 'Save post', style: const TextStyle(color: Colors.white)),
              onTap: () {
                setState(() => post.isSaved = !post.isSaved);
                Navigator.pop(ctx);
                _showSnack(post.isSaved ? 'Post saved' : 'Removed from saved');
              },
            ),
            ListTile(
              leading: const Icon(Icons.link, color: Colors.cyanAccent),
              title: const Text('Copy post link', style: TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                _showSnack('Post link copied');
              },
            ),
            ListTile(
              leading: Icon(isFollowing ? Icons.person_remove : Icons.person_add, color: Colors.purpleAccent),
              title: Text(isFollowing ? 'Unfollow creator' : 'Follow creator', style: const TextStyle(color: Colors.white)),
              onTap: () {
                setState(() {
                  if (isFollowing) {
                    _followedCreators.remove(post.creatorId);
                  } else {
                    _followedCreators.add(post.creatorId);
                  }
                });
                Navigator.pop(ctx);
                _showSnack(isFollowing ? 'Unfollowed ${post.creatorName}' : 'Following ${post.creatorName}');
              },
            ),
            ListTile(
              leading: const Icon(Icons.flag_outlined, color: Colors.amber),
              title: const Text('Report post (Module 8.5)', style: TextStyle(color: Colors.amber)),
              onTap: () {
                Navigator.pop(ctx);
                _showSnack('Post reported locally');
              },
            ),
            ListTile(
              leading: const Icon(Icons.visibility_off_outlined, color: Colors.redAccent),
              title: const Text('Hide post', style: TextStyle(color: Colors.redAccent)),
              onTap: () {
                setState(() => _hiddenPostIds.add(post.id));
                Navigator.pop(ctx);
                _showSnack('Post hidden from feed');
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final visible = _visiblePosts;

    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        elevation: 0,
        title: RichText(
          text: const TextSpan(
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            children: [
              TextSpan(text: 'Popo ', style: TextStyle(color: Colors.white)),
              TextSpan(text: 'Live', style: TextStyle(color: _neonPink)),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: _neonPink),
            tooltip: 'Create Post',
            onPressed: _openCreatePreviewSheet,
          ),
          IconButton(
            icon: Icon(Icons.search, color: _showSearch ? _neonPink : Colors.white70),
            onPressed: () => setState(() => _showSearch = !_showSearch),
          ),
          IconButton(
            icon: Icon(_savedOnly ? Icons.bookmark : Icons.bookmark_border, color: _savedOnly ? _neonPink : Colors.white70),
            onPressed: () => setState(() => _savedOnly = !_savedOnly),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Square', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
          const SizedBox(height: 2),
          const Text('Posts from your community', style: TextStyle(color: Colors.white60, fontSize: 13)),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildTabChip('for_you', 'For You'),
              const SizedBox(width: 8),
              _buildTabChip('following', 'Following'),
              const SizedBox(width: 8),
              _buildTabChip('popular', 'Popular'),
            ],
          ),
          if (_showSearch) ...[
            const SizedBox(height: 12),
            TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search posts, creators, #tags...',
                hintStyle: const TextStyle(color: Colors.white38),
                prefixIcon: const Icon(Icons.search, color: Colors.white54),
                filled: true,
                fillColor: _cardBg,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: BorderSide.none),
              ),
            ),
          ],
          const SizedBox(height: 16),
          if (visible.isEmpty)
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: _cardBg,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.explore_off_outlined, size: 42, color: _neonPink),
                  const SizedBox(height: 10),
                  const Text('No Square Posts Found', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 6),
                  const Text('Try clearing search filters or switch back to For You.',
                      textAlign: TextAlign.center, style: TextStyle(color: Colors.white54, fontSize: 12)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: _neonPink, shape: const StadiumBorder()),
                    onPressed: () {
                      setState(() {
                        _searchQuery = '';
                        _savedOnly = false;
                        _activeTab = 'for_you';
                      });
                    },
                    child: const Text('Reset Feed', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            )
          else
            ...visible.map(_buildPostCard),
        ],
      ),
    );
  }

  Widget _buildTabChip(String id, String label) {
    final active = _activeTab == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: active ? _neonPink : _surfaceBg,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Text(
            label,
            style: TextStyle(color: active ? Colors.white : Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }

  Widget _buildPostCard(SquarePostModel post) {
    final isFollowing = _followedCreators.contains(post.creatorId);
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(2.5),
                decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: post.ringColor, width: 2.5)),
                child: CircleAvatar(
                  radius: 18,
                  backgroundColor: _surfaceBg,
                  child: Text(post.creatorName[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(post.creatorName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        if (post.isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.verified, color: Colors.lightBlueAccent, size: 14),
                        ],
                      ],
                    ),
                    Text('${post.publishedAgo} · ${post.visibility}',
                        style: const TextStyle(color: Colors.white54, fontSize: 11)),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() {
                    if (isFollowing) {
                      _followedCreators.remove(post.creatorId);
                    } else {
                      _followedCreators.add(post.creatorId);
                    }
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isFollowing ? _surfaceBg : _neonPink,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(isFollowing ? 'Following' : 'Follow',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.more_horiz, color: Colors.white60),
                onPressed: () => _openPostOptions(post),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(post.text, style: const TextStyle(color: Colors.white, fontSize: 13.5, height: 1.4)),
          if (post.hashtags.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              children: post.hashtags
                  .map((tag) => Text(tag, style: const TextStyle(color: Color(0xFFFF6BA3), fontSize: 11, fontWeight: FontWeight.bold)))
                  .toList(),
            ),
          ],
          if (post.mediaType != 'none') ...[
            const SizedBox(height: 12),
            Container(
              height: post.mediaType == 'live_invite' ? 76 : 140,
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: post.mediaType == 'live_invite'
                      ? [const Color(0xFF280D4F), const Color(0xFF1A0936)]
                      : [const Color(0xFF4C1D73), const Color(0xFF9333EA), const Color(0xFFEC4899)],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Center(
                child: post.mediaType == 'live_invite'
                    ? Text(post.liveRoomLabel ?? 'LIVE ROOM • JOIN',
                        style: const TextStyle(color: _neonPink, fontWeight: FontWeight.w900, letterSpacing: 1.1))
                    : Icon(
                        post.mediaType == 'video' ? Icons.play_circle_filled : Icons.photo_library_rounded,
                        color: Colors.white70,
                        size: 42,
                      ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  setState(() {
                    post.isLiked = !post.isLiked;
                    post.likesCount += post.isLiked ? 1 : -1;
                  });
                },
                child: Row(
                  children: [
                    Icon(post.isLiked ? Icons.favorite : Icons.favorite_border,
                        color: post.isLiked ? _neonPink : Colors.white60, size: 18),
                    const SizedBox(width: 4),
                    Text('${post.likesCount}',
                        style: TextStyle(color: post.isLiked ? _neonPink : Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 18),
              GestureDetector(
                onTap: () => _openCommentsSheet(post),
                child: Row(
                  children: [
                    const Icon(Icons.chat_bubble_outline, color: Colors.white60, size: 17),
                    const SizedBox(width: 4),
                    Text('${post.comments.length} comments', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 18),
              GestureDetector(
                onTap: () {
                  setState(() => post.sharesCount += 1);
                  _showSnack('Shared ${post.creatorName}\'s post (${post.sharesCount})');
                },
                child: Row(
                  children: [
                    const Icon(Icons.north_east_rounded, color: Colors.white60, size: 17),
                    const SizedBox(width: 4),
                    Text('Share (${post.sharesCount})', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
