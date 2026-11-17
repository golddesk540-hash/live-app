import 'package:flutter/material.dart';
import '../../services/square/square_service.dart';
import 'square_posts_screen.dart';

/// Popo Live — Module 8.10 Square Discovery (Flutter parity view)
/// Mirrors Square Discovery featured posts, popular hashtags, search, and creator suggestions.
class SquareDiscoveryScreen extends StatefulWidget {
  const SquareDiscoveryScreen({super.key});

  @override
  State<SquareDiscoveryScreen> createState() => _SquareDiscoveryScreenState();
}

class _SquareDiscoveryScreenState extends State<SquareDiscoveryScreen> {
  String _searchQuery = '';
  int _selectedTab = 0; // 0: For You, 1: Popular, 2: Following
  bool _isLoading = false;
  String? _errorMessage;
  List<SquarePostModel> _posts = [];

  @override
  void initState() {
    super.initState();
    _loadDiscoveryPosts();
  }

  Future<void> _loadDiscoveryPosts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final tabKey = _selectedTab == 1
          ? 'popular'
          : (_selectedTab == 2 ? 'following' : 'for_you');

      final posts = await SquareService.instance.fetchSquareFeed(
        tab: tabKey,
        search: _searchQuery,
      );

      if (mounted) {
        setState(() {
          _posts = posts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _onTabChanged(int index) {
    if (_selectedTab != index) {
      setState(() => _selectedTab = index);
      _loadDiscoveryPosts();
    }
  }

  void _onSearchChanged(String val) {
    _searchQuery = val;
    _loadDiscoveryPosts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text(
          'Square Discovery',
          style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFFFF1768)),
            onPressed: _loadDiscoveryPosts,
          ),
        ],
      ),
      body: RefreshIndicator(
        color: const Color(0xFFFF1768),
        backgroundColor: const Color(0xFF170931),
        onRefresh: _loadDiscoveryPosts,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search posts, creators, or #hashtags...',
                hintStyle: const TextStyle(color: Color(0xFFD8B4FE)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFFFF4D8D)),
                filled: true,
                fillColor: const Color(0xFF170931),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: BorderSide.none,
                ),
              ),
              onChanged: _onSearchChanged,
            ),
            const SizedBox(height: 16),
            SegmentedButton<int>(
              style: SegmentedButton.styleFrom(
                backgroundColor: const Color(0xFF170931),
                selectedBackgroundColor: const Color(0xFFFF1768),
                selectedForegroundColor: Colors.white,
                foregroundColor: const Color(0xFFD8B4FE),
              ),
              segments: const [
                ButtonSegment(value: 0, label: Text('For You')),
                ButtonSegment(value: 1, label: Text('Popular')),
                ButtonSegment(value: 2, label: Text('Following')),
              ],
              selected: {_selectedTab},
              onSelectionChanged: (v) => _onTabChanged(v.first),
            ),
            const SizedBox(height: 16),
            if (_searchQuery.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  'Filtering discovery for "$_searchQuery"',
                  style: const TextStyle(color: Color(0xFFFF4D8D), fontSize: 12),
                ),
              ),
            const Text(
              'Featured & Popular Posts',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(color: Color(0xFFFF1768)),
                ),
              )
            else if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF170931),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.5)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 36),
                    const SizedBox(height: 8),
                    Text(_errorMessage!, style: const TextStyle(color: Colors.white70)),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _loadDiscoveryPosts,
                      child: const Text('Try Again', style: TextStyle(color: Color(0xFFFF1768))),
                    ),
                  ],
                ),
              )
            else if (_posts.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF170931),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.feed_outlined, color: Color(0xFFD8B4FE), size: 40),
                    SizedBox(height: 12),
                    Text(
                      'No community posts found',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Be the first to share an update on Popo Live Square!',
                      style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
                    ),
                  ],
                ),
              )
            else
              ..._posts.map((post) => _buildPostCard(post)),
          ],
        ),
      ),
    );
  }

  Widget _buildPostCard(SquarePostModel post) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF170931),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: post.ringColor,
                child: CircleAvatar(
                  radius: 16,
                  backgroundColor: const Color(0xFF211042),
                  child: Text(
                    post.creatorName.isNotEmpty ? post.creatorName[0].toUpperCase() : 'P',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            post.creatorName,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (post.isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.verified, color: Color(0xFF00E5FF), size: 14),
                        ],
                        if (post.isVip) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.star, color: Color(0xFFFFB800), size: 14),
                        ],
                      ],
                    ),
                    Text(
                      '${post.creatorHandle} · ${post.publishedAgo}',
                      style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 11),
                    ),
                  ],
                ),
              ),
              if (post.hashtags.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF28124D),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    post.hashtags.first,
                    style: const TextStyle(color: Color(0xFFFF4D8D), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            post.text,
            style: const TextStyle(color: Color(0xFFE2E8F0), fontSize: 13, height: 1.4),
          ),
          if (post.mediaType != 'none') ...[
            const SizedBox(height: 10),
            Container(
              height: 140,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFF211042),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.purpleAccent.withOpacity(0.15)),
              ),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      post.mediaType == 'video' ? Icons.play_circle_fill : Icons.image,
                      color: const Color(0xFFFF1768),
                      size: 28,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      post.mediaType == 'video' ? 'Attached Video Clip' : 'Attached Photo',
                      style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                post.isLiked ? Icons.favorite : Icons.favorite_border,
                color: post.isLiked ? const Color(0xFFFF1768) : const Color(0xFFD8B4FE),
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                '${post.likesCount}',
                style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.chat_bubble_outline, color: Color(0xFFD8B4FE), size: 16),
              const SizedBox(width: 4),
              Text(
                '${post.comments.length}',
                style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
              ),
              const Spacer(),
              Text(
                post.visibility,
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
