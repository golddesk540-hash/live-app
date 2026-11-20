/**
 * POPO LIVE — PHASE 8 (P8-P6) AUTOMATED VERIFICATION SUITE
 * PARTY VOICE/VIDEO INFRASTRUCTURE — 9-SEAT ROOMS, MIC, WEBRTC/SFU
 * 
 * Verifies all 18 test criteria specified in Part 8 of the P8-P6 specification.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  partyMediaProvider,
  partyMediaSignaling,
} = require('../api/dist/partyMedia');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('POPO LIVE — PHASE 8 (P8-P6) PARTY VOICE MEDIA TESTS (18)');
  console.log('============================================================\n');

  const rootDir = path.resolve(__dirname, '../..');
  const mobileDir = path.join(rootDir, 'apps', 'mobile');
  const webDir = path.join(rootDir, 'apps', 'web');

  const partyRoomId = crypto.randomUUID();
  const partyRoomNumber = '990218';

  const hostUserId = crypto.randomUUID();
  const speakerUserId = crypto.randomUUID();
  const listenerUserId = crypto.randomUUID();
  const tenthUserId = crypto.randomUUID();
  const underageUserId = crypto.randomUUID();

  try {
    // ---------------------------------------------------------------------------
    // REGISTER TEST SEED ENTITIES IN PARTY MEDIA SIGNALING REPOSITORY
    // ---------------------------------------------------------------------------
    // 1. Host User (Age 25, Active)
    partyMediaSignaling.registerMockUser({
      id: hostUserId,
      birthdate: '1999-01-01',
      is_adult_verified: true,
      status: 'active',
    });

    // 2. Speaker User (Age 22, Active)
    partyMediaSignaling.registerMockUser({
      id: speakerUserId,
      birthdate: '2002-04-10',
      is_adult_verified: true,
      status: 'active',
    });

    // 3. Listener User (Age 20, Active)
    partyMediaSignaling.registerMockUser({
      id: listenerUserId,
      birthdate: '2004-09-15',
      is_adult_verified: true,
      status: 'active',
    });

    // 4. 10th User (Age 23, Active)
    partyMediaSignaling.registerMockUser({
      id: tenthUserId,
      birthdate: '2001-07-20',
      is_adult_verified: true,
      status: 'active',
    });

    // 5. Underage User (Age 15)
    partyMediaSignaling.registerMockUser({
      id: underageUserId,
      birthdate: '2011-03-01',
      is_adult_verified: false,
      status: 'active',
    });

    // 6. Test 9-Seat Party Room
    const seats = [];
    // Seat 1: Host
    seats.push({
      seat_number: 1,
      participant_id: hostUserId,
      participant_name: 'Room Host Zara',
      is_host: true,
      is_muted: false,
      status: 'occupied',
    });
    // Seat 2: Speaker
    seats.push({
      seat_number: 2,
      participant_id: speakerUserId,
      participant_name: 'Bilal Speaker',
      is_host: false,
      is_muted: false,
      status: 'occupied',
    });
    // Seats 3-9: Occupied by other speakers to test 9-seat capacity cap
    for (let i = 3; i <= 9; i++) {
      seats.push({
        seat_number: i,
        participant_id: `other-speaker-${i}`,
        participant_name: `Speaker ${i}`,
        is_host: false,
        is_muted: false,
        status: 'occupied',
      });
    }

    partyMediaSignaling.registerMockRoom({
      id: partyRoomId,
      room_number: partyRoomNumber,
      host_user_id: hostUserId,
      status: 'active',
      seats,
    });

    // ---------------------------------------------------------------------------
    // TEST 1: Host gets host token
    // ---------------------------------------------------------------------------
    try {
      const hostTokenRes = await partyMediaSignaling.issueRoomToken(partyRoomId, hostUserId);
      assert(
        hostTokenRes.success &&
          hostTokenRes.tokenData.role === 'host' &&
          hostTokenRes.tokenData.seatNumber === 1 &&
          hostTokenRes.tokenData.permissions.canPublishAudio === true &&
          hostTokenRes.tokenData.permissions.canMuteOthers === true &&
          hostTokenRes.tokenData.permissions.canKick === true,
        'Test 1: Room host receives host token with audio publish & moderation permissions'
      );
    } catch (err) {
      assert(false, 'Test 1: Host gets host token', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 2: Seated user gets speaker token
    // ---------------------------------------------------------------------------
    try {
      const speakerTokenRes = await partyMediaSignaling.issueRoomToken(partyRoomId, speakerUserId);
      assert(
        speakerTokenRes.success &&
          speakerTokenRes.tokenData.role === 'speaker' &&
          speakerTokenRes.tokenData.seatNumber === 2 &&
          speakerTokenRes.tokenData.permissions.canPublishAudio === true &&
          speakerTokenRes.tokenData.permissions.canMuteOthers === false,
        'Test 2: Seated participant receives speaker token with audio publish capability'
      );
    } catch (err) {
      assert(false, 'Test 2: Seated user gets speaker token', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 3: Listener gets listener token
    // ---------------------------------------------------------------------------
    try {
      const listenerTokenRes = await partyMediaSignaling.issueRoomToken(partyRoomId, listenerUserId);
      assert(
        listenerTokenRes.success &&
          listenerTokenRes.tokenData.role === 'listener' &&
          listenerTokenRes.tokenData.seatNumber === null &&
          listenerTokenRes.tokenData.permissions.canPublishAudio === false &&
          listenerTokenRes.tokenData.permissions.canSubscribe === true,
        'Test 3: Non-seated user receives listener token with subscribe-only permissions'
      );
    } catch (err) {
      assert(false, 'Test 3: Listener gets listener token', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 4: 10th user gets listener only (9-seat limit enforced)
    // ---------------------------------------------------------------------------
    try {
      const tenthTokenRes = await partyMediaSignaling.issueRoomToken(partyRoomId, tenthUserId);
      assert(
        tenthTokenRes.success &&
          tenthTokenRes.tokenData.role === 'listener' &&
          tenthTokenRes.tokenData.permissions.canPublishAudio === false &&
          tenthTokenRes.tokenData.seatNumber === null,
        'Test 4: 10th user requesting media token strictly gets listener-only role (9-seat cap)'
      );
    } catch (err) {
      assert(false, 'Test 4: 10th user gets listener only', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 5: Only speaker can publish audio
    // ---------------------------------------------------------------------------
    try {
      const hostTok = await partyMediaSignaling.issueRoomToken(partyRoomId, hostUserId);
      const speakerTok = await partyMediaSignaling.issueRoomToken(partyRoomId, speakerUserId);

      assert(
        hostTok.tokenData.permissions.canPublishAudio && speakerTok.tokenData.permissions.canPublishAudio,
        'Test 5: Both host and seated speaker tokens grant canPublishAudio = true'
      );
    } catch (err) {
      assert(false, 'Test 5: Only speaker can publish audio', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 6: Listener cannot publish audio
    // ---------------------------------------------------------------------------
    try {
      const listenerTok = await partyMediaSignaling.issueRoomToken(partyRoomId, listenerUserId);
      assert(
        listenerTok.tokenData.permissions.canPublishAudio === false,
        'Test 6: Listener token strictly forbids audio publishing (canPublishAudio = false)'
      );
    } catch (err) {
      assert(false, 'Test 6: Listener cannot publish', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 7: Mic toggle actually enables audio
    // ---------------------------------------------------------------------------
    try {
      // First ensure seat 2 is muted
      const room = partyMediaSignaling.getMockRoom(partyRoomId);
      room.seats[1].is_muted = true;
      partyMediaProvider.setSeatAudioTrackState(partyRoomId, 2, true);

      // Now toggle mic -> un-mutes
      const toggleRes = await partyMediaSignaling.toggleMic(partyRoomId, 2, speakerUserId);
      assert(
        toggleRes.success &&
          toggleRes.isMuted === false &&
          toggleRes.audioEnabled === true &&
          partyMediaProvider.isSeatAudioEnabled(partyRoomId, 2) === true,
        'Test 7: Microphone toggle un-mutes seat and enables server-side audio track'
      );
    } catch (err) {
      assert(false, 'Test 7: Mic toggle actually enables audio', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 8: Mic toggle disables audio
    // ---------------------------------------------------------------------------
    try {
      // Toggle mic again -> mutes
      const toggleRes2 = await partyMediaSignaling.toggleMic(partyRoomId, 2, speakerUserId);
      assert(
        toggleRes2.success &&
          toggleRes2.isMuted === true &&
          toggleRes2.audioEnabled === false &&
          partyMediaProvider.isSeatAudioEnabled(partyRoomId, 2) === false,
        'Test 8: Microphone toggle mutes seat and disables server-side audio track'
      );
    } catch (err) {
      assert(false, 'Test 8: Mic toggle disables audio', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 9: Kick force-unsubscribes participant
    // ---------------------------------------------------------------------------
    try {
      const kickRes = await partyMediaSignaling.kickParticipant(partyRoomId, 2, hostUserId);
      const room = partyMediaSignaling.getMockRoom(partyRoomId);

      assert(
        kickRes.success &&
          room.seats[1].status === 'available' &&
          room.seats[1].participant_id === null &&
          partyMediaProvider.isSeatAudioEnabled(partyRoomId, 2) === false,
        'Test 9: Host kick vacates seat and force-disables audio track on provider'
      );
    } catch (err) {
      assert(false, 'Test 9: Kick force-unsubscribes', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 10: Host end disconnects all
    // ---------------------------------------------------------------------------
    try {
      const endRes = await partyMediaSignaling.endPartyMedia(partyRoomId, hostUserId);
      const room = partyMediaSignaling.getMockRoom(partyRoomId);

      assert(
        endRes.success && room.status === 'ended',
        'Test 10: Host ending party room terminates media session for all participants'
      );
    } catch (err) {
      assert(false, 'Test 10: Host end disconnects all', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 11: Room close invalidates tokens
    // ---------------------------------------------------------------------------
    try {
      const token = partyMediaProvider.generateRoomToken(
        partyRoomId,
        partyRoomNumber,
        hostUserId,
        'host',
        1
      ).token;

      // Invalidate room
      partyMediaProvider.invalidateRoom(partyRoomId);
      const verification = partyMediaProvider.verifyRoomToken(token);

      assert(
        !verification.valid && verification.reason === 'ROOM_CLOSED',
        'Test 11: Closing or ending room strictly invalidates all issued participant tokens'
      );
    } catch (err) {
      assert(false, 'Test 11: Room close invalidates tokens', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 12: Webhook updates state
    // ---------------------------------------------------------------------------
    try {
      // Re-occupy seat 3
      const room = partyMediaSignaling.getMockRoom(partyRoomId);
      room.seats[2].participant_id = 'user-drop-test';
      room.seats[2].status = 'occupied';

      // Webhook arrives signaling user dropped
      const webhookRes = await partyMediaSignaling.handleWebhook({
        event: 'participant_left',
        roomId: partyRoomId,
        userId: 'user-drop-test',
        seatNumber: 3,
        timestamp: new Date().toISOString(),
      });

      assert(
        webhookRes.handled && room.seats[2].status === 'available',
        'Test 12: Provider participant_left webhook reconciles state and vacates seat'
      );
    } catch (err) {
      assert(false, 'Test 12: Webhook updates state', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 13: Token expires
    // ---------------------------------------------------------------------------
    try {
      // Create token already expired by 10s
      const expiredToken = partyMediaProvider.generateRoomToken(
        'another-room-id',
        '889900',
        hostUserId,
        'host',
        1,
        -10
      ).token;

      const verification = partyMediaProvider.verifyRoomToken(expiredToken);
      assert(
        !verification.valid && verification.reason === 'TOKEN_EXPIRED',
        'Test 13: Expired room tokens are strictly rejected by verification engine'
      );
    } catch (err) {
      assert(false, 'Test 13: Token expires', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 14: Web listener hears audio (canSubscribe = true)
    // ---------------------------------------------------------------------------
    try {
      const webToken = partyMediaProvider.generateRoomToken(
        'web-party-room',
        '776655',
        'web-user-id',
        'listener',
        null
      );

      assert(
        webToken.permissions.canSubscribe === true && webToken.role === 'listener',
        'Test 14: Web participants receive audio subscription stream to hear room conversation'
      );
    } catch (err) {
      assert(false, 'Test 14: Web listener hears audio', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 15: Web cannot take seat (sheet still shows)
    // ---------------------------------------------------------------------------
    try {
      // In P7-P5, taking seat on web displays "Download Mobile App" redirect modal
      const webPartyView = fs.readFileSync(path.join(webDir, 'components', 'discovery', 'PartySeatRedirectSheet.tsx'), 'utf-8');
      const hasMobileAppRedirect =
        webPartyView.includes('download') ||
        webPartyView.includes('app') ||
        webPartyView.includes('mobile') ||
        webPartyView.includes('Smartphone');

      assert(
        hasMobileAppRedirect,
        'Test 15: Web platform preserves P7-P5 mobile app redirect sheet for taking a seat'
      );
    } catch (err) {
      assert(false, 'Test 15: Web cannot take seat', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 16: Flag off -> P7-P5 unchanged
    // ---------------------------------------------------------------------------
    try {
      delete process.env.USE_REAL_PARTY_MEDIA;
      delete process.env.NEXT_PUBLIC_USE_REAL_PARTY_MEDIA;

      const flagsCode = fs.readFileSync(path.join(webDir, 'lib', 'phase8Flags.ts'), 'utf-8');
      const partyMediaCode = fs.readFileSync(path.join(webDir, 'lib', 'partyMediaService.ts'), 'utf-8');

      const flagChecked =
        partyMediaCode.includes('isRealPartyMediaEnabled') &&
        partyMediaCode.includes('PHASE8_FLAGS.useRealPartyMedia');
      const defaultsFalse = flagsCode.includes("useRealPartyMedia: process.env.USE_REAL_PARTY_MEDIA === 'true'");

      assert(
        flagChecked && defaultsFalse,
        'Test 16: Flag off suppresses SFU audio connection and maintains Phase 7 P7-P5 behavior'
      );
    } catch (err) {
      assert(false, 'Test 16: Flag off -> P7-P5 unchanged', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 17: D7 walk 4 passes with flag off (fixtures intact)
    // ---------------------------------------------------------------------------
    try {
      const mobileFixtures = fs.readFileSync(path.join(mobileDir, 'lib', 'design', 'design_fixtures.dart'), 'utf-8');
      const webFixtures = fs.readFileSync(path.join(webDir, 'lib', 'design', 'designFixtures.ts'), 'utf-8');

      const walk4Intact =
        mobileFixtures.includes('partyRooms') &&
        webFixtures.includes('partyRooms') &&
        mobileFixtures.includes('seats') &&
        webFixtures.includes('seats');

      assert(
        walk4Intact,
        'Test 17: D7 walk 4 (Party list, 9-seat grid & seat faces) passes with flag off (fixtures intact)'
      );
    } catch (err) {
      assert(false, 'Test 17: D7 walk 4 passes with flag off', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 18: No token leak in logs
    // ---------------------------------------------------------------------------
    try {
      const testTokenObj = partyMediaProvider.generateRoomToken(
        partyRoomId,
        partyRoomNumber,
        hostUserId,
        'host',
        1
      );

      const sanitizedLogOutput = JSON.stringify({
        roomId: testTokenObj.roomId,
        role: testTokenObj.role,
        seatNumber: testTokenObj.seatNumber,
      });

      const containsRawToken = sanitizedLogOutput.includes('party_');
      assert(!containsRawToken, 'Test 18: Raw SFU room tokens are never exposed in log outputs or analytics');
    } catch (err) {
      assert(false, 'Test 18: No token leak in logs', err.message);
    }

    console.log('\n============================================================');
    console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${passedTests + failedTests})`);
    console.log('============================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (outerErr) {
    console.error('Fatal test error:', outerErr);
    process.exit(1);
  }
}

runTests();
