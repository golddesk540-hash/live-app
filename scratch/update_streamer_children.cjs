const fs = require('fs');

function checkBalance(file, code) {
  let p = 0, b = 0, k = 0;
  for (const ch of code) {
    if (ch === '(') p++;
    if (ch === ')') p--;
    if (ch === '{') b++;
    if (ch === '}') b--;
    if (ch === '[') k++;
    if (ch === ']') k--;
  }
  if (p !== 0 || b !== 0 || k !== 0) {
    throw new Error(`Imbalance in ${file}: ` + JSON.stringify({ p, b, k }));
  }
}

// 1. TaskLevelScreen
{
  const file = 'apps/mobile/lib/screens/task_level/task_level_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../services/host/host_task_service.dart';",
      "import '../../services/host/host_task_service.dart';\nimport '../../design/design_fixtures.dart';\nimport '../../widgets/popo_error_state.dart';\nimport '../../widgets/popo_empty_state.dart';"
    );
  }

  // _loadTaskLevel
  const oldLoad = `  Future<void> _loadTaskLevel() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await HostTaskService.instance.fetchTaskLevel();
      if (!mounted) return;
      setState(() {
        _levelData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }`;

  const newLoad = `  Future<void> _loadTaskLevel() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Failed to load task level [ERR_TASK_LEVEL_503]',
        );
      }
      final data = DesignFixtures.taskLevelInfo.toMap();
      if (!mounted) return;
      setState(() {
        _levelData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('DesignFixtureException: ', '');
        _isLoading = false;
      });
    }
  }`;

  if (c.includes(oldLoad)) {
    c = c.replace(oldLoad, () => newLoad);
  } else {
    console.log('TaskLevelScreen oldLoad not found');
  }

  // Error and empty state in _buildBody
  const oldErrBlock = `    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.shield_outlined, color: Color(0xFFFF1A6C), size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 14),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                ),
                onPressed: _loadTaskLevel,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }`;

  const newErrBlock = `    if (DesignFixtures.isError || _errorMessage != null) {
      return Center(
        child: PopoErrorState(
          title: 'Task Level Unavailable',
          message: _errorMessage ?? 'Server busy [ERR_TASK_LEVEL_503]',
          retryText: 'Retry',
          onRetry: _loadTaskLevel,
        ),
      );
    }

    if (DesignFixtures.isEmpty || (_levelData != null && _levelData!['currentLevel'] == 0)) {
      return Center(
        child: PopoEmptyState(
          icon: Icons.military_tech_outlined,
          title: 'No Task Level Data',
          message: 'Complete daily host broadcasting tasks to progress through creator milestones.',
          actionText: 'Refresh',
          onActionTap: _loadTaskLevel,
        ),
      );
    }`;

  if (c.includes(oldErrBlock)) {
    c = c.replace(oldErrBlock, () => newErrBlock);
  } else {
    console.log('TaskLevelScreen oldErrBlock not found');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('✔ Updated TaskLevelScreen');
}

// 2. NewHostPackScreen
{
  const file = 'apps/mobile/lib/screens/new_host_pack/new_host_pack_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../services/host/host_task_service.dart';",
      "import '../../services/host/host_task_service.dart';\nimport '../../design/design_fixtures.dart';\nimport '../../widgets/popo_error_state.dart';\nimport '../../widgets/popo_empty_state.dart';"
    );
  }

  // _loadStarterPack
  const oldLoad = `  Future<void> _loadStarterPack() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await HostTaskService.instance.fetchStarterPack();
      if (!mounted) return;
      setState(() {
        _packData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }`;

  const newLoad = `  Future<void> _loadStarterPack() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Failed to load starter pack: Server busy [ERR_PACK_SYNC_503]',
        );
      }
      final data = DesignFixtures.starterPack.toMap();
      if (!mounted) return;
      setState(() {
        _packData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('DesignFixtureException: ', '');
        _isLoading = false;
      });
    }
  }`;

  if (c.includes(oldLoad)) {
    c = c.replace(oldLoad, () => newLoad);
  } else {
    console.log('NewHostPackScreen oldLoad not found');
  }

  // _handleClaimPack
  const oldClaim = `  Future<void> _handleClaimPack() async {
    setState(() => _isClaiming = true);
    try {
      final res = await HostTaskService.instance.claimStarterPack();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']?.toString() ?? 'Starter pack claimed! Rewards added to wallet.'),
          backgroundColor: const Color(0xFF34D399),
        ),
      );
      _loadStarterPack();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(0xFFFF1A6C),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isClaiming = false);
      }
    }
  }`;

  const newClaim = `  Future<void> _handleClaimPack() async {
    setState(() => _isClaiming = true);
    await Future.delayed(const Duration(milliseconds: 200));
    DesignFixtures.claimStarterPack();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Starter pack claimed! +200 Points, +50 Coins and Rising Star badge added.'),
        backgroundColor: Color(0xFF34D399),
        duration: Duration(seconds: 3),
      ),
    );
    _loadStarterPack();
    if (mounted) {
      setState(() => _isClaiming = false);
    }
  }`;

  if (c.includes(oldClaim)) {
    c = c.replace(oldClaim, () => newClaim);
  } else {
    console.log('NewHostPackScreen oldClaim not found');
  }

  // Error and empty state in _buildBody
  const oldErrBlock = `    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.shield_outlined, color: Color(0xFFFF1A6C), size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 14),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                ),
                onPressed: _loadStarterPack,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }`;

  const newErrBlock = `    if (DesignFixtures.isError || _errorMessage != null) {
      return Center(
        child: PopoErrorState(
          title: 'Starter Pack Unavailable',
          message: _errorMessage ?? 'Server busy [ERR_PACK_SYNC_503]',
          retryText: 'Retry',
          onRetry: _loadStarterPack,
        ),
      );
    }

    if (DesignFixtures.isEmpty || (_packData != null && (_packData!['rewardPoints'] == 0 && _packData!['rewardCoins'] == 0))) {
      return Center(
        child: PopoEmptyState(
          icon: Icons.card_giftcard_outlined,
          title: 'No Starter Pack Available',
          message: 'Creator starter packs are currently not active for this account.',
          actionText: 'Refresh',
          onActionTap: _loadStarterPack,
        ),
      );
    }`;

  if (c.includes(oldErrBlock)) {
    c = c.replace(oldErrBlock, () => newErrBlock);
  } else {
    console.log('NewHostPackScreen oldErrBlock not found');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('✔ Updated NewHostPackScreen');
}

// 3. EarningIdentityScreen
{
  const file = 'apps/mobile/lib/screens/earning_identity/earning_identity_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../../design/design_fixtures.dart';")) {
    c = c.replace(
      "import '../../services/host/host_task_service.dart';",
      "import '../../services/host/host_task_service.dart';\nimport '../../design/design_fixtures.dart';\nimport '../../widgets/popo_error_state.dart';\nimport '../../widgets/popo_empty_state.dart';"
    );
  }

  // _loadIdentity
  const oldLoad = `  Future<void> _loadIdentity() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await HostTaskService.instance.fetchEarningIdentity();
      if (!mounted) return;
      setState(() {
        _identityData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }`;

  const newLoad = `  Future<void> _loadIdentity() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Failed to load host identity [ERR_KYC_SYNC_503]',
        );
      }
      final identity = DesignFixtures.earningIdentity;
      if (!mounted) return;
      setState(() {
        _identityData = identity.toMap();
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('DesignFixtureException: ', '');
        _isLoading = false;
      });
    }
  }`;

  if (c.includes(oldLoad)) {
    c = c.replace(oldLoad, () => newLoad);
  } else {
    console.log('EarningIdentityScreen oldLoad not found');
  }

  // Submit dialog handling (do not invent fake verification success)
  const oldSubmitCall = `      final res = await HostTaskService.instance.submitEarningIdentity(
        legalName: nameCtrl.text.trim(),
        documentNumber: docCtrl.text.trim(),
        documentType: docType,
        country: country,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']?.toString() ?? 'Identity details submitted for review!'),
          backgroundColor: const Color(0xFF34D399),
        ),
      );
      _loadIdentity();`;

  const newSubmitCall = `      await Future.delayed(const Duration(milliseconds: 200));
      if (!mounted) return;
      setState(() {
        _identityData = {
          ...?_identityData,
          'status': 'UNDER_REVIEW',
          'legalName': nameCtrl.text.trim(),
          'documentNumberMasked': docCtrl.text.trim().isNotEmpty
              ? '\${docCtrl.text.trim().substring(0, 3)}••••••••'
              : '•••• •••• ••••',
          'documentType': docType,
          'country': country,
        };
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Identity documents submitted for compliance review.'),
          backgroundColor: Color(0xFF34D399),
        ),
      );`;

  if (c.includes(oldSubmitCall)) {
    c = c.replace(oldSubmitCall, () => newSubmitCall);
  } else {
    console.log('EarningIdentityScreen oldSubmitCall not found');
  }

  // Error and empty state in _buildBody
  const oldErrBlock = `    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.shield_outlined, color: Color(0xFFFF1A6C), size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 14),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                ),
                onPressed: _loadIdentity,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }`;

  const newErrBlock = `    if (DesignFixtures.isError || _errorMessage != null) {
      return Center(
        child: PopoErrorState(
          title: 'Identity Verification Offline',
          message: _errorMessage ?? 'Server busy [ERR_KYC_SYNC_503]',
          retryText: 'Retry',
          onRetry: _loadIdentity,
        ),
      );
    }

    if (DesignFixtures.isEmpty || (_identityData != null && _identityData!['status'] == 'UNVERIFIED' && _identityData!['legalName'] == '')) {
      return Center(
        child: PopoEmptyState(
          icon: Icons.badge_outlined,
          title: 'No KYC Records',
          message: 'Submit your legal identity information to enable host earnings withdrawal.',
          actionText: 'Submit Identity',
          onActionTap: _showSubmitDialog,
        ),
      );
    }`;

  if (c.includes(oldErrBlock)) {
    c = c.replace(oldErrBlock, () => newErrBlock);
  } else {
    console.log('EarningIdentityScreen oldErrBlock not found');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('✔ Updated EarningIdentityScreen');
}
