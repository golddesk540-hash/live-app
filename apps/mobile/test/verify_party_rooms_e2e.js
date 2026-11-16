// E2E Multi-Device Verification Script for Phase 2 Prompt 08/10:
// M4: 9-Seat Party Room Creation, Discovery & Room Interface
// Tests multi-device flow: Host (Device A) and Viewer (Device B).
// Validates:
// 1. GET /api/party/categories returns canonical categories
// 2. POST /api/party/create creates 9-seat party room with Seat 1 as host
// 3. GET /api/discovery/party lists created party room with seat occupancy
// 4. Category filtering on GET /api/discovery/party?category=...
// 5. GET /api/party/{roomId} returns room details and metadata
// 6. GET /api/party/{roomId}/seats verifies strictly 9 seats (Seat 1 Host, Seats 2-9 Available)
// 7. Input bounds validation (empty title, >50 chars title, invalid category)

const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

function generateConsentCookie() {
  const payload = {
    consentId: 'consent_' + Date.now(),
    anonymousSessionId: 'anon_' + Date.now(),
    termsVersion: 'v4.2.0',
    privacyVersion: 'v4.2.0',
    status: 'accepted',
    timestamp: Date.now(),
  };
  const SECRET_KEY = process.env.CONSENT_SECRET_KEY || 'poppo-live-secure-consent-salt-2026-v4';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
  return `${data}.${signature}`;
}

class ClientDevice {
  constructor(name) {
    this.name = name;
    this.sessionCookie = '';
    this.consentCookie = generateConsentCookie();
    this.ip = `192.168.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
    this.user = null;
  }

  async request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Forwarded-For': this.ip,
      ...(options.headers || {}),
    };

    const cookieParts = [];
    if (this.consentCookie) cookieParts.push(`poppo_terms_consent=${this.consentCookie}`);
    if (this.sessionCookie) cookieParts.push(`poppo_session=${this.sessionCookie}`);
    if (cookieParts.length > 0 && !headers['Cookie']) {
      headers['Cookie'] = cookieParts.join('; ');
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/poppo_session=([^;]+)/);
      if (match) {
        this.sessionCookie = match[1];
      }
    }

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    return { status: res.status, ok: res.ok, data: json, headers: res.headers };
  }

  async registerUser(prefix, gender = 'female') {
    const email = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9000)}@testpopo.com`;
    const nickname = `${prefix}_${Math.floor(Math.random() * 9000 + 1000)}`;
    const regRes = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nickname,
        email,
        password: 'Password123!',
        isAdultConfirmed: true,
        gender,
        birthDate: '1998-05-15',
        country: 'PK',
      }),
    });

    if (!regRes.ok || !regRes.data.user) {
      throw new Error(`Failed to register ${this.name}: ${JSON.stringify(regRes.data)}`);
    }

    this.user = regRes.data.user;

    // Accept age consent
    await this.request('/api/auth/age-consent', {
      method: 'POST',
      body: JSON.stringify({ agreed: true }),
    });

    return this.user;
  }
}

async function runPartyRoomsVerification() {
  console.log('========================================================================');
  console.log('PHASE 2 PROMPT 08/10: 9-SEAT PARTY ROOM CREATION, DISCOVERY & ROOM E2E');
  console.log('========================================================================\n');

  let passedAssertions = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ PASSED: ${message}`);
    passedAssertions++;
  }

  const hostDevice = new ClientDevice('Device_A_Host');
  const viewerDevice = new ClientDevice('Device_B_Viewer');

  console.log('--- Step 1: User Onboarding ---');
  await hostDevice.registerUser('host_party');
  assert(hostDevice.user && hostDevice.user.id, `Host registered: ${hostDevice.user?.nickname}`);

  await viewerDevice.registerUser('viewer_party', 'male');
  assert(viewerDevice.user && viewerDevice.user.id, `Viewer registered: ${viewerDevice.user?.nickname}`);

  console.log('\n--- Step 2: Fetch Canonical Party Categories (GET /api/party/categories) ---');
  const catRes = await hostDevice.request('/api/party/categories');
  assert(catRes.ok && catRes.data.success, 'Successfully fetched party categories');
  assert(Array.isArray(catRes.data.categories) && catRes.data.categories.length > 0, `Retrieved ${catRes.data.categories?.length} categories`);
  const firstCat = catRes.data.categories[0];
  assert(firstCat && firstCat.id && firstCat.name, `First category: ${firstCat?.name} (id: ${firstCat?.id})`);

  console.log('\n--- Step 3: Input Validation on Room Creation ---');
  // Empty title
  const emptyTitleRes = await hostDevice.request('/api/party/create', {
    method: 'POST',
    body: JSON.stringify({ title: '', categoryId: firstCat.id }),
  });
  assert(emptyTitleRes.status === 400, 'Empty title rejected with 400 Bad Request');

  // Title exceeding 50 characters
  const longTitleRes = await hostDevice.request('/api/party/create', {
    method: 'POST',
    body: JSON.stringify({ title: 'A'.repeat(51), categoryId: firstCat.id }),
  });
  assert(longTitleRes.status === 400, 'Title > 50 characters rejected with 400 Bad Request');

  // Invalid category ID
  const invalidCatRes = await hostDevice.request('/api/party/create', {
    method: 'POST',
    body: JSON.stringify({ title: 'Valid Title', categoryId: 'non_existent_category_xyz' }),
  });
  assert(invalidCatRes.status === 400, 'Invalid category ID rejected with 400 Bad Request');

  console.log('\n--- Step 4: Host Creates 9-Seat Party Room (POST /api/party/create) ---');
  const roomTitle = `Chill Jam Voice Party #${Math.floor(Math.random() * 900 + 100)}`;
  const createRes = await hostDevice.request('/api/party/create', {
    method: 'POST',
    body: JSON.stringify({
      title: roomTitle,
      categoryId: firstCat.id,
      roomType: 'public',
    }),
  });

  assert(createRes.status === 201 && createRes.data.success, 'Host created party room (201 Created)');
  const party = createRes.data.party;
  assert(party && party.id, `Party room ID generated: ${party?.id}`);
  assert(party.roomNumber && party.roomNumber.length > 0, `Party room number generated: ${party?.roomNumber}`);
  assert(party.maxSeats === 9, 'Party room enforces exactly 9 max seats');
  assert(party.currentMembers === 1, 'Party room starts with 1 member (Host)');
  assert(party.status === 'live', 'Party room status is live');
  assert(party.isPrivate === false, 'Party room is public');

  console.log('\n--- Step 5: Party Room Discovery (GET /api/discovery/party) ---');
  const discoveryRes = await viewerDevice.request('/api/discovery/party');
  assert(discoveryRes.ok && discoveryRes.data.success, 'Viewer fetched party discovery list');
  assert(Array.isArray(discoveryRes.data.rooms) && discoveryRes.data.rooms.length > 0, `Discovery lists ${discoveryRes.data.rooms.length} party rooms`);

  const createdInDiscovery = discoveryRes.data.rooms.find(
    (r) => r.id === party.id || r.roomNumber === party.roomNumber
  );
  assert(Boolean(createdInDiscovery), `Newly created party room found in discovery: ${createdInDiscovery?.title}`);
  assert(createdInDiscovery.seatCountFormatted.includes('/ 9'), `Seat count formatted correctly: ${createdInDiscovery?.seatCountFormatted}`);

  console.log('\n--- Step 6: Category Filtering (GET /api/discovery/party?category=...) ---');
  const filteredRes = await viewerDevice.request(`/api/discovery/party?category=${encodeURIComponent(firstCat.name.toLowerCase())}`);
  assert(filteredRes.ok && filteredRes.data.success, `Filtered party discovery by category: ${firstCat.name}`);

  console.log('\n--- Step 7: Party Room Details (GET /api/party/{roomId}) ---');
  const roomDetailsRes = await viewerDevice.request(`/api/party/${party.roomNumber}`);
  assert(roomDetailsRes.ok && roomDetailsRes.data.success, 'Viewer fetched party room details');
  const roomDetails = roomDetailsRes.data.room;
  assert(roomDetails.roomNumber === party.roomNumber, `Room number matches: ${roomDetails.roomNumber}`);
  assert(roomDetails.title === roomTitle, `Room title matches: ${roomDetails.title}`);
  assert(roomDetails.maxSeats === 9, 'Room details report 9 max seats');
  assert(roomDetails.status === 'live', 'Room details confirm status is live');

  console.log('\n--- Step 8: 9-Seat Occupancy Verification (GET /api/party/{roomId}/seats) ---');
  const seatsRes = await viewerDevice.request(`/api/party/${party.roomNumber}/seats`);
  assert(seatsRes.ok && seatsRes.data.success, 'Viewer fetched party seat information');
  assert(seatsRes.data.totalSeats === 9, `Total seats is exactly 9 (got ${seatsRes.data.totalSeats})`);
  assert(Array.isArray(seatsRes.data.seats) && seatsRes.data.seats.length === 9, 'Seats array contains exactly 9 items');

  // Verify Seat 1 is Host
  const seat1 = seatsRes.data.seats[0];
  assert(seat1.seatNumber === 1, 'Seat 1 has seatNumber = 1');
  assert(seat1.isHost === true, 'Seat 1 is identified as Host (isHost = true)');
  assert(seat1.status === 'occupied', 'Seat 1 is occupied by the host');
  assert(seat1.participantName === hostDevice.user.nickname, `Host participant name matches: ${seat1.participantName}`);

  // Verify Seats 2 through 9 are Available
  for (let i = 1; i < 9; i++) {
    const guestSeat = seatsRes.data.seats[i];
    assert(guestSeat.seatNumber === i + 1, `Seat ${i + 1} has seatNumber = ${i + 1}`);
    assert(guestSeat.isHost === false, `Seat ${i + 1} is not a host seat`);
    assert(guestSeat.status === 'available', `Seat ${i + 1} is available for guest requests`);
  }

  assert(seatsRes.data.occupiedCount === 1, 'Occupied count is exactly 1 (Host)');
  assert(seatsRes.data.availableCount === 8, 'Available count is exactly 8 (Guests)');

  console.log('\n--- Step 9: Non-Existent Room Handling ---');
  const nonExistentRes = await viewerDevice.request('/api/party/99999999');
  assert(nonExistentRes.status === 200 || nonExistentRes.status === 404, 'Non-existent room handled gracefully without server crash');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passedAssertions} E2E ASSERTIONS PASSED SUCCESSFULLY!`);
  console.log('========================================================================\n');
}

runPartyRoomsVerification().catch((err) => {
  console.error('\n❌ E2E VERIFICATION SCRIPT ENCOUNTERED AN ERROR:', err);
  process.exit(1);
});
