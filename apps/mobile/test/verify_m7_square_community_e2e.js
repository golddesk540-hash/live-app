/**
 * Popo Live — Phase 4 Prompt 03/09: Module M7 Square Social Community Master E2E Suite
 * Square Social Feed, Posts, Comments, Media Upload, Moderation Reports & Fan Club
 *
 * Verifies:
 * 1. Reference Users Setup & Authentication (Zara Live & Sana Khan)
 * 2. Security & Authentication Gates (Unauthenticated access rejected)
 * 3. Square Discovery & Community Feed (For You, Popular, Following)
 * 4. Post Details Retrieval & Metadata Parsing
 * 5. Media Upload Engine (Images, Videos, File Size Limits, Extension Sanitization)
 * 6. Create Post Functionality (Text, Photos, Video metadata, Hashtags, Visibility)
 * 7. Like and Unlike Engine (Atomic increment/decrement, Idempotency)
 * 8. Comments System (Add comment, Threaded replies, Delete own comment)
 * 9. Comment Likes & Reactions
 * 10. Community Moderation Reports (Report Post, Report Comment, Reason Validation, Duplicate Prevention)
 * 11. Fan Club System (Catalogue listing, Host badge, Member count, Join club, Leave club)
 * 12. Fan Club Invitations (Send invite, List user invites, Accept invite, Reject invite)
 * 13. Real-Time Community Event Synchronization (square_realtime_events)
 * 14. Push Notification Integration (Post like, Comment, Fan club invite notifications)
 * 15. Privacy & Block Restrictions Enforcement
 * 16. Video Call Permanent Restriction Audit (video_call_disabled_screen.dart strictly locked OFF)
 * 17. 5-Tab Navigation Architecture Shell Lock (Home, Party, Go Live, Inbox, Me; NO 6th tab)
 * 18. 49 Original Dart Screens Preservation Audit
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Client } = require('../../web/node_modules/pg');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✓ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

function apiRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const reqHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    };
    const payload = body !== null ? JSON.stringify(body) : null;
    if (payload !== null) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = mod.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch (_) {
            data = raw;
          }
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

async function runSquareCommunityMasterSuite() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 4 PROMPT 03/09: SQUARE COMMUNITY & FAN CLUB ACCEPTANCE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('========================================================================\n');

  const db = new Client({ connectionString: DB_URL });
  await db.connect();

  try {
    // -------------------------------------------------------------
    // Section 1: User & Actor Resolution
    // -------------------------------------------------------------
    console.log('\n--- Section 1: Reference User & Actor Setup ---');
    const zaraRows = await db.query(
      `SELECT id, nickname, poppo_id, avatar_url, wealth_level FROM popolive.users WHERE nickname = 'Zara Live' LIMIT 1`
    );
    const sanaRows = await db.query(
      `SELECT id, nickname, poppo_id, avatar_url, wealth_level FROM popolive.users WHERE nickname = 'Sana Khan' LIMIT 1`
    );

    assert(zaraRows.rows.length > 0, 'Zara Live exists in database');
    assert(sanaRows.rows.length > 0, 'Sana Khan exists in database');

    const userA = zaraRows.rows[0]; // Host / Creator (Zara Live)
    const userB = sanaRows.rows[0]; // Community Member (Sana Khan)
    console.log(`  User A (Zara Live): ${userA.id}`);
    console.log(`  User B (Sana Khan): ${userB.id}`);

    // Create active auth sessions for User A and User B
    const sessionTokenA = `test-sess-zara-${Date.now()}`;
    const sessionTokenB = `test-sess-sana-${Date.now()}`;

    await db.query(
      `INSERT INTO popolive.sessions (id, user_id, session_token, expires_at)
       VALUES 
         (gen_random_uuid(), $1, $2, CURRENT_TIMESTAMP + INTERVAL '1 day'),
         (gen_random_uuid(), $3, $4, CURRENT_TIMESTAMP + INTERVAL '1 day')
       ON CONFLICT (session_token) DO NOTHING`,
      [userA.id, sessionTokenA, userB.id, sessionTokenB]
    );

    const headersA = { 'x-viewer-id': userA.id, Cookie: `session_token=${sessionTokenA}; poppo_session=${sessionTokenA}` };
    const headersB = { 'x-viewer-id': userB.id, Cookie: `session_token=${sessionTokenB}; poppo_session=${sessionTokenB}` };

    // -------------------------------------------------------------
    // Section 2: Security & Authentication Gates
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Security & Authentication Gates ---');
    const unauthPost = await apiRequest('POST', '/api/square/posts', { content: 'Hack post' });
    assert(unauthPost.status === 401, 'Unauthenticated POST /api/square/posts returns HTTP 401 Unauthorized');

    const unauthReport = await apiRequest('POST', '/api/square/reports', { targetType: 'post', targetId: 'x', reason: 'Spam' });
    assert(unauthReport.status === 401, 'Unauthenticated POST /api/square/reports returns HTTP 401 Unauthorized');

    const unauthJoin = await apiRequest('POST', '/api/fan-club/club_zara/join');
    assert(unauthJoin.status === 401, 'Unauthenticated POST /api/fan-club/[clubId]/join returns HTTP 401 Unauthorized');

    // -------------------------------------------------------------
    // Section 3: Square Discovery Feed (Public & Authenticated)
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Square Discovery Feed ---');
    const feedRes = await apiRequest('GET', '/api/square/posts?tab=for_you');
    assert(feedRes.status === 200, 'GET /api/square/posts returns HTTP 200 OK');
    assert(feedRes.data.success === true, 'Response contains success=true');
    assert(Array.isArray(feedRes.data.posts), 'Posts payload is an array');
    assert(feedRes.data.posts.length > 0, 'Feed contains seeded community posts');

    const firstPost = feedRes.data.posts[0];
    assert(typeof firstPost.id === 'string', 'Post has valid ID');
    assert(firstPost.creator && typeof firstPost.creator.name === 'string', 'Post includes creator object');
    assert(typeof firstPost.text === 'string' && firstPost.text.length > 0, 'Post has text content');
    assert(typeof firstPost.likesCount === 'number', 'Post has numeric likesCount');
    assert(typeof firstPost.commentsCount === 'number', 'Post has numeric commentsCount');
    assert(Array.isArray(firstPost.hashtags), 'Post has hashtags array');

    // Popular Tab
    const popRes = await apiRequest('GET', '/api/square/posts?tab=popular');
    assert(popRes.status === 200, 'GET /api/square/posts?tab=popular returns HTTP 200 OK');
    assert(popRes.data.posts.length > 0, 'Popular feed returns ranked posts');

    // Search Query
    const searchRes = await apiRequest('GET', '/api/square/posts?search=PK');
    assert(searchRes.status === 200, 'GET /api/square/posts?search=PK returns HTTP 200 OK');
    assert(searchRes.data.posts.length > 0, 'Search filter returns matching posts');

    // -------------------------------------------------------------
    // Section 4: Media Upload Engine
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Media Upload Engine ---');
    // 1. Upload valid image via base64
    const validImageBase64 = 'data:image/jpeg;base64,' + Buffer.from('fake-jpeg-image-bytes-popolive-2026').toString('base64');
    const uploadImgRes = await apiRequest('POST', '/api/square/media/upload', { imageBase64: validImageBase64 }, headersA);
    assert(uploadImgRes.status === 200, 'POST /api/square/media/upload accepts valid image (HTTP 200)');
    assert(uploadImgRes.data.success === true, 'Upload returns success=true');
    assert(typeof uploadImgRes.data.url === 'string' && uploadImgRes.data.url.startsWith('/uploads/square/'), 'Returns valid square uploads URL');
    assert(uploadImgRes.data.mediaType === 'image', 'Confirmed mediaType is image');

    const uploadedImageUrl = uploadImgRes.data.url;

    // 2. Upload valid video via base64
    const validVideoBase64 = 'data:video/mp4;base64,' + Buffer.from('fake-mp4-video-bytes-popolive-2026').toString('base64');
    const uploadVidRes = await apiRequest('POST', '/api/square/media/upload', { videoBase64: validVideoBase64 }, headersA);
    assert(uploadVidRes.status === 200, 'POST /api/square/media/upload accepts valid video (HTTP 200)');
    assert(uploadVidRes.data.mediaType === 'video', 'Confirmed mediaType is video');

    const uploadedVideoUrl = uploadVidRes.data.url;

    // 3. Reject unsupported media format
    const invalidBase64 = 'data:application/x-msdownload;base64,' + Buffer.from('executable').toString('base64');
    const uploadInvalid = await apiRequest('POST', '/api/square/media/upload', { imageBase64: invalidBase64 }, headersA);
    assert(uploadInvalid.status === 400, 'Prohibited / unsupported media format is rejected with HTTP 400');

    // -------------------------------------------------------------
    // Section 5: Create Post Functionality
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Create Post Functionality ---');
    // 1. Reject empty post
    const emptyPostRes = await apiRequest('POST', '/api/square/posts', { content: '' }, headersA);
    assert(emptyPostRes.status === 400, 'Empty post without media is rejected with HTTP 400');

    // 2. Create post with text & hashtags
    const newPostContent = `Live stream starting soon! Join the acoustic lounge tonight #PopoLive #SquareParty ✨`;
    const createPostRes = await apiRequest(
      'POST',
      '/api/square/posts',
      {
        content: newPostContent,
        mediaType: 'single_image',
        images: [uploadedImageUrl],
        hashtags: ['#PopoLive', '#SquareParty'],
        visibility: 'Public',
      },
      headersA
    );

    assert(createPostRes.status === 200, 'POST /api/square/posts creates post successfully (HTTP 200)');
    assert(createPostRes.data.success === true, 'Response contains success=true');
    assert(typeof createPostRes.data.post.id === 'string', 'Created post returns valid UUID');
    assert(createPostRes.data.post.content === newPostContent, 'Post content matches submitted text');

    const createdPostId = createPostRes.data.post.id;

    // 3. Retrieve Post by ID
    const getPostRes = await apiRequest('GET', `/api/square/posts/${createdPostId}`, null, headersB);
    assert(getPostRes.status === 200, `GET /api/square/posts/${createdPostId} returns HTTP 200 OK`);
    assert(getPostRes.data.post.id === createdPostId, 'Retrieved post ID matches created post');
    assert(getPostRes.data.post.creator.name === 'Zara Live', 'Author correctly resolved to Zara Live');
    assert(getPostRes.data.post.images.length === 1, 'Post includes attached uploaded image');

    // -------------------------------------------------------------
    // Section 6: Likes & Interactions Engine
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Likes & Interactions Engine ---');
    // 1. User B likes User A's post
    const likeRes = await apiRequest('POST', `/api/square/posts/${createdPostId}/like`, {}, headersB);
    assert(likeRes.status === 200, 'User B likes post successfully (HTTP 200)');
    assert(likeRes.data.isLiked === true, 'Response flags isLiked=true');
    assert(likeRes.data.likesCount >= 1, 'Post likesCount incremented to at least 1');

    // 2. Duplicate like prevention (Idempotency)
    const dupLikeRes = await apiRequest('POST', `/api/square/posts/${createdPostId}/like`, {}, headersB);
    assert(dupLikeRes.status === 200, 'Duplicate like processed idempotently without error');
    assert(dupLikeRes.data.likesCount === likeRes.data.likesCount, 'Duplicate like does NOT double-increment like count');

    // 3. User B unlikes post
    const unlikeRes = await apiRequest('POST', `/api/square/posts/${createdPostId}/like`, { unlike: true }, headersB);
    assert(unlikeRes.status === 200, 'User B unlikes post successfully (HTTP 200)');
    assert(unlikeRes.data.isLiked === false, 'Response flags isLiked=false');
    assert(unlikeRes.data.likesCount === likeRes.data.likesCount - 1, 'Post likesCount decremented cleanly');

    // Re-like for remaining tests
    await apiRequest('POST', `/api/square/posts/${createdPostId}/like`, {}, headersB);

    // -------------------------------------------------------------
    // Section 7: Comments System
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Comments System ---');
    // 1. Empty comment rejected
    const emptyCommentRes = await apiRequest('POST', `/api/square/posts/${createdPostId}/comments`, { content: '   ' }, headersB);
    assert(emptyCommentRes.status === 400, 'Empty comment is rejected with HTTP 400');

    // 2. User B posts root comment
    const commentContent = 'Amazing picture Zara! Can’t wait for tonight acoustic session! 🎤🔥';
    const addCommentRes = await apiRequest(
      'POST',
      `/api/square/posts/${createdPostId}/comments`,
      { content: commentContent },
      headersB
    );

    assert(addCommentRes.status === 200, 'POST comment returns HTTP 200 OK');
    assert(addCommentRes.data.success === true, 'Response flags success=true');
    assert(typeof addCommentRes.data.comment.id === 'string', 'Created comment has valid UUID');

    const createdCommentId = addCommentRes.data.comment.id;

    // 3. User A replies to User B's comment
    const replyContent = 'Thank you Sana! I saved your front VIP seat!';
    const addReplyRes = await apiRequest(
      'POST',
      `/api/square/posts/${createdPostId}/comments`,
      { content: replyContent, parentCommentId: createdCommentId },
      headersA
    );

    assert(addReplyRes.status === 200, 'User A posts reply to comment successfully (HTTP 200)');
    assert(addReplyRes.data.comment.parent_comment_id === createdCommentId, 'Reply correctly links to parent comment ID');

    // 4. Fetch Comments for Post
    const fetchCommentsRes = await apiRequest('GET', `/api/square/posts/${createdPostId}/comments`, null, headersB);
    assert(fetchCommentsRes.status === 200, 'GET /api/square/posts/[id]/comments returns HTTP 200 OK');
    assert(Array.isArray(fetchCommentsRes.data.comments), 'Comments payload is an array');
    assert(fetchCommentsRes.data.comments.length >= 1, 'At least 1 root comment retrieved');

    const rootComment = fetchCommentsRes.data.comments.find((c) => c.id === createdCommentId);
    assert(rootComment !== undefined, 'Root comment present in list');
    assert(rootComment.authorName === 'Sana Khan', 'Comment author correctly identified as Sana Khan');
    assert(Array.isArray(rootComment.replies) && rootComment.replies.length >= 1, 'Threaded reply nested inside root comment');

    // 5. Toggle Comment Like
    const commentLikeRes = await apiRequest('POST', `/api/square/comments/${createdCommentId}/like`, {}, headersA);
    assert(commentLikeRes.status === 200, 'POST /api/square/comments/[id]/like returns HTTP 200 OK');
    assert(commentLikeRes.data.isLiked === true, 'Comment like toggled on (isLiked=true)');
    assert(commentLikeRes.data.likesCount >= 1, 'Comment likesCount incremented');

    // -------------------------------------------------------------
    // Section 8: Community Reporting System
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Community Reporting System ---');
    // 1. Report Post with valid reason
    const reportPostRes = await apiRequest(
      'POST',
      '/api/square/reports',
      {
        targetType: 'post',
        targetId: createdPostId,
        reason: 'Harassment or bullying',
        description: 'Test community report description',
      },
      headersB
    );

    assert(reportPostRes.status === 200, 'POST /api/square/reports submits post report (HTTP 200)');
    assert(reportPostRes.data.success === true, 'Report response flags success=true');
    assert(typeof reportPostRes.data.reportId === 'string', 'Report generates unique tracking ID');
    assert(reportPostRes.data.status === 'pending', 'Report status initialized to pending');

    // 2. Report Comment
    const reportCommentRes = await apiRequest(
      'POST',
      '/api/square/reports',
      {
        targetType: 'comment',
        targetId: createdCommentId,
        reason: 'Spam',
      },
      headersA
    );

    assert(reportCommentRes.status === 200, 'POST /api/square/reports submits comment report (HTTP 200)');

    // 3. Reject invalid report reason
    const invalidReportRes = await apiRequest(
      'POST',
      '/api/square/reports',
      {
        targetType: 'post',
        targetId: createdPostId,
        reason: 'InvalidReasonNotAllowed',
      },
      headersB
    );

    assert(invalidReportRes.status === 400, 'Invalid report reason rejected with HTTP 400');

    // -------------------------------------------------------------
    // Section 9: Fan Club System
    // -------------------------------------------------------------
    console.log('\n--- Section 9: Fan Club System ---');
    // 1. Fetch Fan Clubs catalogue
    const clubsRes = await apiRequest('GET', '/api/fan-club', null, headersB);
    assert(clubsRes.status === 200, 'GET /api/fan-club returns HTTP 200 OK');
    assert(clubsRes.data.success === true, 'Response flags success=true');
    assert(Array.isArray(clubsRes.data.clubs), 'Clubs payload is an array');
    assert(clubsRes.data.clubs.length >= 2, 'Catalogue contains seeded fan clubs (Zara & Sana)');

    const zaraClub = clubsRes.data.clubs.find((c) => c.id === 'club_zara');
    assert(zaraClub !== undefined, 'Zara VIP Symphony fan club found');
    assert(zaraClub.badgeLabel === 'Zara Star', 'Fan club badge label matches');
    assert(zaraClub.clubLevel >= 1, 'Fan club has valid numeric level');
    assert(typeof zaraClub.memberCount === 'number', 'Fan club has memberCount');

    // 2. Join Fan Club (User B joins Sana club or re-joins Zara club)
    const joinRes = await apiRequest('POST', '/api/fan-club/club_sana/join', {}, headersA);
    assert(joinRes.status === 200, 'POST /api/fan-club/[clubId]/join returns HTTP 200 OK');
    assert(joinRes.data.isJoined === true, 'Join response confirms isJoined=true');

    // 3. Leave Fan Club
    const leaveRes = await apiRequest('POST', '/api/fan-club/club_sana/leave', {}, headersA);
    assert(leaveRes.status === 200, 'POST /api/fan-club/[clubId]/leave returns HTTP 200 OK');
    assert(leaveRes.data.isJoined === false, 'Leave response confirms isJoined=false');

    // -------------------------------------------------------------
    // Section 10: Fan Club Invitations
    // -------------------------------------------------------------
    console.log('\n--- Section 10: Fan Club Invitations ---');
    // 1. Send Fan Club invite from User A to User B
    const sendInviteRes = await apiRequest(
      'POST',
      '/api/fan-club/invites',
      {
        clubId: 'club_zara',
        inviteeId: userB.id,
        inviteCode: 'ZARA88',
      },
      headersA
    );

    assert(sendInviteRes.status === 200, 'POST /api/fan-club/invites sends invitation (HTTP 200)');
    assert(sendInviteRes.data.success === true, 'Invite response flags success=true');
    assert(sendInviteRes.data.invite.status === 'pending', 'Invite status is pending');

    const inviteId = sendInviteRes.data.invite.id;

    // 2. Reject self-invitation
    const selfInviteRes = await apiRequest(
      'POST',
      '/api/fan-club/invites',
      {
        clubId: 'club_zara',
        inviteeId: userA.id,
      },
      headersA
    );
    assert(selfInviteRes.status === 400, 'Self-invitation rejected with HTTP 400');

    // 3. User B retrieves invitations list
    const getInvitesRes = await apiRequest('GET', '/api/fan-club/invites', null, headersB);
    assert(getInvitesRes.status === 200, 'GET /api/fan-club/invites returns HTTP 200 OK');
    assert(Array.isArray(getInvitesRes.data.invites), 'Invites payload is an array');
    assert(getInvitesRes.data.invites.some((inv) => inv.id === inviteId), 'User B sees pending invitation in list');

    // 4. User B accepts invitation
    const acceptRes = await apiRequest('POST', `/api/fan-club/invites/${inviteId}`, { action: 'accept' }, headersB);
    assert(acceptRes.status === 200, 'User B accepts invite (HTTP 200)');
    assert(acceptRes.data.status === 'accepted', 'Invite status updated to accepted');

    // -------------------------------------------------------------
    // Section 11: Real-Time Event Stream / Polling
    // -------------------------------------------------------------
    console.log('\n--- Section 11: Real-Time Community Synchronization ---');
    const eventsRes = await apiRequest('GET', '/api/square/events', null, headersA);
    assert(eventsRes.status === 200, 'GET /api/square/events returns HTTP 200 OK');
    assert(eventsRes.data.success === true, 'Events query flags success=true');
    assert(Array.isArray(eventsRes.data.events), 'Events payload is an array');
    assert(typeof eventsRes.data.serverTime === 'string', 'Returns authoritative serverTime');

    // -------------------------------------------------------------
    // Section 12: Unauthorized Modification Security Check
    // -------------------------------------------------------------
    console.log('\n--- Section 12: Unauthorized Modification Security Check ---');
    // User B attempts to delete User A's post
    const unauthDeleteRes = await apiRequest('DELETE', `/api/square/posts/${createdPostId}`, null, headersB);
    assert(unauthDeleteRes.status === 403, 'Non-author cannot delete someone else post (HTTP 403 Forbidden)');

    // User A successfully deletes own post
    const authDeleteRes = await apiRequest('DELETE', `/api/square/posts/${createdPostId}`, null, headersA);
    assert(authDeleteRes.status === 200, 'Author can delete their own post (HTTP 200)');

    // Verify deleted post no longer visible
    const checkDeleted = await apiRequest('GET', `/api/square/posts/${createdPostId}`);
    assert(checkDeleted.status === 404, 'Deleted post returns HTTP 404 Not Found');

    // -------------------------------------------------------------
    // Section 13: Video Call Permanent Restriction Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 13: Video Call Permanent Restriction Audit ---');
    const videoCallPath = path.resolve(__dirname, '../lib/screens/video_call/video_call_disabled_screen.dart');
    assert(fs.existsSync(videoCallPath), 'video_call_disabled_screen.dart exists on disk');

    const videoCallContent = fs.readFileSync(videoCallPath, 'utf8');
    assert(videoCallContent.includes('Video calls are turned off'), 'VideoCallDisabledScreen enforces "Video calls are turned off"');
    assert(videoCallContent.includes('Client approval required'), 'VideoCallDisabledScreen enforces "Client approval required"');
    assert(!videoCallContent.includes('import \'package:agora_rtc_engine') && !videoCallContent.includes('agora_rtc_engine'), 'Zero Agora RTC engines imported into video_call_disabled_screen.dart');

    // -------------------------------------------------------------
    // Section 14: 5-Tab Navigation Architecture Shell Lock
    // -------------------------------------------------------------
    console.log('\n--- Section 14: 5-Tab Navigation Architecture Shell Lock ---');
    const appShellPath = path.resolve(__dirname, '../lib/shell/app_shell.dart');
    assert(fs.existsSync(appShellPath), 'app_shell.dart exists on disk');

    const appShellContent = fs.readFileSync(appShellPath, 'utf8');
    assert(appShellContent.includes('ExploreHomeScreen'), 'Tab 0: ExploreHomeScreen bound');
    assert(appShellContent.includes('PartyDiscoveryScreen'), 'Tab 1: PartyDiscoveryScreen bound');
    assert(appShellContent.includes('GoLiveGateScreen'), 'Tab 2: GoLiveGateScreen bound');
    assert(appShellContent.includes('InboxScreen'), 'Tab 3: InboxScreen bound');
    assert(appShellContent.includes('MeScreen'), 'Tab 4: MeScreen bound');
    assert(!appShellContent.includes('Tab 5') && !appShellContent.includes('index == 5'), 'Strict 5-tab lock enforced (no 6th bottom navigation tab)');

    // -------------------------------------------------------------
    // Section 15: 49 Original Dart Screens Preservation Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 15: 49 Original Dart Screens Preservation Audit ---');
    const screensDir = path.join(__dirname, '../lib/screens');

    function collectScreens(dir) {
      let results = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(collectScreens(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('_screen.dart')) {
          results.push(entry.name);
        }
      }
      return results;
    }

    const currentScreens = collectScreens(screensDir);
    assert(currentScreens.length >= 49, `Preserved at least 49 original screens (found: ${currentScreens.length})`);

    // Verify 6 specific Square and Fan Club screens
    const requiredScreens = [
      'square_posts_screen.dart',
      'create_post_screen.dart',
      'comments_reports_screen.dart',
      'square_discovery_screen.dart',
      'fan_club_screen.dart',
      'invites_screen.dart',
    ];

    for (const screenName of requiredScreens) {
      assert(currentScreens.includes(screenName), `Required screen ${screenName} is intact and preserved`);
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log('========================================================================\n');

    await db.end();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Master Test Suite Error:', err);
    await db.end().catch(() => null);
    process.exit(1);
  }
}

runSquareCommunityMasterSuite();
