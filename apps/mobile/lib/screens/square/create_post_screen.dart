import 'package:flutter/material.dart';

/// Popo Live — Phase 8.4: Create Tools Frontend (Text, Photo, Video Posts)
/// Frontend-only local state implementation aligned with 08_04_create_tools.png.
class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  static const _bgDeep = Color(0xFF0C041C);
  static const _cardBg = Color(0xFF180A33);
  static const _surfaceBg = Color(0xFF211042);
  static const _neonPink = Color(0xFFFF1A6C);
  static const _gold = Color(0xFFFBBF24);
  static const int _maxChars = 500;

  final _captionController = TextEditingController();
  final _videoTitleController = TextEditingController();

  String _postType = 'text'; // text | photo | video
  String _audience = 'Public'; // Public | Following | Private
  bool _isPreview = false;
  bool _isPublished = false;
  bool _showEmojiStrip = false;
  String? _validationError;

  final List<String> _selectedPhotos = [];
  String? _selectedVideoName;
  String? _selectedVideoDuration;

  static const _emojis = ['✨', '🔥', '💜', '🎤', '👑', '🎉', '🎵', '👏'];
  static const _samplePhotos = [
    'acoustic_stage_night.jpg',
    'neon_rooftop_lounge.jpg',
    'studio_jam_session.jpg',
  ];

  @override
  void dispose() {
    _captionController.dispose();
    _videoTitleController.dispose();
    super.dispose();
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

  bool _validate() {
    final text = _captionController.text.trim();
    if (_captionController.text.length > _maxChars) {
      setState(() => _validationError = 'Caption exceeds $_maxChars characters.');
      return false;
    }
    if (_postType == 'text' && text.isEmpty) {
      setState(() => _validationError = 'Please enter what you would like to share.');
      return false;
    }
    if (_postType == 'photo' && _selectedPhotos.isEmpty) {
      setState(() => _validationError = 'Please select at least 1 photo before previewing or publishing.');
      return false;
    }
    if (_postType == 'video' && _selectedVideoName == null) {
      setState(() => _validationError = 'Please select a video clip before continuing.');
      return false;
    }
    setState(() => _validationError = null);
    return true;
  }

  void _clearAll() {
    setState(() {
      _captionController.clear();
      _videoTitleController.clear();
      _selectedPhotos.clear();
      _selectedVideoName = null;
      _selectedVideoDuration = null;
      _audience = 'Public';
      _validationError = null;
      _isPreview = false;
      _isPublished = false;
    });
    _showSnack('Composer cleared');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgDeep,
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
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
          if (!_isPublished)
            TextButton(
              onPressed: () {
                if (!_validate()) return;
                setState(() => _isPreview = !_isPreview);
              },
              child: Text(
                _isPreview ? 'Edit' : 'Preview',
                style: const TextStyle(color: _neonPink, fontWeight: FontWeight.bold),
              ),
            ),
          if (!_isPublished)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _neonPink, shape: const StadiumBorder()),
                onPressed: () {
                  if (!_validate()) return;
                  setState(() {
                    _isPublished = true;
                    _isPreview = false;
                  });
                  _showSnack('Published demo post locally to Square');
                },
                child: const Text('Publish', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ),
        ],
      ),
      body: _isPublished
          ? _buildPublishedView()
          : _isPreview
              ? _buildPreviewView()
              : _buildEditorView(),
    );
  }

  Widget _buildPublishedView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.greenAccent.withOpacity(0.4)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: Colors.greenAccent, size: 52),
              const SizedBox(height: 12),
              const Text('Post Ready in Square (Local Demo)',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              Text('Audience: $_audience • Type: ${_postType.toUpperCase()}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 18),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _neonPink, shape: const StadiumBorder()),
                onPressed: _clearAll,
                child: const Text('Create Another Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreviewView() {
    final text = _captionController.text.trim().isEmpty
        ? 'Shared an update on Popo Live Square ✨'
        : _captionController.text.trim();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Post Preview', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text('Audience: $_audience', style: const TextStyle(color: Colors.white60, fontSize: 12)),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: _neonPink.withOpacity(0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  CircleAvatar(radius: 18, backgroundColor: _neonPink, child: Text('A', style: TextStyle(color: Colors.white))),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text('Ayesha Khan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  Icon(Icons.verified, color: _gold, size: 16),
                ],
              ),
              const SizedBox(height: 12),
              Text(text, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4)),
              if (_postType == 'photo' && _selectedPhotos.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _selectedPhotos
                      .map(
                        (p) => Chip(
                          backgroundColor: _surfaceBg,
                          label: Text(p, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                        ),
                      )
                      .toList(),
                ),
              ],
              if (_postType == 'video' && _selectedVideoName != null) ...[
                const SizedBox(height: 12),
                Container(
                  height: 120,
                  decoration: BoxDecoration(
                    color: _surfaceBg,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text('Video Preview: $_selectedVideoName (${_selectedVideoDuration ?? "00:24"})',
                        style: const TextStyle(color: _neonPink, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _isPreview = false),
                child: const Text('Edit Post', style: TextStyle(color: Colors.white)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _neonPink),
                onPressed: () => setState(() {
                  _isPublished = true;
                  _isPreview = false;
                }),
                child: const Text('Publish Locally', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildEditorView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Create Post', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
        const SizedBox(height: 2),
        const Text('Share something with the community', style: TextStyle(color: Colors.white60, fontSize: 13)),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
          ),
          child: Row(
            children: [
              const CircleAvatar(radius: 22, backgroundColor: _neonPink, child: Text('A', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('Ayesha Khan', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    SizedBox(height: 2),
                    Text('What would you like to share?', style: TextStyle(color: Colors.white60, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Choose a creation', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        _buildCreationOption('text', 'Text post', 'Share an update', Icons.edit_outlined),
        _buildCreationOption('photo', 'Photo post', 'Add photos to your post', Icons.photo_library_outlined),
        _buildCreationOption('video', 'Video post', 'Share a short video', Icons.play_arrow_rounded),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Post Content', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  Text('${_captionController.text.length} / $_maxChars',
                      style: TextStyle(
                        color: _captionController.text.length > _maxChars ? Colors.redAccent : Colors.white54,
                        fontSize: 11,
                      )),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _captionController,
                maxLines: 4,
                onChanged: (_) => setState(() => _validationError = null),
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'What would you like to share?',
                  hintStyle: const TextStyle(color: Colors.white38),
                  filled: true,
                  fillColor: _bgDeep,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  TextButton.icon(
                    onPressed: () => setState(() => _showEmojiStrip = !_showEmojiStrip),
                    icon: const Icon(Icons.sentiment_satisfied_alt, color: _gold, size: 18),
                    label: const Text('Emoji', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ),
                  const Spacer(),
                  if (_captionController.text.isNotEmpty)
                    TextButton(
                      onPressed: () => setState(() => _captionController.clear()),
                      child: const Text('Clear text', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                    ),
                ],
              ),
              if (_showEmojiStrip)
                Wrap(
                  spacing: 6,
                  children: _emojis
                      .map(
                        (e) => GestureDetector(
                          onTap: () => setState(() => _captionController.text += e),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(color: _surfaceBg, borderRadius: BorderRadius.circular(10)),
                            child: Text(e, style: const TextStyle(fontSize: 18)),
                          ),
                        ),
                      )
                      .toList(),
                ),
            ],
          ),
        ),
        if (_postType == 'photo') ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: _cardBg, borderRadius: BorderRadius.circular(20)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Selected Photos', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(backgroundColor: _neonPink, shape: const StadiumBorder()),
                      onPressed: () {
                        if (_selectedPhotos.length < _samplePhotos.length) {
                          setState(() => _selectedPhotos.add(_samplePhotos[_selectedPhotos.length]));
                        }
                      },
                      icon: const Icon(Icons.add_photo_alternate_outlined, size: 16, color: Colors.white),
                      label: const Text('Add Photos', style: TextStyle(color: Colors.white, fontSize: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (_selectedPhotos.isEmpty)
                  const Text('Tap Add Photos to attach demo gallery snapshots.',
                      style: TextStyle(color: Colors.white54, fontSize: 12))
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _selectedPhotos.asMap().entries.map((entry) {
                      return Chip(
                        backgroundColor: _surfaceBg,
                        deleteIconColor: _neonPink,
                        onDeleted: () => setState(() => _selectedPhotos.removeAt(entry.key)),
                        label: Text(entry.value, style: const TextStyle(color: Colors.white, fontSize: 11)),
                      );
                    }).toList(),
                  ),
              ],
            ),
          ),
        ],
        if (_postType == 'video') ...[
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: _cardBg, borderRadius: BorderRadius.circular(20)),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    _selectedVideoName ?? 'No video selected yet',
                    style: TextStyle(color: _selectedVideoName == null ? Colors.white54 : Colors.white, fontSize: 12),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: _neonPink, shape: const StadiumBorder()),
                  onPressed: () {
                    setState(() {
                      if (_selectedVideoName == null) {
                        _selectedVideoName = 'evening_lounge_clip.mp4';
                        _selectedVideoDuration = '00:24';
                      } else {
                        _selectedVideoName = null;
                        _selectedVideoDuration = null;
                      }
                    });
                  },
                  child: Text(_selectedVideoName == null ? 'Select Video' : 'Remove',
                      style: const TextStyle(color: Colors.white, fontSize: 12)),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: _cardBg, borderRadius: BorderRadius.circular(20)),
          child: Row(
            children: ['Public', 'Following', 'Private'].map((aud) {
              final active = _audience == aud;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _audience = aud),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    padding: const EdgeInsets.symmetric(vertical: 9),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: active ? _neonPink : _surfaceBg,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(aud,
                        style: TextStyle(
                          color: active ? Colors.white : Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        )),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        if (_validationError != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.18),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.redAccent),
            ),
            child: Text(_validationError!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
          ),
        ],
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _clearAll,
                child: const Text('Clear', style: TextStyle(color: Colors.white70)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: _neonPink),
                onPressed: () {
                  if (!_validate()) return;
                  setState(() => _isPreview = true);
                },
                child: const Text('Preview Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCreationOption(String id, String title, String subtitle, IconData icon) {
    final active = _postType == id;
    return GestureDetector(
      onTap: () => setState(() {
        _postType = id;
        _validationError = null;
      }),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: _cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? _neonPink : Colors.purpleAccent.withOpacity(0.18), width: active ? 1.5 : 1),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: active ? _neonPink : const Color(0xFF29134E),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: active ? Colors.white : _neonPink, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(color: Colors.white60, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
