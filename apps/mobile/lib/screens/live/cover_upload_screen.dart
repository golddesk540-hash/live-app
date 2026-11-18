import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import 'pre_live_setup_screen.dart';

/// Screen 3/6: Cover Screen — Room Cover & Broadcast Meta Setup
/// Configures room cover photo, title, category, and host details
/// Implemented for Phase 3 (D2) Prompt 3 according to Popo Live Complete Product Design v1.1.
class CoverUploadScreen extends StatefulWidget {
  final String? currentCoverUrl;
  final String? initialTitle;
  final String? initialCategory;

  const CoverUploadScreen({
    super.key,
    this.currentCoverUrl,
    this.initialTitle,
    this.initialCategory,
  });

  @override
  State<CoverUploadScreen> createState() => _CoverUploadScreenState();
}

class _CoverUploadScreenState extends State<CoverUploadScreen> {
  late final TextEditingController _titleController;

  late String _selectedCoverUrl;
  late String _selectedCategory;
  String? _errorMessage;

  // Curated high-definition broadcast covers from original project fixtures
  static const List<Map<String, String>> _coverPresets = [
    {
      'id': 'cover_01',
      'label': 'Acoustic Night',
      'category': 'Singing',
      'url': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    },
    {
      'id': 'cover_02',
      'label': 'Glamour Live',
      'category': 'Live Chat',
      'url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    },
    {
      'id': 'cover_03',
      'label': 'Party & Chat',
      'category': 'Entertainment',
      'url': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
    },
    {
      'id': 'cover_04',
      'label': 'VIP Gala',
      'category': 'Music',
      'url': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600',
    },
  ];

  static const List<String> _categories = [
    'Singing',
    'Live Chat',
    'Entertainment',
    'Music',
    'Gaming',
  ];

  @override
  void initState() {
    super.initState();
    _selectedCoverUrl = widget.currentCoverUrl ??
        _coverPresets.first['url']!;
    _selectedCategory = widget.initialCategory ?? 'Singing';
    _titleController = TextEditingController(
      text: widget.initialTitle ?? 'Karachi Nights 🎶 Acoustic Live Session',
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  void _proceedToPreLive() {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() => _errorMessage = 'Please enter a broadcast room title.');
      return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PreLiveSetupScreen(
          coverUrl: _selectedCoverUrl,
          title: title,
          category: _selectedCategory,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = DesignFixtures.currentUserProfile;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          key: const Key('cover_back_button'),
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Room Cover & Title',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          // 1. Selected Cover Preview Card
          Container(
            height: 200,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: PopoTheme.primary.withOpacity(0.5),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.4),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    _selectedCoverUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: PopoTheme.surface,
                      child: const Center(
                        child: Icon(Icons.image, color: Colors.white30, size: 48),
                      ),
                    ),
                  ),

                  // Gradient overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.75),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),

                  // Host Info Overlay
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircleAvatar(
                            radius: 10,
                            backgroundImage: NetworkImage(user.avatarUrl),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            user.nickname,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(user.flagEmoji, style: const TextStyle(fontSize: 10)),
                        ],
                      ),
                    ),
                  ),

                  // Selected Category Badge
                  Positioned(
                    bottom: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _selectedCategory,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),

          // 2. Cover Selection Preset Thumbnails
          const Text(
            'Select Cover Preset',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 80,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _coverPresets.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, idx) {
                final preset = _coverPresets[idx];
                final isSelected = _selectedCoverUrl == preset['url'];

                return GestureDetector(
                  key: Key('cover_preset_${preset['id']}'),
                  onTap: () {
                    setState(() {
                      _selectedCoverUrl = preset['url']!;
                      _selectedCategory = preset['category']!;
                    });
                  },
                  child: Container(
                    width: 76,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected ? PopoTheme.primary : Colors.white12,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        preset['url']!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: Colors.white10),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 20),

          // 3. Room Title Input
          const Text(
            'Broadcast Title',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(
              color: PopoTheme.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: _errorMessage != null ? Colors.red : Colors.white12,
              ),
            ),
            child: TextField(
              key: const Key('room_title_input'),
              controller: _titleController,
              maxLength: 60,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: const InputDecoration(
                hintText: 'Enter attractive broadcast title...',
                hintStyle: TextStyle(color: Colors.white38, fontSize: 13),
                border: InputBorder.none,
                counterStyle: TextStyle(color: Colors.white38, fontSize: 10),
              ),
              onChanged: (_) {
                if (_errorMessage != null) {
                  setState(() => _errorMessage = null);
                }
              },
            ),
          ),
          if (_errorMessage != null) ...[
            const SizedBox(height: 6),
            Text(
              _errorMessage!,
              style: const TextStyle(color: Colors.red, fontSize: 11),
            ),
          ],
          const SizedBox(height: 18),

          // 4. Category Selector Chips
          const Text(
            'Select Category',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _categories.map((cat) {
              final isCatSelected = _selectedCategory == cat;
              return GestureDetector(
                key: Key('category_chip_$cat'),
                onTap: () => setState(() => _selectedCategory = cat),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: isCatSelected
                        ? PopoTheme.primary
                        : PopoTheme.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isCatSelected
                          ? PopoTheme.primary
                          : Colors.white10,
                    ),
                  ),
                  child: Text(
                    cat,
                    style: TextStyle(
                      color: isCatSelected ? Colors.white : Colors.white70,
                      fontSize: 12,
                      fontWeight: isCatSelected
                          ? FontWeight.bold
                          : FontWeight.w500,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 32),

          // 5. Continuation Button
          Container(
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              gradient: const LinearGradient(
                colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
              ),
              boxShadow: [
                BoxShadow(
                  color: PopoTheme.primary.withOpacity(0.4),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                key: const Key('cover_continue_button'),
                borderRadius: BorderRadius.circular(25),
                onTap: _proceedToPreLive,
                child: const Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Continue to Pre-Live Review',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
