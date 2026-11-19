import 'package:flutter/material.dart';

import '../../design/design_fixtures.dart';
import '../../theme/theme.dart';
import 'party_room_screen.dart';

/// Screen for creating a local 9-seat Party Lounge session
/// Implements Popo Live Phase 4 (D3) Prompt 1
class CreatePartyScreen extends StatefulWidget {
  final ValueChanged<FixturePartyRoom>? onRoomCreated;

  const CreatePartyScreen({
    super.key,
    this.onRoomCreated,
  });

  @override
  State<CreatePartyScreen> createState() => _CreatePartyScreenState();
}

class _CreatePartyScreenState extends State<CreatePartyScreen> {
  final TextEditingController _titleController = TextEditingController();

  static const List<Map<String, String>> _categories = [
    {'name': 'Chill & Chat', 'emoji': '☕'},
    {'name': 'Music & Singing', 'emoji': '🎸'},
    {'name': 'Gaming Squad', 'emoji': '🎮'},
    {'name': 'Poetry Circle', 'emoji': '📖'},
    {'name': 'Talent Showcase', 'emoji': '🎤'},
  ];

  String _selectedCategory = 'Chill & Chat';
  String _selectedPrivacy = 'Public';
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _titleController.text = 'Late Night Tea & Chai Lounge ☕';
    _titleController.addListener(_clearError);
  }

  @override
  void dispose() {
    _titleController.removeListener(_clearError);
    _titleController.dispose();
    super.dispose();
  }

  void _clearError() {
    if (_errorMessage != null) {
      setState(() => _errorMessage = null);
    }
  }

  void _handleCreateRoom() {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() {
        _errorMessage = 'Party title cannot be empty.';
      });
      return;
    }
    if (title.length > 50) {
      setState(() {
        _errorMessage = 'Party title must not exceed 50 characters.';
      });
      return;
    }

    final currentUser = DesignFixtures.currentUserProfile;
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final roomNumber = '77${(timestamp % 9000) + 1000}';

    // Exactly 9 seats: Seat 1 is occupied by the host (current user), seats 2..9 are vacant
    final seats = <FixturePartySeat>[
      FixturePartySeat(
        index: 1,
        userId: currentUser.userId,
        nickname: currentUser.nickname,
        avatarUrl: currentUser.avatarUrl,
        isHost: true,
        isMuted: false,
        isSpeaking: false,
        giftPoints: 0,
        isOccupied: true,
        isLocked: false,
        canJoin: false,
        joinRequestStatus: 'accepted',
      ),
      for (int i = 2; i <= 9; i++) FixturePartySeat.empty(i),
    ];

    final createdRoom = FixturePartyRoom(
      id: 'party_local_$timestamp',
      roomNumber: roomNumber,
      title: title,
      hostNickname: currentUser.nickname,
      hostAvatar: currentUser.avatarUrl,
      hostUserId: currentUser.userId,
      coverUrl:
          'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500',
      category: _selectedCategory,
      country: 'Pakistan',
      countryCode: 'PK',
      flagEmoji: '🇵🇰',
      viewerCount: 1,
      maxSeats: 9,
      occupiedSeatCount: 1,
      joinStatus: 'open',
      seats: seats,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Party lounge created successfully! 🎙️'),
        backgroundColor: Color(0xFF00C853),
        duration: Duration(seconds: 2),
      ),
    );

    if (widget.onRoomCreated != null) {
      Navigator.of(context).pop();
      widget.onRoomCreated!(createdRoom);
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => PartyRoomScreen(room: createdRoom),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          key: const Key('create_party_back_button'),
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Create 9-Seat Party Lounge',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Lounge Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF3B1E4A), Color(0xFF1E1E2E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFFF9800).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF9800), Color(0xFFFF5722)],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFFF9800).withOpacity(0.4),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.celebration_rounded,
                        color: Colors.white,
                        size: 26,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Host Your 9-Seat Audio Lounge',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Broadcast voice, take callers on 8 guest microphones, and share audio gifts.',
                            style: TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Title Input
              const Text(
                'Party Lounge Title',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                key: const Key('create_party_title_input'),
                controller: _titleController,
                maxLength: 50,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Enter a catchy title for your party...',
                  hintStyle: const TextStyle(color: Colors.white38),
                  filled: true,
                  fillColor: PopoTheme.surface,
                  errorText: _errorMessage,
                  errorStyle: const TextStyle(color: PopoTheme.primary),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: PopoTheme.borderSubtle),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide:
                        const BorderSide(color: Color(0xFFFF9800), width: 1.5),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: PopoTheme.borderSubtle),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Category Selector
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
                  final isSelected = _selectedCategory == cat['name'];
                  return ChoiceChip(
                    key: Key(
                        'create_party_category_${cat['name']!.replaceAll(' ', '_')}'),
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(cat['emoji']!,
                            style: const TextStyle(fontSize: 13)),
                        const SizedBox(width: 6),
                        Text(cat['name']!),
                      ],
                    ),
                    selected: isSelected,
                    selectedColor: const Color(0xFFFF9800),
                    backgroundColor: PopoTheme.surface,
                    labelStyle: TextStyle(
                      color:
                          isSelected ? Colors.white : PopoTheme.textSecondary,
                      fontSize: 12,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected
                            ? Colors.transparent
                            : PopoTheme.borderSubtle,
                      ),
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedCategory = cat['name']!);
                      }
                    },
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),

              // Seat Architecture Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: PopoTheme.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: PopoTheme.borderSubtle, width: 1),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: PopoTheme.cyan.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.airline_seat_recline_normal_rounded,
                        color: PopoTheme.cyan,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Standard 9-Seat Audio Lounge',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Seat 1: Host • Seats 2–9: Open Guest Caller Slots',
                            style: TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: PopoTheme.cyan.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        '9 SEATS',
                        style: TextStyle(
                          color: PopoTheme.cyan,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Privacy Setting
              const Text(
                'Lounge Visibility',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedPrivacy = 'Public'),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _selectedPrivacy == 'Public'
                              ? PopoTheme.primary.withOpacity(0.15)
                              : PopoTheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _selectedPrivacy == 'Public'
                                ? PopoTheme.primary
                                : PopoTheme.borderSubtle,
                            width: 1.2,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.public_rounded,
                              size: 16,
                              color: _selectedPrivacy == 'Public'
                                  ? PopoTheme.primary
                                  : PopoTheme.textSecondary,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Public Party',
                              style: TextStyle(
                                color: _selectedPrivacy == 'Public'
                                    ? Colors.white
                                    : PopoTheme.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedPrivacy = 'Private'),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _selectedPrivacy == 'Private'
                              ? PopoTheme.primary.withOpacity(0.15)
                              : PopoTheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _selectedPrivacy == 'Private'
                                ? PopoTheme.primary
                                : PopoTheme.borderSubtle,
                            width: 1.2,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.lock_rounded,
                              size: 16,
                              color: _selectedPrivacy == 'Private'
                                  ? PopoTheme.primary
                                  : PopoTheme.textSecondary,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Private Party',
                              style: TextStyle(
                                color: _selectedPrivacy == 'Private'
                                    ? Colors.white
                                    : PopoTheme.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 36),

              // Confirm Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF9800), Color(0xFFFF5722)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF9800).withOpacity(0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    key: const Key('confirm_create_party_button'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    onPressed: _handleCreateRoom,
                    child: const Text(
                      'START PARTY LOUNGE',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
