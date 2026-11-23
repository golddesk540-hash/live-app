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

// 1. daily_host_tasks_screen.dart: wire _errorMessage and PopoErrorState
{
  const file = 'apps/mobile/lib/screens/daily_tasks/daily_host_tasks_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes("import '../../widgets/popo_error_state.dart';")) {
    c = c.replace("import 'package:flutter/material.dart';\n", "import 'package:flutter/material.dart';\nimport '../../widgets/popo_error_state.dart';\n");
  }
  const oldBuild = `  @override
  Widget build(BuildContext context) {
    final total = _tasks.length;`;

  const newBuild = `  @override
  Widget build(BuildContext context) {
    if (DesignFixtures.isError || _errorMessage != null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D031B),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120624),
          foregroundColor: Colors.white,
          title: const Text('Daily Host Tasks', style: TextStyle(fontWeight: FontWeight.w800)),
        ),
        body: Center(
          child: PopoErrorState(
            title: 'Task progress sync failed',
            message: _errorMessage ?? 'Server busy [ERR_TASK_SYNC_503]',
            retryText: 'Retry',
            onRetry: _loadBackendTasks,
          ),
        ),
      );
    }
    final total = _tasks.length;`;

  if (c.includes(oldBuild)) {
    c = c.replace(oldBuild, () => newBuild);
    checkBalance(file, c);
    fs.writeFileSync(file, c, 'utf8');
    console.log('1. Updated build() in daily_host_tasks_screen.dart');
  }
}

// 2. wallet_screen.dart: remove unused imports and fix badgeLabel check
{
  const file = 'apps/mobile/lib/screens/wallet/wallet_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import 'topup_screen.dart';\n", '');
  c = c.replace("import 'transaction_details_screen.dart';\n", '');

  c = c.replace(
    'color: pkg.badgeLabel != null ? _goldAccent.withOpacity(0.5) : Colors.white.withOpacity(0.08),',
    () => 'color: pkg.badgeLabel.isNotEmpty ? _goldAccent.withOpacity(0.5) : Colors.white.withOpacity(0.08),'
  );
  c = c.replace(
    'if (pkg.badgeLabel != null)',
    () => 'if (pkg.badgeLabel.isNotEmpty)'
  );
  c = c.replace(
    'pkg.badgeLabel!,',
    () => 'pkg.badgeLabel,'
  );

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('2. Fixed wallet_screen.dart imports and badgeLabel conditions');
}

// 3. store_screen.dart: remove unused _reqHeaders and _qs if not used
{
  const file = 'apps/mobile/lib/screens/store/store_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/Map<String, String> get _reqHeaders[\s\S]*?;\n\n/, '');
  c = c.replace(/String _qs\(Map<String, dynamic> params\)[\s\S]*?}\n\n/, '');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('3. Cleaned store_screen.dart unused helpers');
}

// 4. recognition_screen.dart: remove unused _demoQ
{
  const file = 'apps/mobile/lib/screens/recognition/recognition_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/final String _demoQ = '';\n/, '');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('4. Cleaned recognition_screen.dart');
}

console.log('ALL FINAL WARNING CLEANUPS APPLIED.');
