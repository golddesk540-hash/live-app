const fs = require('fs');

function checkFile(path, name) {
  const c = fs.readFileSync(path, 'utf8');
  console.log('=== ' + name + ' ===');
  const m = c.match(/appBar:[\s\S]*?title:[\s\S]*?\),/);
  if (m) console.log(m[0].replace(/\s+/g, ' '));
}

checkFile('apps/mobile/lib/screens/task_level/task_level_screen.dart', 'TaskLevel');
checkFile('apps/mobile/lib/screens/new_host_pack/new_host_pack_screen.dart', 'NewHostPack');
checkFile('apps/mobile/lib/screens/earning_identity/earning_identity_screen.dart', 'EarningIdentity');
checkFile('apps/mobile/lib/screens/live/go_live_gate_screen.dart', 'GoLiveGate');
checkFile('apps/mobile/lib/screens/agency_management/withdrawal_screen.dart', 'Withdrawal');
checkFile('apps/mobile/lib/screens/profile/settings_screen.dart', 'Settings');
