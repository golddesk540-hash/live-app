/**
 * Master Verification Suite: M9 Apple App Store Integration, iOS Release Configuration & TestFlight Testing
 * Phase 4 Prompt 08/09
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

function makeRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: endpoint,
        method: method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runVerification() {
  console.log('\n===============================================================');
  console.log('POPO LIVE — M9 APPLE APP STORE & TESTFLIGHT VERIFICATION SUITE');
  console.log('===============================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const iosDir = path.join(rootDir, 'ios');

  // ---------------------------------------------------------------------------
  // 1. Xcode Project Structure & Identity
  // ---------------------------------------------------------------------------
  console.log('--- 1. Apple Application Identity & Xcode Project Structure ---');
  const pbxprojPath = path.join(iosDir, 'Runner.xcodeproj', 'project.pbxproj');
  assert(fs.existsSync(pbxprojPath), 'Runner.xcodeproj/project.pbxproj exists');

  if (fs.existsSync(pbxprojPath)) {
    const pbxproj = fs.readFileSync(pbxprojPath, 'utf8');
    assert(pbxproj.includes('com.popolive.app'), 'project.pbxproj declares Bundle ID "com.popolive.app"');
    assert(pbxproj.includes('IPHONEOS_DEPLOYMENT_TARGET = 14.0'), 'project.pbxproj specifies deployment target iOS 14.0');
    assert(pbxproj.includes('TARGETED_DEVICE_FAMILY = "1,2"'), 'project.pbxproj targets both iPhone (1) and iPad (2)');
    assert(pbxproj.includes('SWIFT_VERSION = 5.0'), 'project.pbxproj configures Swift 5.0');
    assert(pbxproj.includes('Runner/Info.plist'), 'project.pbxproj references Runner/Info.plist');
    assert(pbxproj.includes('Runner/Runner.entitlements'), 'project.pbxproj references Runner/Runner.entitlements');
    assert(pbxproj.includes('AppIcon'), 'project.pbxproj references AppIcon asset catalog');
  }

  const workspacePath = path.join(iosDir, 'Runner.xcworkspace', 'contents.xcworkspacedata');
  assert(fs.existsSync(workspacePath), 'Runner.xcworkspace/contents.xcworkspacedata exists');

  const generatedConfigPath = path.join(iosDir, 'Flutter', 'Generated.xcconfig');
  assert(fs.existsSync(generatedConfigPath), 'Flutter/Generated.xcconfig exists');
  if (fs.existsSync(generatedConfigPath)) {
    const genConfig = fs.readFileSync(generatedConfigPath, 'utf8');
    assert(genConfig.includes('FLUTTER_BUILD_NAME=1.0.0'), 'Flutter build name is 1.0.0');
    assert(genConfig.includes('FLUTTER_BUILD_NUMBER=1'), 'Flutter build number is 1');
  }

  const debugConfigPath = path.join(iosDir, 'Flutter', 'Debug.xcconfig');
  const releaseConfigPath = path.join(iosDir, 'Flutter', 'Release.xcconfig');
  assert(fs.existsSync(debugConfigPath), 'Flutter/Debug.xcconfig exists');
  assert(fs.existsSync(releaseConfigPath), 'Flutter/Release.xcconfig exists');

  const appFrameworkInfoPath = path.join(iosDir, 'Flutter', 'AppFrameworkInfo.plist');
  assert(fs.existsSync(appFrameworkInfoPath), 'Flutter/AppFrameworkInfo.plist exists');
  if (fs.existsSync(appFrameworkInfoPath)) {
    const appFmwk = fs.readFileSync(appFrameworkInfoPath, 'utf8');
    assert(appFmwk.includes('14.0'), 'AppFrameworkInfo.plist specifies MinimumOSVersion 14.0');
  }

  // Storyboards & Assets
  const launchStoryboardPath = path.join(iosDir, 'Runner', 'Base.lproj', 'LaunchScreen.storyboard');
  const mainStoryboardPath = path.join(iosDir, 'Runner', 'Base.lproj', 'Main.storyboard');
  assert(fs.existsSync(launchStoryboardPath), 'Base.lproj/LaunchScreen.storyboard exists');
  assert(fs.existsSync(mainStoryboardPath), 'Base.lproj/Main.storyboard exists');

  const appIconContentsPath = path.join(iosDir, 'Runner', 'Assets.xcassets', 'AppIcon.appiconset', 'Contents.json');
  const launchImageContentsPath = path.join(iosDir, 'Runner', 'Assets.xcassets', 'LaunchImage.imageset', 'Contents.json');
  assert(fs.existsSync(appIconContentsPath), 'Assets.xcassets/AppIcon.appiconset/Contents.json exists');
  assert(fs.existsSync(launchImageContentsPath), 'Assets.xcassets/LaunchImage.imageset/Contents.json exists');

  // ---------------------------------------------------------------------------
  // 2. Info.plist Permissions & Privacy Audit
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Info.plist Permissions, Privacy & Export Compliance ---');
  const infoPlistPath = path.join(iosDir, 'Runner', 'Info.plist');
  assert(fs.existsSync(infoPlistPath), 'Runner/Info.plist exists');

  if (fs.existsSync(infoPlistPath)) {
    const infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
    assert(infoPlist.includes('com.popolive.app'), 'Info.plist CFBundleIdentifier is com.popolive.app');
    assert(infoPlist.includes('Popo Live'), 'Info.plist CFBundleDisplayName is "Popo Live"');
    assert(infoPlist.includes('NSCameraUsageDescription'), 'NSCameraUsageDescription is declared');
    assert(!infoPlist.includes('video calls'), 'NSCameraUsageDescription strictly avoids "video calls" (invariant compliance)');
    assert(infoPlist.includes('NSMicrophoneUsageDescription'), 'NSMicrophoneUsageDescription is declared');
    assert(infoPlist.includes('NSPhotoLibraryUsageDescription'), 'NSPhotoLibraryUsageDescription is declared');
    assert(infoPlist.includes('NSPhotoLibraryAddUsageDescription'), 'NSPhotoLibraryAddUsageDescription is declared');
    assert(infoPlist.includes('<string>audio</string>'), 'UIBackgroundModes includes "audio"');
    assert(infoPlist.includes('<string>fetch</string>'), 'UIBackgroundModes includes "fetch"');
    assert(infoPlist.includes('<string>remote-notification</string>'), 'UIBackgroundModes includes "remote-notification"');
    assert(infoPlist.includes('ITSAppUsesNonExemptEncryption'), 'ITSAppUsesNonExemptEncryption is declared');
    assert(infoPlist.includes('popolive'), 'CFBundleURLSchemes registers "popolive"');
  }

  // ---------------------------------------------------------------------------
  // 3. Apple Capabilities, APNs & Entitlements
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Apple Capabilities, APNs & Entitlements ---');
  const entitlementsPath = path.join(iosDir, 'Runner', 'Runner.entitlements');
  assert(fs.existsSync(entitlementsPath), 'Runner.entitlements exists');
  if (fs.existsSync(entitlementsPath)) {
    const ent = fs.readFileSync(entitlementsPath, 'utf8');
    assert(ent.includes('aps-environment'), 'Runner.entitlements declares aps-environment');
    assert(ent.includes('com.apple.developer.applesignin'), 'Runner.entitlements declares Sign in with Apple');
  }

  const googleServiceIosPath = path.join(iosDir, 'Runner', 'GoogleService-Info.plist');
  assert(fs.existsSync(googleServiceIosPath), 'Runner/GoogleService-Info.plist exists');
  if (fs.existsSync(googleServiceIosPath)) {
    const gs = fs.readFileSync(googleServiceIosPath, 'utf8');
    assert(gs.includes('com.popolive.app'), 'GoogleService-Info.plist BUNDLE_ID is com.popolive.app');
  }

  const appDelegatePath = path.join(iosDir, 'Runner', 'AppDelegate.swift');
  assert(fs.existsSync(appDelegatePath), 'Runner/AppDelegate.swift exists');
  if (fs.existsSync(appDelegatePath)) {
    const appDel = fs.readFileSync(appDelegatePath, 'utf8');
    assert(appDel.includes('UNUserNotificationCenter'), 'AppDelegate sets UNUserNotificationCenter delegate');
    assert(appDel.includes('registerForRemoteNotifications'), 'AppDelegate calls registerForRemoteNotifications');
  }

  // ---------------------------------------------------------------------------
  // 4. CocoaPods & Podfile Deployment Target & Permissions
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. CocoaPods & Podfile Configuration ---');
  const podfilePath = path.join(iosDir, 'Podfile');
  assert(fs.existsSync(podfilePath), 'Podfile exists');
  if (fs.existsSync(podfilePath)) {
    const podfile = fs.readFileSync(podfilePath, 'utf8');
    assert(podfile.includes("platform :ios, '14.0'"), "Podfile platform target is '14.0'");
    assert(podfile.includes('use_frameworks!'), 'Podfile enables use_frameworks!');
    assert(podfile.includes('use_modular_headers!'), 'Podfile enables use_modular_headers!');
    assert(podfile.includes('PERMISSION_CAMERA=1'), 'Podfile post_install defines PERMISSION_CAMERA=1');
    assert(podfile.includes('PERMISSION_MICROPHONE=1'), 'Podfile post_install defines PERMISSION_MICROPHONE=1');
    assert(podfile.includes('PERMISSION_PHOTOS=1'), 'Podfile post_install defines PERMISSION_PHOTOS=1');
    assert(podfile.includes('PERMISSION_NOTIFICATIONS=1'), 'Podfile post_install defines PERMISSION_NOTIFICATIONS=1');
  }

  // ---------------------------------------------------------------------------
  // 5. Apple In-App Purchases & Backend Verification Engine
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Apple In-App Purchases & Backend Verification Route ---');
  const inAppBillingServicePath = path.join(rootDir, 'lib', 'services', 'wallet', 'in_app_billing_service.dart');
  assert(fs.existsSync(inAppBillingServicePath), 'in_app_billing_service.dart exists');
  if (fs.existsSync(inAppBillingServicePath)) {
    const billingCode = fs.readFileSync(inAppBillingServicePath, 'utf8');
    assert(billingCode.includes('_iosProductMap'), 'InAppBillingService defines _iosProductMap');
    assert(billingCode.includes('com.popolive.coins.100'), 'Maps pkg_100 to com.popolive.coins.100');
    assert(billingCode.includes('com.popolive.coins.500'), 'Maps pkg_500 to com.popolive.coins.500');
    assert(billingCode.includes('com.popolive.coins.1000'), 'Maps pkg_1000 to com.popolive.coins.1000');
    assert(billingCode.includes('com.popolive.coins.5000'), 'Maps pkg_5000 to com.popolive.coins.5000');
    assert(billingCode.includes('com.popolive.coins.10000'), 'Maps pkg_10000 to com.popolive.coins.10000');
    assert(billingCode.includes("Platform.isIOS ? 'apple_iap'"), 'Selects apple_iap provider on iOS');
  }

  // Test backend packages API
  try {
    const pkgRes = await makeRequest('GET', '/api/topup/packages');
    assert(pkgRes.status === 200, 'GET /api/topup/packages returns HTTP 200');
    assert(pkgRes.body.success === true, 'GET /api/topup/packages returns success: true');
    assert(Array.isArray(pkgRes.body.packages), 'Packages array returned');
    
    const pkgs = pkgRes.body.packages || [];
    const p100 = pkgs.find((p) => p.packageId === 'pkg_100');
    assert(p100 && p100.platformProductIdIos === 'com.popolive.coins.100', 'pkg_100 has platformProductIdIos "com.popolive.coins.100"');
    const p1000 = pkgs.find((p) => p.packageId === 'pkg_1000');
    assert(p1000 && p1000.platformProductIdIos === 'com.popolive.coins.1000', 'pkg_1000 has platformProductIdIos "com.popolive.coins.1000"');
  } catch (err) {
    assert(false, `GET /api/topup/packages error: ${err.message}`);
  }

  // Test backend methods API for iOS
  try {
    const methRes = await makeRequest('GET', '/api/topup/methods?platform=ios');
    assert(methRes.status === 200, 'GET /api/topup/methods?platform=ios returns HTTP 200');
    const providers = methRes.body.providers || [];
    const appleProvider = providers.find((p) => p.providerKey === 'apple_iap');
    assert(appleProvider !== undefined, 'apple_iap provider is available for iOS');
    assert(appleProvider.supportedPlatforms.includes('ios'), 'apple_iap supports ios platform');
  } catch (err) {
    assert(false, `GET /api/topup/methods?platform=ios error: ${err.message}`);
  }

  // Test POST /api/topup/apple/verify with empty payload
  try {
    const emptyRes = await makeRequest('POST', '/api/topup/apple/verify', {});
    assert(emptyRes.status === 400, 'POST /api/topup/apple/verify rejects empty payload with HTTP 400');
    assert(emptyRes.body.errorCode === 'RECEIPT_REQUIRED', 'Returns errorCode RECEIPT_REQUIRED');
  } catch (err) {
    assert(false, `POST /api/topup/apple/verify empty test error: ${err.message}`);
  }

  // Test POST /api/topup/apple/verify with tampered client parameters
  try {
    const tamperRes = await makeRequest('POST', '/api/topup/apple/verify', {
      transactionId: 'test_apple_tx_123',
      totalCoins: 9999999,
      amount: 0.01,
    });
    assert(tamperRes.status === 400, 'POST /api/topup/apple/verify rejects tampered keys with HTTP 400');
    assert(tamperRes.body.errorCode === 'TAMPERING_DETECTED', 'Returns errorCode TAMPERING_DETECTED');
  } catch (err) {
    assert(false, `POST /api/topup/apple/verify tamper test error: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // 6. App Store Connect Metadata & Review Guidelines Compliance
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. App Store Metadata & Review Guidelines Compliance ---');
  const metadataDir = path.join(iosDir, 'app_store_metadata');
  assert(fs.existsSync(metadataDir), 'ios/app_store_metadata directory exists');

  const listingPath = path.join(metadataDir, 'listing_en_US.json');
  assert(fs.existsSync(listingPath), 'listing_en_US.json exists');
  if (fs.existsSync(listingPath)) {
    const listing = JSON.parse(fs.readFileSync(listingPath, 'utf8'));
    assert(listing.name === 'Popo Live', 'App Store Name is "Popo Live"');
    assert(listing.name.length <= 30, 'App Store Name length <= 30 chars');
    assert(listing.subtitle.length <= 30, 'App Store Subtitle length <= 30 chars');
    assert(listing.promotional_text.length <= 170, 'Promotional text length <= 170 chars');
    assert(listing.keywords.length <= 100, 'Keywords string length <= 100 chars');
    assert(listing.primary_category === 'ENTERTAINMENT', 'Primary category is ENTERTAINMENT');
    assert(listing.secondary_category === 'SOCIAL_NETWORKING', 'Secondary category is SOCIAL_NETWORKING');
    assert(listing.content_rating === '17+', 'Content rating is 17+');
    assert(listing.support_url.startsWith('https://'), 'Support URL is valid HTTPS');
    assert(listing.privacy_policy_url.startsWith('https://'), 'Privacy policy URL is valid HTTPS');

    // Reviewer Accounts
    const notes = listing.app_store_review_notes;
    assert(notes.demo_host_account.email === 'zara.live@popolive.com', 'Demo host reviewer email is zara.live@popolive.com');
    assert(notes.demo_viewer_account.email === 'sana.khan@popolive.com', 'Demo viewer reviewer email is sana.khan@popolive.com');
  }

  const privacyLabelPath = path.join(metadataDir, 'app_privacy_nutrition_label.json');
  assert(fs.existsSync(privacyLabelPath), 'app_privacy_nutrition_label.json exists');
  if (fs.existsSync(privacyLabelPath)) {
    const privacy = JSON.parse(fs.readFileSync(privacyLabelPath, 'utf8'));
    assert(privacy.data_tracking.tracks_users === false, 'App declares tracks_users = false');
    assert(Array.isArray(privacy.data_collection) && privacy.data_collection.length >= 4, 'Data collection categories declared');
    assert(privacy.security_and_compliance.account_deletion_flow.supported === true, 'App Store Guideline 5.1.1(v) Account Deletion is supported');
    assert(privacy.security_and_compliance.ugc_moderation.supported === true, 'App Store Guideline 1.2 UGC Moderation is supported');
  }

  const testFlightGuidePath = path.join(metadataDir, 'testflight_testing_guide.md');
  assert(fs.existsSync(testFlightGuidePath), 'testflight_testing_guide.md exists');
  if (fs.existsSync(testFlightGuidePath)) {
    const guide = fs.readFileSync(testFlightGuidePath, 'utf8');
    assert(guide.includes('Windows 11') || guide.includes('Windows'), 'Accurately documents Windows host environment limitation');
    assert(guide.includes('flutter build ipa'), 'Includes macOS / CI command "flutter build ipa"');
    assert(guide.includes('xcrun altool'), 'Includes TestFlight upload command "xcrun altool"');
    assert(guide.includes('zara.live@popolive.com'), 'Includes Zara Live reviewer credentials');
    assert(guide.includes('sana.khan@popolive.com'), 'Includes Sana Khan reviewer credentials');
  }

  const exportOptionsPath = path.join(iosDir, 'ExportOptions.plist');
  assert(fs.existsSync(exportOptionsPath), 'ios/ExportOptions.plist exists');
  if (fs.existsSync(exportOptionsPath)) {
    const exp = fs.readFileSync(exportOptionsPath, 'utf8');
    assert(exp.includes('<string>app-store</string>'), 'ExportOptions method is "app-store"');
  }

  // ---------------------------------------------------------------------------
  // 7. Core Architectural Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. Core Architectural Invariants ---');
  const disabledCallScreenPath = path.join(rootDir, 'lib', 'screens', 'video_call', 'video_call_disabled_screen.dart');
  assert(fs.existsSync(disabledCallScreenPath), 'video_call_disabled_screen.dart exists');
  if (fs.existsSync(disabledCallScreenPath)) {
    const disabledCode = fs.readFileSync(disabledCallScreenPath, 'utf8');
    assert(disabledCode.includes('Video calls are turned off'), 'Video calls strictly disabled banner present ("Video calls are turned off")');
    assert(!disabledCode.includes('AgoraRtcEngine.startVideoCall'), 'No Agora direct 1v1 video call initiation');
  }

  const appShellPath = path.join(rootDir, 'lib', 'shell', 'app_shell.dart');
  assert(fs.existsSync(appShellPath), 'app_shell.dart exists');
  if (fs.existsSync(appShellPath)) {
    const shellCode = fs.readFileSync(appShellPath, 'utf8');
    assert(shellCode.includes('PopoBottomNavigation'), 'Main navigation bar present (PopoBottomNavigation)');
    assert(shellCode.includes('ExploreHomeScreen'), 'Tab 0 is ExploreHomeScreen (Home)');
    assert(shellCode.includes('PartyDiscoveryScreen'), 'Tab 1 is PartyDiscoveryScreen (Party)');
    assert(shellCode.includes('GoLiveGateScreen'), 'Tab 2 is GoLiveGateScreen (Go Live)');
    assert(shellCode.includes('InboxScreen'), 'Tab 3 is InboxScreen (Inbox)');
    assert(shellCode.includes('MeScreen'), 'Tab 4 is MeScreen (Me)');
  }

  // Check 49 original screens preservation
  const screensDir = path.join(rootDir, 'lib', 'screens');
  function countDartFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) count += countDartFiles(full);
      else if (e.name.endsWith('.dart')) count++;
    }
    return count;
  }
  const screenCount = countDartFiles(screensDir);
  assert(screenCount >= 49, `Original Dart screens preserved (found ${screenCount} screens, >= 49 required)`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  if (failedTests > 0) {
    console.error(`FAILED: ${failedTests} tests failed.`);
    process.exit(1);
  } else {
    console.log('ALL TESTS PASSED SUCCESSFULLY! 100% PASS RATE');
    console.log('===============================================================\n');
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
