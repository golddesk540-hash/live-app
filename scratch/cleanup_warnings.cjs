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

// 1. Clean coin_seller_screen.dart
{
  const file = 'apps/mobile/lib/screens/agency_management/coin_seller_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../../widgets/popo_empty_state.dart';\n", "");
  c = c.replace("import '../../widgets/popo_error_state.dart';\n", "");
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 2. Clean withdrawal_screen.dart
{
  const file = 'apps/mobile/lib/screens/agency_management/withdrawal_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../../widgets/popo_empty_state.dart';\n", "");
  c = c.replace("import '../../widgets/popo_error_state.dart';\n", "");
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 3. Clean me_screen.dart
{
  const file = 'apps/mobile/lib/screens/profile/me_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  const legacyStart = c.indexOf('  void _unusedLegacyOpenWatchHistory(BuildContext context) {');
  if (legacyStart !== -1) {
    const legacyEnd = c.indexOf('  @override\n  Widget build(BuildContext context) {');
    if (legacyEnd !== -1) {
      c = c.substring(0, legacyStart) + c.substring(legacyEnd);
    }
  }
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 4. Clean agency_management_screen.dart
{
  const file = 'apps/mobile/lib/screens/agency_management/agency_management_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../profile/public_profile_screen.dart';\n", "");
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 5. Clean task_level_screen.dart
{
  const file = 'apps/mobile/lib/screens/task_level/task_level_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../../services/host/host_task_service.dart';\n", "");
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 6. Clean new_host_pack_screen.dart
{
  const file = 'apps/mobile/lib/screens/new_host_pack/new_host_pack_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../../services/host/host_task_service.dart';\n", "");
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 7. Clean earning_identity_screen.dart
{
  const file = 'apps/mobile/lib/screens/earning_identity/earning_identity_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../../services/host/host_task_service.dart';\n", "");
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

console.log('CLEANUP COMPLETE');
