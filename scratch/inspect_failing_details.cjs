const fs = require('fs');

// Check taskLevelInfo
const c1 = fs.readFileSync('apps/mobile/lib/design/design_fixtures.dart', 'utf8');
const idx1 = c1.indexOf('taskLevelInfo');
console.log('=== taskLevelInfo ===\n', c1.substring(idx1, idx1 + 250));

// Check NewHostPack button text
const c2 = fs.readFileSync('apps/mobile/lib/screens/new_host_pack/new_host_pack_screen.dart', 'utf8');
const mBtn = c2.match(/Text\(['"][^'"]*Pack[^'"]*['"]/g);
console.log('=== NewHostPack buttons ===\n', mBtn);

// Check GoLiveGateScreen texts
const c3 = fs.readFileSync('apps/mobile/lib/screens/live/go_live_gate_screen.dart', 'utf8');
const mGate = c3.match(/Text\(['"][^'"]{5,40}['"]/g);
console.log('=== GoLiveGate texts ===\n', mGate ? mGate.slice(0, 10) : 'none');

// Check test failures in task-42479.log
const log = fs.readFileSync('C:/Users/HP/.gemini/antigravity/brain/d49e7e92-2cbf-4a82-b7ce-920366fb716f/.system_generated/tasks/task-42479.log', 'utf8');
const fails = log.split('══╡ EXCEPTION CAUGHT BY FLUTTER TEST FRAMEWORK ╞════════════════════════════════════════════════════');
fails.forEach((f, i) => {
  if (i > 0) {
    const lines = f.split('\n');
    console.log(`\n--- FAIL ${i} ---`);
    console.log(lines.slice(0, 6).join('\n'));
  }
});
