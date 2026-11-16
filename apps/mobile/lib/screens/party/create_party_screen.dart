import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../l10n/strings.dart';
import '../../models/party/party_models.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';

/// Screen for creating a new 9-seat Party Room
/// Integrates endpoint: POST /api/party/create
class CreatePartyScreen extends StatefulWidget {
  final List<PartyCategory> categories;
  final ValueChanged<PartyRoom>? onRoomCreated;

  const CreatePartyScreen({
    super.key,
    this.categories = const [],
    this.onRoomCreated,
  });

  @override
  State<CreatePartyScreen> createState() => _CreatePartyScreenState();
}

class _CreatePartyScreenState extends State<CreatePartyScreen> {
  final PartyApiService _apiService = PartyApiService();
  final TextEditingController _titleController = TextEditingController();

  List<PartyCategory> _categories = [];
  String _selectedCategoryId = 'chill_chat';
  String _selectedRoomType = 'public'; // 'public' or 'private'

  bool _isLoadingCategories = false;
  bool _isSubmitting = false;
  String? _titleError;

  @override
  void initState() {
    super.initState();
    _categories = List.from(widget.categories);
    if (_categories.isEmpty) {
      _fetchCategories();
    } else {
      _selectedCategoryId = _categories.first.id;
    }
    _titleController.addListener(_validateTitle);
  }

  @override
  void dispose() {
    _titleController.removeListener(_validateTitle);
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _fetchCategories() async {
    setState(() => _isLoadingCategories = true);
    try {
      final res = await _apiService.getCategories();
      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final rawCats = data['categories'] as List<dynamic>? ?? [];
        final parsed = rawCats
            .whereType<Map<String, dynamic>>()
            .map((c) => PartyCategory.fromJson(c))
            .toList();

        if (mounted) {
          setState(() {
            _categories = parsed;
            if (_categories.isNotEmpty) {
              _selectedCategoryId = _categories.first.id;
            }
            _isLoadingCategories = false;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingCategories = false);
    }
  }

  void _validateTitle() {
    final text = _titleController.text.trim();
    if (text.isEmpty) {
      setState(() => _titleError = null);
    } else if (text.length > 50) {
      setState(
        () => _titleError = 'Party title must not exceed 50 characters.',
      );
    } else {
      setState(() => _titleError = null);
    }
  }

  Future<void> _submitCreateRoom() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      setState(() => _titleError = 'Party title cannot be empty.');
      return;
    }
    if (title.length > 50) {
      setState(
        () => _titleError = 'Party title must not exceed 50 characters.',
      );
      return;
    }

    if (_isSubmitting) return;

    setState(() => _isSubmitting = true);

    try {
      final res = await _apiService.createPartyRoom(
        title: title,
        categoryId: _selectedCategoryId,
        roomType: _selectedRoomType,
      );

      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final partyData = data['party'] as Map<String, dynamic>? ?? data;
        final createdRoom = PartyRoom.fromJson(partyData);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Party room created successfully! 🎉'),
            backgroundColor: Color(0xFF00C853),
            duration: Duration(seconds: 2),
          ),
        );

        Navigator.pop(context);
        widget.onRoomCreated?.call(createdRoom);
      } else {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              res.errorMessage ?? 'Failed to create party room. Try again.',
            ),
            backgroundColor: PopoTheme.primary,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error creating party room: $e'),
          backgroundColor: PopoTheme.primary,
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
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: Colors.white,
            size: 20,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          Strings.get(context, 'create_party_title'),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
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
              // Header Banner
              _buildHeaderBanner(),
              const SizedBox(height: 24),

              // Room Title Field
              _buildTitleSection(),
              const SizedBox(height: 24),

              // Category Selection Section
              _buildCategorySection(),
              const SizedBox(height: 24),

              // Room Type Selection (Public vs Private)
              _buildRoomTypeSection(),
              const SizedBox(height: 36),

              // Submit Action Button
              _buildSubmitButton(),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: PopoTheme.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: PopoTheme.primary.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.weekend_rounded,
              color: PopoTheme.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Host a 9-Seat Party',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Seat 1 is reserved for you as host. 8 open seats for your guests & fans.',
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 12,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTitleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              Strings.get(context, 'party_title_label'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
            Text(
              '${_titleController.text.length} / 50',
              style: TextStyle(
                color: _titleController.text.length > 50
                    ? PopoTheme.primary
                    : PopoTheme.textSecondary,
                fontSize: 11,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _titleController,
          maxLength: 50,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            counterText: '',
            hintText: Strings.get(context, 'party_title_hint'),
            hintStyle: const TextStyle(
              color: PopoTheme.textSecondary,
              fontSize: 13,
            ),
            filled: true,
            fillColor: PopoTheme.surface,
            errorText: _titleError,
            errorStyle: const TextStyle(color: PopoTheme.primary, fontSize: 12),
            prefixIcon: const Icon(
              Icons.edit_note_rounded,
              color: PopoTheme.primary,
              size: 22,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: PopoTheme.borderSubtle),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: PopoTheme.borderSubtle),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(
                color: PopoTheme.primary,
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategorySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          Strings.get(context, 'select_category'),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 10),
        if (_isLoadingCategories)
          const Center(
            child: PopoLoadingIndicator(color: PopoTheme.primary, size: 24),
          )
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _categories.map((cat) {
              final isSelected = _selectedCategoryId == cat.id;
              return ChoiceChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(cat.icon ?? '✨', style: const TextStyle(fontSize: 13)),
                    const SizedBox(width: 6),
                    Text(cat.name),
                  ],
                ),
                selected: isSelected,
                selectedColor: PopoTheme.primary,
                backgroundColor: PopoTheme.surface,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : PopoTheme.textSecondary,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: isSelected
                        ? PopoTheme.primary
                        : PopoTheme.borderSubtle,
                  ),
                ),
                onSelected: (selected) {
                  if (selected) {
                    setState(() => _selectedCategoryId = cat.id);
                  }
                },
              );
            }).toList(),
          ),
      ],
    );
  }

  Widget _buildRoomTypeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Room Access & Privacy',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildRoomTypeOption(
                type: 'public',
                title: Strings.get(context, 'room_type_public'),
                description: 'Open to everyone in discovery feed',
                icon: Icons.public_rounded,
                accentColor: PopoTheme.cyan,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildRoomTypeOption(
                type: 'private',
                title: Strings.get(context, 'room_type_private'),
                description: 'Locked / Invitation only',
                icon: Icons.lock_rounded,
                accentColor: PopoTheme.gold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRoomTypeOption({
    required String type,
    required String title,
    required String description,
    required IconData icon,
    required Color accentColor,
  }) {
    final isSelected = _selectedRoomType == type;

    return GestureDetector(
      onTap: () => setState(() => _selectedRoomType = type),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? accentColor.withOpacity(0.12) : PopoTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? accentColor : PopoTheme.borderSubtle,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(
                  icon,
                  color: isSelected ? accentColor : PopoTheme.textSecondary,
                  size: 20,
                ),
                if (isSelected)
                  Icon(
                    Icons.check_circle_rounded,
                    color: accentColor,
                    size: 16,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                color: isSelected ? Colors.white : PopoTheme.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              description,
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        onPressed: _isSubmitting ? null : _submitCreateRoom,
        child: Ink(
          decoration: BoxDecoration(
            gradient: _isSubmitting ? null : PopoTheme.primaryGradient,
            color: _isSubmitting ? PopoTheme.surface : null,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            alignment: Alignment.center,
            child: _isSubmitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.celebration_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        Strings.get(context, 'create_party_room'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
