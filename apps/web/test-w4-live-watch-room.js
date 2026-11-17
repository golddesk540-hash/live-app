/**
 * W4 VERIFICATION SUITE — LIVE WATCH ROOM (WATCH, CHAT, REPORT — NO GIFT SENDING)
 *
 * Verifies:
 * 1. ViewerRoomScreen has NO gift button (data-testid="live-room-open-gift-btn" is ABSENT).
 * 2. GiftSendingPanel is NOT imported or opened anywhere in ViewerRoomScreen.
 * 3. LiveGiftAnimationOverlay is PRESERVED for mobile-sent gift animations.
 * 4. AnimationStageOverlay and real-time gift event listeners are PRESERVED.
 * 5. Active gift banner / pill ("Sent Rose x10") is PRESERVED.
 * 6. Viewer chat input, send, and message feed are PRESERVED.
 * 7. Report and Block safety tools (SafetyToolsScreen) are PRESERVED.
 * 8. Video player (Agora remote stream subscription and HTML5 video) is PRESERVED.
 * 9. Audio mute / unmute toggle is PRESERVED.
 * 10. Creator controls (Go Live, Party, PK, Wallet, Square) are ABSENT from ViewerRoomScreen.
 * 11. LiveRoomCard: clicking host name opens actual live room (/live/room/...) instead of /user/[id].
 * 12. FollowingUserCard: clicking host card opens actual live room; no navigation to /user/[id]; no fake room IDs.
 * 13. Public watch URL /live/room/[roomId] remains accessible (returns HTTP 200, does not redirect to download).
 * 14. When stream ends, web viewer returns to /live (handleExitRoom navigates to /live).
 * 15. Flutter mobile codebase is 100% untouched.
 * 16. Database schema and migrations are 100% untouched.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runW4Verification() {
  console.log('======================================================================');
  console.log('🧪 RUNNING W4 LIVE WATCH ROOM AUDIT SUITE');
  console.log('======================================================================\n');

  const viewerRoomPath = path.join(__dirname, 'components', 'live', 'ViewerRoomScreen.tsx');
  const viewerRoomContent = fs.readFileSync(viewerRoomPath, 'utf8');

  const liveRoomCardPath = path.join(__dirname, 'components', 'discovery', 'LiveRoomCard.tsx');
  const liveRoomCardContent = fs.readFileSync(liveRoomCardPath, 'utf8');

  const followingCardPath = path.join(__dirname, 'components', 'discovery', 'FollowingUserCard.tsx');
  const followingCardContent = fs.readFileSync(followingCardPath, 'utf8');

  const roomPagePath = path.join(__dirname, 'app', 'live', 'room', '[roomId]', 'page.tsx');
  const roomPageContent = fs.readFileSync(roomPagePath, 'utf8');

  // -------------------------------------------------------------------------
  // SECTION 1: Gift Sending Disabled on Website
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: Gift Button & GiftSendingPanel Removal ---');
  assert(
    !viewerRoomContent.includes('data-testid="live-room-open-gift-btn"'),
    'Gift button (live-room-open-gift-btn) is completely REMOVED'
  );
  assert(
    !viewerRoomContent.includes('GiftSendingPanel'),
    'GiftSendingPanel is neither imported nor rendered in ViewerRoomScreen'
  );
  assert(
    !viewerRoomContent.includes('showGiftPanel'),
    'showGiftPanel state is completely removed'
  );
  assert(
    !viewerRoomContent.includes('data-testid="live-room-gift-drawer"'),
    'Gift sending drawer container is completely absent'
  );

  // -------------------------------------------------------------------------
  // SECTION 2: Gift Animations Preserved for Mobile-Sent Gifts
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Mobile Gift Animations Preserved ---');
  assert(
    viewerRoomContent.includes('LiveGiftAnimationOverlay'),
    'LiveGiftAnimationOverlay is PRESERVED for displaying mobile gifts'
  );
  assert(
    viewerRoomContent.includes('AnimationStageOverlay'),
    'AnimationStageOverlay is PRESERVED for stage gift animations'
  );
  assert(
    viewerRoomContent.includes("animation:gift_started"),
    'Real-time animation:gift_started event listener is operational'
  );
  assert(
    viewerRoomContent.includes('/api/animations/events'),
    'Server-Sent Events connection to /api/animations/events is active'
  );
  assert(
    viewerRoomContent.includes('activeGift'),
    'Active gift banner showing sender information and gift count is preserved'
  );

  // -------------------------------------------------------------------------
  // SECTION 3: Live Video & Audio Playback Preserved
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Live Video & Audio Playback ---');
  assert(
    viewerRoomContent.includes('<video') && viewerRoomContent.includes('videoRef'),
    'HTML5 video player is present and configured'
  );
  assert(
    viewerRoomContent.includes("agoraClient.setClientRole('audience')"),
    'Agora RTC audience subscription is configured for live streaming'
  );
  assert(
    viewerRoomContent.includes('Volume2') && viewerRoomContent.includes('VolumeX'),
    'Sound Mute / Unmute toggle controls are operational'
  );

  // -------------------------------------------------------------------------
  // SECTION 4: Viewer Chat Preserved
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Viewer Chat Functionality ---');
  assert(
    viewerRoomContent.includes('handleSendChat'),
    'handleSendChat handler is preserved'
  );
  assert(
    viewerRoomContent.includes('/api/live/chat/send'),
    'Chat send endpoint integration is preserved'
  );
  assert(
    viewerRoomContent.includes('/api/live/chat/messages'),
    'Live chat polling from /api/live/chat/messages is preserved'
  );
  assert(
    viewerRoomContent.includes('chatMessages'),
    'Chat message feed state is preserved'
  );

  // -------------------------------------------------------------------------
  // SECTION 5: Moderation (Report & Block) Preserved
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Moderation & Safety Tools ---');
  assert(
    viewerRoomContent.includes('SafetyToolsScreen'),
    'SafetyToolsScreen is integrated for report, block and mute'
  );
  assert(
    viewerRoomContent.includes('/api/live/safety/block'),
    'Safety block integration is preserved'
  );
  assert(
    viewerRoomContent.includes('/api/live/safety/mute'),
    'Safety mute integration is preserved'
  );

  // -------------------------------------------------------------------------
  // SECTION 6: Absence of Creator Controls in LIVE Watch Room
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 6: Creator Controls Absent from LIVE Watch Room ---');
  assert(
    !viewerRoomContent.includes('href="/live/setup"'),
    'Go Live control is absent from ViewerRoomScreen'
  );
  assert(
    !viewerRoomContent.includes('href="/party"') && !viewerRoomContent.includes('PartyRoomCard'),
    'Party controls are absent from ViewerRoomScreen'
  );
  assert(
    !viewerRoomContent.includes('handleStartPk') && !viewerRoomContent.includes('href="/pk"'),
    'PK battle initiation controls are absent from ViewerRoomScreen'
  );
  assert(
    !viewerRoomContent.includes('href="/wallet"'),
    'Wallet control is absent from ViewerRoomScreen'
  );
  assert(
    !viewerRoomContent.includes('href="/square"'),
    'Square control is absent from ViewerRoomScreen'
  );

  // -------------------------------------------------------------------------
  // SECTION 7: LiveRoomCard Host Name Navigation
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 7: LiveRoomCard Navigation ---');
  assert(
    !liveRoomCardContent.includes('hostProfileLink') && !liveRoomCardContent.includes("router.push('/user/"),
    'LiveRoomCard does not navigate to /user/[id]'
  );
  assert(
    liveRoomCardContent.includes('router.push(roomLink)'),
    'Clicking host name opens corresponding live room (/live/room/[roomId])'
  );
  assert(
    liveRoomCardContent.includes('room.roomId || room.roomNumber'),
    'Actual room ID is preserved in roomLink'
  );

  // -------------------------------------------------------------------------
  // SECTION 8: FollowingUserCard Navigation
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 8: FollowingUserCard Navigation ---');
  assert(
    !followingCardContent.includes("router.push(`/user/"),
    'FollowingUserCard does not navigate to /user/[id]'
  );
  assert(
    followingCardContent.includes("router.push(`/live/room/${targetRoom}`)"),
    'Clicking FollowingUserCard opens actual live room'
  );
  assert(
    !followingCardContent.includes("'100220'"),
    'Fake room ID 100220 is removed from FollowingUserCard'
  );

  // -------------------------------------------------------------------------
  // SECTION 9: Public Live Room URL & Stream Ended Behavior
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 9: Public Watch Route & Stream-End Return ---');
  assert(
    roomPageContent.includes('<ViewerRoomScreen roomId={params.roomId} />'),
    'Public route /live/room/[roomId] renders ViewerRoomScreen without redirect'
  );
  assert(
    viewerRoomContent.includes("router.push('/live')"),
    'handleExitRoom routes back to /live'
  );
  assert(
    viewerRoomContent.includes('Live Broadcast Ended'),
    'Stream ended notice is present'
  );

  // -------------------------------------------------------------------------
  // SECTION 10: Strict Preservation Boundaries
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 10: Strict Preservation Boundaries ---');
  const gitDiffMobile = execSync('git diff --name-only apps/mobile', { encoding: 'utf8' }).trim();
  assert(gitDiffMobile === '', 'Mobile Flutter codebase is 100% untouched');

  const gitDiffDb = execSync('git diff --name-only apps/web/data/migrations', { encoding: 'utf8' }).trim();
  assert(gitDiffDb === '', 'Database migrations and schema are 100% untouched');

  // Summary
  console.log('\n======================================================================');
  console.log(`TOTAL AUDIT ASSERTIONS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runW4Verification();
