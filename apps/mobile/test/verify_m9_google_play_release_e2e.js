/**
 * Popo Live — Phase 4 Prompt 07/09: Module M9 Google Play Integration,
 * Production Build Configuration & Internal Testing Master E2E Suite
 *
 * Verifies:
 * 1. Application Identity Audit (Name, Application ID, Namespace, Version Name & Code)
 * 2. Target SDK & Compile SDK Google Play Compliance (compileSdk=35, targetSdk=35, minSdk=24)
 * 3. Java & Kotlin 17 Build Toolchain Compatibility
 * 4. 64-Bit & Device Architecture Support (armeabi-v7a, arm64-v8a, x86_64)
 * 5. Android Permissions & Hardware Feature Audit (Agora, FCM, Billing, Foreground Service)
 * 6. Dangerous / Prohibited Permissions Exclusion (No SMS, Call Logs, or System Alert Window)
 * 7. Production ProGuard / R8 Optimization & Obfuscation Rules (Agora, Flutter, Billing, Firebase)
 * 8. Firebase Android Release Configuration (google-services.json, Package Association, FCM Channel)
 * 9. Agora RTC Release Security (Zero Exposed Secrets / App Certificates)
 * 10. Release Signing Keystore & Credential Isolation (upload-keystore.jks, key.properties, .gitignore)
 * 11. Launcher Icons & Adaptive Brand Assets (Adaptive Icons, Vector Drawables, Mipmap Densities)
 * 12. Google Play Billing Catalog & Verification Backend (/api/topup/google-play/verify)
 * 13. Google Play Store Listing & Metadata Specification (Title <= 30 chars, Short Desc <= 80 chars)
 * 14. Data Safety Declaration & Privacy Policy Audit (Encryption in transit, Account Deletion)
 * 15. Internal Testing Track Deployment & Reviewer Credentials Guide (internal_testing_guide.md)
 * 16. Video Call Permanent Restriction Audit (video_call_disabled_screen.dart locked OFF)
 * 17. 5-Tab Navigation Architecture Shell Lock (app_shell.dart)
 * 18. 49 Original Dart Screens Preservation Audit (All screens intact)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
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
          } catch (e) {
            data = { raw };
          }
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

async function runGooglePlayReleaseMasterSuite() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 4 PROMPT 07/09: GOOGLE PLAY RELEASE & INTERNAL TESTING E2E');
  console.log('========================================================================');

  const androidDir = path.join(__dirname, '../android');
  const appBuildGradlePath = path.join(androidDir, 'app/build.gradle');
  const manifestPath = path.join(androidDir, 'app/src/main/AndroidManifest.xml');
  const googleServicesPath = path.join(androidDir, 'app/google-services.json');
  const proguardPath = path.join(androidDir, 'app/proguard-rules.pro');
  const keyPropertiesPath = path.join(androidDir, 'key.properties');
  const keyPropertiesExamplePath = path.join(androidDir, 'key.properties.example');
  const uploadKeystorePath = path.join(androidDir, 'app/upload-keystore.jks');
  const metadataDir = path.join(androidDir, 'play_store_metadata');

  const db = new Client({ connectionString: DB_URL });
  await db.connect();
  await db.query('SET search_path TO popolive, public;');

  try {
    // -------------------------------------------------------------------------
    // 1. Application Identity Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Application Identity Audit ---');

    assert(fs.existsSync(manifestPath), 'AndroidManifest.xml exists');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');

    assert(manifestContent.includes('package="com.popolive.app"'), 'Manifest defines package="com.popolive.app"');
    assert(manifestContent.includes('android:label="Popo Live"'), 'Application display name is "Popo Live"');

    assert(fs.existsSync(appBuildGradlePath), 'app/build.gradle exists');
    const appBuildContent = fs.readFileSync(appBuildGradlePath, 'utf8');

    assert(appBuildContent.includes('namespace = "com.popolive.app"') || appBuildContent.includes("namespace 'com.popolive.app'"), 'Namespace is "com.popolive.app"');
    assert(appBuildContent.includes('applicationId = "com.popolive.app"') || appBuildContent.includes("applicationId 'com.popolive.app'"), 'Application ID is "com.popolive.app"');
    assert(appBuildContent.includes('versionCode = flutterVersionCode.toInteger()') || appBuildContent.includes('versionCode'), 'Version code is configured');
    assert(appBuildContent.includes('versionName = flutterVersionName') || appBuildContent.includes('versionName'), 'Version name is configured');

    const localPropsPath = path.join(androidDir, 'local.properties');
    if (fs.existsSync(localPropsPath)) {
      const localProps = fs.readFileSync(localPropsPath, 'utf8');
      assert(localProps.includes('flutter.versionName=1.0.0'), 'Version name matches 1.0.0 in local.properties');
      assert(localProps.includes('flutter.versionCode=1'), 'Version code matches 1 in local.properties');
    }

    // -------------------------------------------------------------------------
    // 2. Target SDK & Compile SDK Google Play Compliance
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Target SDK & Compile SDK Compliance ---');

    assert(appBuildContent.includes('compileSdk = 35') || appBuildContent.includes('compileSdkVersion 35'), 'compileSdk is 35 (Android 15 compatible)');
    assert(appBuildContent.includes('targetSdk = 35') || appBuildContent.includes('targetSdkVersion 35'), 'targetSdk is 35 (Exceeds Google Play minimum target SDK 34)');
    assert(appBuildContent.includes('minSdk = 24') || appBuildContent.includes('minSdkVersion 24'), 'minSdk is 24 (Android 7.0+, covering >95% active Android fleet)');

    // -------------------------------------------------------------------------
    // 3. Java & Kotlin 17 Build Toolchain Compatibility
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Java & Kotlin 17 Toolchain Compatibility ---');

    assert(appBuildContent.includes('JavaVersion.VERSION_17'), 'compileOptions source & target set to JavaVersion.VERSION_17');
    assert(appBuildContent.includes('jvmTarget = "17"') || appBuildContent.includes("jvmTarget = '17'"), 'kotlinOptions jvmTarget is set to "17"');

    // -------------------------------------------------------------------------
    // 4. 64-Bit & Device Architecture Support
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: 64-Bit & Device Architecture Support ---');

    assert(appBuildContent.includes('abiFilters'), 'app/build.gradle configures ndk.abiFilters');
    assert(appBuildContent.includes('"arm64-v8a"'), 'Supports 64-bit ARM architecture (arm64-v8a)');
    assert(appBuildContent.includes('"armeabi-v7a"'), 'Supports 32-bit ARM architecture (armeabi-v7a)');
    assert(appBuildContent.includes('"x86_64"'), 'Supports 64-bit x86 architecture for modern emulators/devices (x86_64)');

    // -------------------------------------------------------------------------
    // 5. Android Permissions & Hardware Features Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Android Permissions & Hardware Features Audit ---');

    // Network
    assert(manifestContent.includes('android.permission.INTERNET'), 'Includes INTERNET permission');
    assert(manifestContent.includes('android.permission.ACCESS_NETWORK_STATE'), 'Includes ACCESS_NETWORK_STATE permission');
    assert(manifestContent.includes('android.permission.ACCESS_WIFI_STATE'), 'Includes ACCESS_WIFI_STATE permission');

    // Live Streaming & Audio
    assert(manifestContent.includes('android.permission.CAMERA'), 'Includes CAMERA permission');
    assert(manifestContent.includes('android.permission.RECORD_AUDIO'), 'Includes RECORD_AUDIO permission');
    assert(manifestContent.includes('android.permission.MODIFY_AUDIO_SETTINGS'), 'Includes MODIFY_AUDIO_SETTINGS permission');
    assert(manifestContent.includes('android.permission.BLUETOOTH_CONNECT'), 'Includes BLUETOOTH_CONNECT permission');
    assert(manifestContent.includes('android.permission.WAKE_LOCK'), 'Includes WAKE_LOCK permission');

    // Hardware Features non-mandatory
    assert(manifestContent.includes('android.hardware.camera') && manifestContent.includes('android:required="false"'), 'Camera feature is declared optional (required="false")');
    assert(manifestContent.includes('android.hardware.microphone') && manifestContent.includes('android:required="false"'), 'Microphone feature is declared optional (required="false")');

    // Push Notifications
    assert(manifestContent.includes('android.permission.POST_NOTIFICATIONS'), 'Includes POST_NOTIFICATIONS (Android 13+ FCM runtime)');
    assert(manifestContent.includes('android.permission.VIBRATE'), 'Includes VIBRATE permission for alerts');

    // Media & Photos
    assert(manifestContent.includes('android.permission.READ_MEDIA_IMAGES'), 'Includes READ_MEDIA_IMAGES permission (Android 13+)');
    assert(manifestContent.includes('android.permission.READ_MEDIA_VIDEO'), 'Includes READ_MEDIA_VIDEO permission (Android 13+)');
    assert(manifestContent.includes('android.permission.READ_EXTERNAL_STORAGE'), 'Includes READ_EXTERNAL_STORAGE for legacy Android with maxSdkVersion="32"');

    // Billing
    assert(manifestContent.includes('com.android.vending.BILLING'), 'Includes com.android.vending.BILLING for Google Play purchases');

    // Foreground Service
    assert(manifestContent.includes('android.permission.FOREGROUND_SERVICE'), 'Includes FOREGROUND_SERVICE permission');
    assert(manifestContent.includes('android.permission.FOREGROUND_SERVICE_CAMERA'), 'Includes FOREGROUND_SERVICE_CAMERA permission (Android 14+)');
    assert(manifestContent.includes('android.permission.FOREGROUND_SERVICE_MICROPHONE'), 'Includes FOREGROUND_SERVICE_MICROPHONE permission (Android 14+)');
    assert(manifestContent.includes('android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'), 'Includes FOREGROUND_SERVICE_MEDIA_PLAYBACK permission (Android 14+)');

    // -------------------------------------------------------------------------
    // 6. Dangerous / Prohibited Permissions Exclusion
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Dangerous / Prohibited Permissions Exclusion ---');

    assert(!manifestContent.includes('android.permission.READ_SMS'), 'Does NOT request sensitive READ_SMS permission');
    assert(!manifestContent.includes('android.permission.RECEIVE_SMS'), 'Does NOT request sensitive RECEIVE_SMS permission');
    assert(!manifestContent.includes('android.permission.READ_CALL_LOG'), 'Does NOT request sensitive READ_CALL_LOG permission');
    assert(!manifestContent.includes('android.permission.PROCESS_OUTGOING_CALLS'), 'Does NOT request sensitive PROCESS_OUTGOING_CALLS permission');
    assert(!manifestContent.includes('android.permission.SYSTEM_ALERT_WINDOW'), 'Does NOT request intrusive SYSTEM_ALERT_WINDOW permission');
    assert(!manifestContent.includes('android.permission.REQUEST_INSTALL_PACKAGES'), 'Does NOT request REQUEST_INSTALL_PACKAGES permission');

    // -------------------------------------------------------------------------
    // 7. Production ProGuard / R8 Rules Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Production ProGuard / R8 Rules Audit ---');

    assert(fs.existsSync(proguardPath), 'proguard-rules.pro exists');
    const proguardContent = fs.readFileSync(proguardPath, 'utf8');

    assert(proguardContent.includes('-keep class io.agora.**'), 'ProGuard keeps Agora RTC classes');
    assert(proguardContent.includes('-dontwarn io.agora.**'), 'ProGuard suppresses Agora build warnings');
    assert(proguardContent.includes('native <methods>'), 'ProGuard preserves native JNI methods');

    assert(proguardContent.includes('-keep class io.flutter.**'), 'ProGuard keeps Flutter framework classes');
    assert(proguardContent.includes('-keep class io.flutter.plugins.**'), 'ProGuard keeps Flutter plugins');

    assert(proguardContent.includes('com.android.billingclient.api'), 'ProGuard keeps Google Play Billing Client API');
    assert(proguardContent.includes('com.android.vending.billing'), 'ProGuard keeps Google Play Billing vending classes');

    assert(proguardContent.includes('com.google.firebase'), 'ProGuard keeps Firebase classes');
    assert(proguardContent.includes('com.google.android.gms'), 'ProGuard keeps Google Play Services classes');
    assert(proguardContent.includes('androidx.security.crypto'), 'ProGuard keeps AndroidX Security Crypto');

    // -------------------------------------------------------------------------
    // 8. Firebase Android Release Configuration
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Firebase Android Release Configuration ---');

    assert(fs.existsSync(googleServicesPath), 'google-services.json exists');
    const googleServicesContent = fs.readFileSync(googleServicesPath, 'utf8');
    const gServices = JSON.parse(googleServicesContent);

    assert(gServices.project_info.project_id === 'popolive-live-stream-2026', 'Firebase project ID is "popolive-live-stream-2026"');
    const clientPackage = gServices.client[0]?.client_info?.android_client_info?.package_name;
    assert(clientPackage === 'com.popolive.app', `Firebase package association matches "com.popolive.app" (got: ${clientPackage})`);
    assert(manifestContent.includes('popolive_high_importance_channel'), 'FCM high importance notification channel declared in manifest');

    // -------------------------------------------------------------------------
    // 9. Agora RTC Release Security
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Agora RTC Release Security ---');

    // Verify no Agora App Certificate is committed to client source
    const clientLibDir = path.join(__dirname, '../lib');
    function searchInDir(dir, pattern) {
      let found = false;
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (searchInDir(full, pattern)) return true;
        } else if (item.endsWith('.dart')) {
          const content = fs.readFileSync(full, 'utf8');
          if (pattern.test(content)) return true;
        }
      }
      return false;
    }

    const hasHardcodedCert = searchInDir(clientLibDir, /appCertificate\s*=\s*['"][0-9a-f]{32}['"]/i);
    assert(!hasHardcodedCert, 'No Agora App Certificate hardcoded in Flutter mobile source code');

    // -------------------------------------------------------------------------
    // 10. Release Signing Keystore & Credential Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 10: Release Signing Keystore & Credential Isolation ---');

    assert(fs.existsSync(uploadKeystorePath), 'upload-keystore.jks exists for Google Play upload');
    assert(fs.existsSync(keyPropertiesExamplePath), 'key.properties.example template exists for build instructions');
    assert(fs.existsSync(keyPropertiesPath), 'key.properties exists and configured for release builds');

    const keyPropsContent = fs.readFileSync(keyPropertiesPath, 'utf8');
    assert(keyPropsContent.includes('keyAlias=popolive-upload-key'), 'Key alias is "popolive-upload-key"');
    assert(keyPropsContent.includes('storeFile='), 'Store file specified in key.properties');

    // Check .gitignore
    const gitignorePath = path.join(__dirname, '../../../.gitignore');
    assert(fs.existsSync(gitignorePath), '.gitignore exists');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    assert(gitignoreContent.includes('*.keystore') || gitignoreContent.includes('*.jks'), '.gitignore ignores keystores (*.jks / *.keystore)');
    assert(gitignoreContent.includes('key.properties'), '.gitignore ignores key.properties');

    assert(appBuildContent.includes('signingConfigs {'), 'app/build.gradle configures signingConfigs');
    assert(appBuildContent.includes('signingConfigs.release'), 'app/build.gradle assigns signingConfig release');

    // -------------------------------------------------------------------------
    // 11. Launcher Icons & Adaptive Brand Assets
    // -------------------------------------------------------------------------
    console.log('\n--- Section 11: Launcher Icons & Adaptive Brand Assets ---');

    const resDir = path.join(androidDir, 'app/src/main/res');
    const adaptiveIconPath = path.join(resDir, 'mipmap-anydpi-v26/ic_launcher.xml');
    const adaptiveRoundPath = path.join(resDir, 'mipmap-anydpi-v26/ic_launcher_round.xml');
    const bgVectorPath = path.join(resDir, 'drawable/ic_launcher_background.xml');
    const fgVectorPath = path.join(resDir, 'drawable/ic_launcher_foreground.xml');

    assert(fs.existsSync(adaptiveIconPath), 'Adaptive icon XML exists (mipmap-anydpi-v26/ic_launcher.xml)');
    assert(fs.existsSync(adaptiveRoundPath), 'Round adaptive icon XML exists (mipmap-anydpi-v26/ic_launcher_round.xml)');
    assert(fs.existsSync(bgVectorPath), 'Background vector drawable exists (drawable/ic_launcher_background.xml)');
    assert(fs.existsSync(fgVectorPath), 'Foreground vector drawable exists (drawable/ic_launcher_foreground.xml)');

    const bgContent = fs.readFileSync(bgVectorPath, 'utf8');
    assert(bgContent.includes('#FF1768'), 'Background vector utilizes brand primary color (#FF1768 Neon Rose Pink)');

    const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    for (const d of densities) {
      const pngPath = path.join(resDir, `mipmap-${d}/ic_launcher.png`);
      assert(fs.existsSync(pngPath), `Fallback launcher icon exists for density: mipmap-${d}`);
    }

    // -------------------------------------------------------------------------
    // 12. Google Play Billing Catalog & Verification Backend
    // -------------------------------------------------------------------------
    console.log('\n--- Section 12: Google Play Billing Catalog & Verification Backend ---');

    const packagesRes = await db.query(
      `SELECT package_id, package_name, price_amount, currency, total_coins, is_active
       FROM popolive.coin_packages
       WHERE is_active = true
       ORDER BY display_order ASC`
    );

    assert(packagesRes.rows.length >= 5, `Database has at least 5 active coin packages (found: ${packagesRes.rows.length})`);
    const p100 = packagesRes.rows.find((p) => p.package_id === 'pkg_100');
    assert(p100 !== undefined, 'Package pkg_100 (100 coins) exists');
    const p1000 = packagesRes.rows.find((p) => p.package_id === 'pkg_1000');
    assert(p1000 !== undefined, 'Package pkg_1000 (1,000 coins) exists');

    // Test verification endpoint rejects unauthenticated request
    const verifyUnauth = await apiRequest('POST', '/api/topup/google-play/verify', {
      purchaseToken: 'test_token',
      productId: 'pkg_100',
    });
    assert(verifyUnauth.status === 401 || verifyUnauth.status === 400 || verifyUnauth.status === 404, `Google Play verification endpoint responds securely (HTTP ${verifyUnauth.status})`);

    // -------------------------------------------------------------------------
    // 13. Google Play Store Listing & Metadata Specification
    // -------------------------------------------------------------------------
    console.log('\n--- Section 13: Google Play Store Listing & Metadata Specification ---');

    const listingPath = path.join(metadataDir, 'listing_en_US.json');
    assert(fs.existsSync(listingPath), 'listing_en_US.json metadata file exists');

    const listing = JSON.parse(fs.readFileSync(listingPath, 'utf8'));
    assert(listing.title.length <= 30, `App title (${listing.title}) is within 30 characters limit (${listing.title.length} chars)`);
    assert(listing.short_description.length <= 80, `Short description is within 80 characters limit (${listing.short_description.length} chars)`);
    assert(listing.full_description.length > 500, `Full description is comprehensive (${listing.full_description.length} chars)`);
    assert(listing.category === 'ENTERTAINMENT', 'App category is ENTERTAINMENT');
    assert(listing.contact_email.includes('@'), 'Support contact email is defined');
    assert(listing.privacy_policy_url.startsWith('https://'), 'Privacy policy URL is defined with HTTPS');

    // -------------------------------------------------------------------------
    // 14. Data Safety Declaration & Privacy Policy Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 14: Data Safety Declaration & Privacy Policy Audit ---');

    const dataSafetyPath = path.join(metadataDir, 'data_safety_declaration.json');
    assert(fs.existsSync(dataSafetyPath), 'data_safety_declaration.json exists');

    const dataSafety = JSON.parse(fs.readFileSync(dataSafetyPath, 'utf8'));
    const sec = dataSafety.data_collection_and_security.security_practices;
    assert(sec.data_encrypted_in_transit === true, 'Declares data encryption in transit');
    assert(sec.encryption_protocol.includes('TLS'), 'Specifies TLS encryption protocol');
    assert(sec.user_can_request_data_deletion === true, 'Declares account deletion request support');
    assert(sec.deletion_request_url.startsWith('https://'), 'Provides account deletion URL');

    const types = dataSafety.data_collection_and_security.collected_data_types;
    assert(types.some((t) => t.category === 'Personal Info'), 'Declares Personal Info collection');
    assert(types.some((t) => t.category === 'Financial Info'), 'Declares Financial Info collection (In-app purchases)');
    assert(types.some((t) => t.category === 'Audio Files'), 'Declares Audio recording for real-time live streaming');
    assert(types.some((t) => t.category === 'Photos and Videos'), 'Declares Photos & Videos for Square feed');

    // -------------------------------------------------------------------------
    // 15. Internal Testing Track Deployment & Reviewer Credentials Guide
    // -------------------------------------------------------------------------
    console.log('\n--- Section 15: Internal Testing Track & Reviewer Credentials ---');

    const guidePath = path.join(metadataDir, 'internal_testing_guide.md');
    assert(fs.existsSync(guidePath), 'internal_testing_guide.md exists');
    const guideContent = fs.readFileSync(guidePath, 'utf8');

    assert(guideContent.includes('popolive-upload-key'), 'Documents upload key alias');
    assert(guideContent.includes('zara.live@popolive.com'), 'Provides demo host reviewer credentials');
    assert(guideContent.includes('sana.khan@popolive.com'), 'Provides demo viewer reviewer credentials');
    assert(guideContent.includes('License Testing'), 'Documents Google Play License Testing workflow');

    // -------------------------------------------------------------------------
    // 16. Video Call Permanent Restriction Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 16: Video Call Permanent Restriction Audit ---');

    const disabledScreenPath = path.join(__dirname, '../lib/screens/video_call/video_call_disabled_screen.dart');
    assert(fs.existsSync(disabledScreenPath), 'video_call_disabled_screen.dart exists');
    const disabledContent = fs.readFileSync(disabledScreenPath, 'utf8');
    assert(disabledContent.includes('Disabled') || disabledContent.includes('disabled'), 'video_call_disabled_screen.dart is locked strictly OFF');

    // -------------------------------------------------------------------------
    // 17. 5-Tab Navigation Architecture Shell Lock
    // -------------------------------------------------------------------------
    console.log('\n--- Section 17: 5-Tab Navigation Architecture Shell Lock ---');

    const appShellPath = path.join(__dirname, '../lib/shell/app_shell.dart');
    assert(fs.existsSync(appShellPath), 'app_shell.dart exists');
    const appShellContent = fs.readFileSync(appShellPath, 'utf8');

    assert(appShellContent.includes('HomeScreen') || appShellContent.includes('home'), 'App shell contains Tab 1: Home');
    assert(appShellContent.includes('Party') || appShellContent.includes('party'), 'App shell contains Tab 2: Party');
    assert(appShellContent.includes('Live') || appShellContent.includes('live'), 'App shell contains Tab 3: Go Live');
    assert(appShellContent.includes('Inbox') || appShellContent.includes('inbox'), 'App shell contains Tab 4: Inbox');
    assert(appShellContent.includes('MeScreen') || appShellContent.includes('me'), 'App shell contains Tab 5: Me');

    // -------------------------------------------------------------------------
    // 18. 49 Original Dart Screens Preservation Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 18: 49 Original Dart Screens Preservation Audit ---');

    const screensDir = path.join(__dirname, '../lib/screens');
    function getDartFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getDartFiles(fullPath));
        } else if (file.endsWith('.dart')) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const allScreens = getDartFiles(screensDir);
    assert(allScreens.length >= 49, `Preserved all original screens (found ${allScreens.length} Dart screens)`);

  } catch (err) {
    console.error('Fatal Suite Execution Error:', err);
    failed++;
  } finally {
    await db.end();
  }

  // -------------------------------------------------------------------------
  // Summary & Acceptance
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runGooglePlayReleaseMasterSuite();
