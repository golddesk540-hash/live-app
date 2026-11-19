import 'package:flutter/material.dart';
import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import 'square_state.dart';

/// Popo Live — Create Post Screen (Square Social Module)
class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final TextEditingController _textController = TextEditingController();
  String? _selectedImageUrl;
  bool _isPublishing = false;
  String? _validationError;

  // Curated demo fixture photo choices
  static const List<Map<String, String>> _fixturePresets = [
    {
      'label': 'Acoustic Stage',
      'url':
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    },
    {
      'label': 'Live Studio',
      'url':
          'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600',
    },
    {
      'label': 'Neon Lounge',
      'url':
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    },
  ];

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _onPublish() async {
    final text = _textController.text.trim();
    if (text.isEmpty && _selectedImageUrl == null) {
      setState(() {
        _validationError = 'Please write something or attach an image to post.';
      });
      return;
    }

    setState(() {
      _validationError = null;
      _isPublishing = true;
    });

    // Simulated quick local processing
    await Future.delayed(const Duration(milliseconds: 150));

    if (!mounted) return;

    SquareStateManager.instance.createPost(
      text: text,
      imageUrl: _selectedImageUrl,
    );

    Navigator.of(context).pop(true);
  }

  void _showImagePickerModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: PopoTheme.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
              const SizedBox(height: 16),
              const Text(
                'Select Media Attachment',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: _fixturePresets.map((preset) {
                  return InkWell(
                    key: Key('preset_image_${preset['label']}'),
                    onTap: () {
                      setState(() {
                        _selectedImageUrl = preset['url'];
                        _validationError = null;
                      });
                      Navigator.of(ctx).pop();
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Column(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            preset['url']!,
                            width: 95,
                            height: 95,
                            fit: BoxFit.cover,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          preset['label']!,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = DesignFixtures.currentUserProfile;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          key: const Key('create_post_cancel_button'),
          icon: const Icon(Icons.close_rounded, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Create Post',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: _isPublishing
                ? const Center(
                    child: SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: PopoTheme.primary,
                      ),
                    ),
                  )
                : ElevatedButton(
                    key: const Key('create_post_publish_button'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PopoTheme.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                    ),
                    onPressed: _onPublish,
                    child: const Text(
                      'Publish',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User header row
              Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white12,
                    backgroundImage: NetworkImage(currentUser.avatarUrl),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        currentUser.nickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: PopoTheme.surface,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: PopoTheme.borderSubtle,
                            width: 0.8,
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.public_rounded,
                              color: PopoTheme.textSecondary,
                              size: 11,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Public',
                              style: TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Validation error banner
              if (_validationError != null) ...[
                Container(
                  key: const Key('create_post_validation_error'),
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                    border:
                        Border.all(color: Colors.redAccent.withOpacity(0.5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Colors.redAccent,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _validationError!,
                          style: const TextStyle(
                            color: Colors.redAccent,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Post text input
              TextField(
                key: const Key('create_post_text_input'),
                controller: _textController,
                maxLines: 6,
                style: const TextStyle(color: Colors.white, fontSize: 15),
                decoration: const InputDecoration(
                  hintText: "What's happening in your live studio today? 🎶✨",
                  hintStyle: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 14,
                  ),
                  border: InputBorder.none,
                ),
                onChanged: (_) {
                  if (_validationError != null) {
                    setState(() => _validationError = null);
                  }
                },
              ),

              // Selected image preview with remove button
              if (_selectedImageUrl != null) ...[
                const SizedBox(height: 12),
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        _selectedImageUrl!,
                        key: const Key('create_post_image_preview'),
                        width: double.infinity,
                        height: 220,
                        fit: BoxFit.cover,
                      ),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: InkWell(
                        key: const Key('create_post_remove_image'),
                        onTap: () {
                          setState(() => _selectedImageUrl = null);
                        },
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: Colors.black87,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 20),

              // Attachment tool bar
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: PopoTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: PopoTheme.borderSubtle, width: 0.8),
                ),
                child: Row(
                  children: [
                    const Text(
                      'Add to your post',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      key: const Key('create_post_add_image_button'),
                      icon: const Icon(
                        Icons.photo_library_rounded,
                        color: Color(0xFF00E676),
                      ),
                      tooltip: 'Attach Image',
                      onPressed: _showImagePickerModal,
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.tag_rounded,
                        color: PopoTheme.cyan,
                      ),
                      tooltip: 'Add Hashtag',
                      onPressed: () {
                        _textController.text += ' #PopoLive';
                      },
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
}
