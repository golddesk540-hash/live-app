import 'package:flutter/material.dart';
import '../../auth/auth_state.dart';
import '../../l10n/strings.dart';
import '../../models/live/live_models.dart';
import '../../models/pk/pk_models.dart';
import '../../services/pk/pk_session_manager.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/widgets.dart';

/// PK Battle Setup Screen
/// Implements Section 4 of Phase 3 Prompt 01/08
/// Integrates actual Next.js backend endpoints:
/// - GET  /api/pk/hosts?search=&excludeHostId=
/// - GET  /api/pk/battle-types
/// - POST /api/pk/invitation/send
/// - GET  /api/pk/invitation/status
/// - POST /api/pk/invitation/cancel
class PkSetupScreen extends StatefulWidget {
  final LiveBroadcasterSession session;
  final Function(PkBattle battle)? onBattleConfirmed;

  const PkSetupScreen({
    Key? key,
    required this.session,
    this.onBattleConfirmed,
  }) : super(key: key);

  factory PkSetupScreen.fromSetupResult({
    Key? key,
    required PreLiveSetupResult setupResult,
    Function(PkBattle battle)? onBattleConfirmed,
  }) {
    return PkSetupScreen(
      key: key,
      session: LiveBroadcasterSession(
        hostId: setupResult.hostId.isNotEmpty
            ? setupResult.hostId
            : setupResult.hostPoppoId,
        roomNumber: setupResult.roomNumber,
        hostNickname: setupResult.hostNickname,
        hostAvatar: setupResult.coverUrl ?? '',
        category: setupResult.category,
      ),
      onBattleConfirmed: onBattleConfirmed,
    );
  }

  @override
  State<PkSetupScreen> createState() => _PkSetupScreenState();
}

class _PkSetupScreenState extends State<PkSetupScreen> {
  final TextEditingController _searchController = TextEditingController();
  final PkSessionManager _manager = PkSessionManager.instance;
  String? _invitingHostId;

  @override
  void initState() {
    super.initState();
    _manager.setHostContext(
      hostId: widget.session.hostId,
      roomNumber: widget.session.roomNumber,
    );
    _manager.loadEligibleHosts();

    // Listen to session manager state changes
    _manager.addListener(_handleStateChange);
  }

  void _handleStateChange() {
    if (!mounted) return;

    if (_manager.state == PkState.accepted && _manager.currentBattle != null) {
      // PK Battle accepted!
      if (widget.onBattleConfirmed != null) {
        widget.onBattleConfirmed!(_manager.currentBattle!);
      }
      Navigator.of(context).pop(_manager.currentBattle);
    }
  }

  @override
  void dispose() {
    _manager.removeListener(_handleStateChange);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    _manager.loadEligibleHosts(search: query);
  }

  Future<void> _handleInvite(PkHost targetHost) async {
    setState(() => _invitingHostId = targetHost.id);

    final success = await _manager.sendInvitation(targetHost);
    if (!mounted) return;

    setState(() => _invitingHostId = null);

    if (!success && _manager.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_manager.errorMessage!),
          backgroundColor: PopoTheme.danger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _handleCancelInvitation() async {
    await _manager.cancelOutgoingInvitation();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('PK Battle invitation cancelled.'),
        backgroundColor: PopoTheme.surface,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthState.instance.currentUser;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          '1v1 PK Battle Setup',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: PopoTheme.primary),
            onPressed: () => _manager.loadEligibleHosts(search: _searchController.text),
            tooltip: 'Refresh Hosts',
          ),
        ],
      ),
      body: AnimatedBuilder(
        animation: _manager,
        builder: (context, _) {
          return Column(
            children: [
              // 1. Current Host Status Banner
              _buildCurrentHostCard(user),

              // 2. Strict 1v1 Battle Mode Selector (4-Host remains completely disabled)
              _buildBattleTypeSelector(),

              // 3. Opponent Search Input
              _buildSearchField(),

              // 4. Main Body: Opponents List or Active Outgoing Invitation
              Expanded(
                child: _manager.state == PkState.invitationSent
                    ? _buildOutgoingInvitationView()
                    : _buildOpponentsList(),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Current Host Info Overview Card
  Widget _buildCurrentHostCard(dynamic user) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: PopoTheme.borderSubtle, width: 1),
      ),
      child: Row(
        children: [
          // Host Avatar
          CircleAvatar(
            radius: 22,
            backgroundColor: PopoTheme.primary,
            backgroundImage: widget.session.hostAvatar.isNotEmpty
                ? NetworkImage(widget.session.hostAvatar)
                : null,
            child: widget.session.hostAvatar.isEmpty
                ? Text(
                    widget.session.hostNickname.isNotEmpty
                        ? widget.session.hostNickname[0].toUpperCase()
                        : 'H',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),

          // Host Name & Wealth Level
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        widget.session.hostNickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: PopoTheme.gold,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'Lv.5',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  'Room #${widget.session.roomNumber} • ${widget.session.category}',
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),

          // Active Live Indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: PopoTheme.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: PopoTheme.primary, width: 1),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.sensors_rounded, color: PopoTheme.primary, size: 13),
                SizedBox(width: 4),
                Text(
                  'LIVE',
                  style: TextStyle(
                    color: PopoTheme.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Strict 1v1 Mode Display (Section 3 Requirement)
  Widget _buildBattleTypeSelector() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            PopoTheme.primary.withOpacity(0.15),
            PopoTheme.surface,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: PopoTheme.primary.withOpacity(0.4), width: 1.2),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: PopoTheme.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.flash_on_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      '1 vs 1 PK Battle',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(width: 6),
                    Text(
                      '• Active Mode',
                      style: TextStyle(
                        color: PopoTheme.cyan,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 2),
                Text(
                  'Two hosts compete side-by-side. Support wins the match!',
                  style: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: PopoTheme.primary,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              '1v1',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Opponent Search Field
  Widget _buildSearchField() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: TextField(
        controller: _searchController,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        onChanged: _onSearch,
        decoration: InputDecoration(
          hintText: 'Search eligible live hosts by name or ID...',
          hintStyle: const TextStyle(color: PopoTheme.textSecondary, fontSize: 13),
          prefixIcon: const Icon(Icons.search_rounded, color: PopoTheme.textSecondary, size: 20),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, color: PopoTheme.textSecondary, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _onSearch('');
                  },
                )
              : null,
          filled: true,
          fillColor: PopoTheme.surface,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
            borderSide: const BorderSide(color: PopoTheme.primary, width: 1.2),
          ),
        ),
      ),
    );
  }

  /// Opponents List View
  Widget _buildOpponentsList() {
    if (_manager.isLoadingHosts) {
      return const Center(
        child: PopoLoadingIndicator(
          message: 'Discovering eligible live hosts...',
        ),
      );
    }

    if (_manager.errorMessage != null && _manager.eligibleHosts.isEmpty) {
      return Center(
        child: PopoErrorState(
          message: _manager.errorMessage!,
          onRetry: () => _manager.loadEligibleHosts(search: _searchController.text),
        ),
      );
    }

    if (_manager.eligibleHosts.isEmpty) {
      return Center(
        child: PopoEmptyState(
          title: 'No Live Opponents Found',
          message: _searchController.text.isNotEmpty
              ? 'No live hosts match "${_searchController.text}".'
              : 'There are currently no other eligible live hosts available for PK.',
          icon: Icons.person_search_rounded,
        ),
      );
    }

    return RefreshIndicator(
      color: PopoTheme.primary,
      backgroundColor: PopoTheme.surface,
      onRefresh: () => _manager.loadEligibleHosts(search: _searchController.text),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _manager.eligibleHosts.length,
        itemBuilder: (context, index) {
          final host = _manager.eligibleHosts[index];
          return _buildOpponentCard(host);
        },
      ),
    );
  }

  /// Individual Opponent Host Card
  Widget _buildOpponentCard(PkHost host) {
    final isInvitingThis = _invitingHostId == host.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: host.isEligibleForPk
              ? PopoTheme.borderSubtle
              : Colors.white.withOpacity(0.04),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // Opponent Avatar & Flag Emoji
          Stack(
            clipBehavior: Clip.none,
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: PopoTheme.surfaceLight,
                backgroundImage: host.avatarUrl.isNotEmpty
                    ? NetworkImage(host.avatarUrl)
                    : null,
                child: host.avatarUrl.isEmpty
                    ? Text(
                        host.nickname.isNotEmpty ? host.nickname[0].toUpperCase() : 'O',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
              Positioned(
                right: -2,
                bottom: -2,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: PopoTheme.surface,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    host.flagEmoji,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 12),

          // Nickname & Live Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        host.nickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.people_alt_rounded, color: PopoTheme.gold, size: 10),
                          const SizedBox(width: 3),
                          Text(
                            host.formattedViewers,
                            style: const TextStyle(
                              color: PopoTheme.gold,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      'Room #${host.roomNumber}',
                      style: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: host.isEligibleForPk ? PopoTheme.success : PopoTheme.textSecondary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      host.inPkBattle
                          ? 'In Battle'
                          : host.isEligibleForPk
                              ? 'Eligible'
                              : 'Invites Off',
                      style: TextStyle(
                        color: host.inPkBattle
                            ? PopoTheme.danger
                            : host.isEligibleForPk
                                ? PopoTheme.success
                                : PopoTheme.textSecondary,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Action Button: Invite or Unavailable
          if (host.isEligibleForPk)
            SizedBox(
              height: 36,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: PopoTheme.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                ),
                onPressed: isInvitingThis ? null : () => _handleInvite(host),
                child: isInvitingThis
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.flash_on_rounded, color: Colors.white, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Invite',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                host.inPkBattle ? 'In Battle' : 'Busy',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Active Outgoing Invitation View (Waiting for Host B)
  Widget _buildOutgoingInvitationView() {
    final invite = _manager.outgoingInvitation;
    if (invite == null) return const SizedBox.shrink();

    final secondsRemaining = _manager.secondsRemaining;

    return Center(
      child: Container(
        margin: const EdgeInsets.all(24),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: PopoTheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: PopoTheme.primary.withOpacity(0.5), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: PopoTheme.primary.withOpacity(0.2),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Target Opponent Avatar
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 90,
                  height: 90,
                  child: CircularProgressIndicator(
                    value: secondsRemaining / 30.0,
                    strokeWidth: 3,
                    color: PopoTheme.primary,
                    backgroundColor: Colors.white.withOpacity(0.1),
                  ),
                ),
                CircleAvatar(
                  radius: 36,
                  backgroundColor: PopoTheme.surfaceLight,
                  backgroundImage: invite.receiverAvatar.isNotEmpty
                      ? NetworkImage(invite.receiverAvatar)
                      : null,
                  child: invite.receiverAvatar.isEmpty
                      ? Text(
                          invite.receiverNickname.isNotEmpty
                              ? invite.receiverNickname[0].toUpperCase()
                              : 'O',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Invitation Status
            Text(
              'Invited ${invite.receiverNickname}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Room #${invite.receiverRoomNumber}',
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 14),

            // Pulsing countdown text
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: secondsRemaining <= 10 ? PopoTheme.danger : PopoTheme.gold,
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.hourglass_top_rounded,
                    color: secondsRemaining <= 10 ? PopoTheme.danger : PopoTheme.gold,
                    size: 15,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Waiting for response (${secondsRemaining}s)...',
                    style: TextStyle(
                      color: secondsRemaining <= 10 ? PopoTheme.danger : PopoTheme.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Cancel Button
            SizedBox(
              width: double.infinity,
              height: 46,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: PopoTheme.borderSubtle, width: 1.2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  backgroundColor: Colors.black.withOpacity(0.3),
                ),
                onPressed: _handleCancelInvitation,
                child: const Text(
                  'Cancel Invitation',
                  style: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
