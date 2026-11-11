const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to VPS 169.58.50.184 via ssh2...');

conn.on('ready', () => {
  console.log('✅ SSH connected to production VPS as root.');

  const cmd = `
    set -e
    cd /var/www/popo-live
    echo "--- 1. Pulling latest code from origin main ---"
    git checkout -- apps/web/data/consents.json apps/web/package-lock.json || true
    git pull origin main
    
    cd /var/www/popo-live/apps/web
    echo "--- 2. Applying Migrations on VPS ---"
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_017.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_018.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_019.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_020.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_021.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_022.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_023.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_024.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_025.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_026.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_027.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_028.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_029.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_030.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_031.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_032.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_033.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_034.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_035.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_036.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_037.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_038.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_039.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_040.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_041.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_042.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_043.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_044.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_045.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_046.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_047.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_048.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_049.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node apply_050.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node reset_canonical_battle.cjs
    DATABASE_URL="postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive" node update_room_7001.cjs
    
    echo "--- 3. Installing dependencies & Rebuilding Next.js on VPS ---"
    npm install
    npm run build
    
    echo "--- 4. Reloading PM2 process 'popo-live' ---"
    pm2 restart popo-live
    
    echo "--- 5. Verifying local endpoints on VPS ---"
    sleep 3
    curl -s -I http://127.0.0.1:3005/live/room/880219?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/live/viewer/session?preview=demo | head -n 10
    curl -s -I http://127.0.0.1:3005/live/chat?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/live/chat/messages?preview=demo | head -n 10
    curl -s -I http://127.0.0.1:3005/live/safety?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/live/safety/block | head -n 10
    curl -s -I http://127.0.0.1:3005/live/web-watch?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/live/web-studio?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/live/web-watch/rooms | head -n 10
    curl -s http://127.0.0.1:3005/api/live/web-watch/session?roomId=880219 | head -n 10
    curl -s -I http://127.0.0.1:3005/live/end-screen?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/live/center?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/live/end-screen/summary?roomId=880219 | head -n 10
    curl -s http://127.0.0.1:3005/api/live/center/history | head -n 10
    curl -s -I http://127.0.0.1:3005/live/quality?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/live/cost-guard?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/live/quality/settings?roomId=880219 | head -n 10
    curl -s http://127.0.0.1:3005/api/live/quality/network-stats?roomId=880219 | head -n 10
    curl -s -I http://127.0.0.1:3005/live/rules?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/live/host-rules?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/live/rules | head -n 10
    curl -s http://127.0.0.1:3005/api/live/rules/status?hostId=8802194 | head -n 10
    curl -s -I http://127.0.0.1:3005/party/create?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/party/categories | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"title":"VPS Deploy Party","categoryId":"chill_chat","roomType":"public"}' http://127.0.0.1:3005/api/party/create?preview=demo | head -n 10
    curl -s -I http://127.0.0.1:3005/party/room/7001?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/party/7001/seats | head -n 10
    curl -s http://127.0.0.1:3005/api/party/7001/seats/status | head -n 10
    curl -s http://127.0.0.1:3005/api/party/7001/seats/requests | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"seatNumber":2,"type":"mic","enabled":true}' http://127.0.0.1:3005/api/party/7001/seats/media/toggle | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"seatNumber":2,"action":"host_mute","isHostAction":true}' http://127.0.0.1:3005/api/party/7001/seats/media/moderate | head -n 10
    curl -s "http://127.0.0.1:3005/api/party/7001/seats/media/token?seatNumber=2&role=publisher" | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"seatNumber":2,"type":"mic","enabled":true}' http://127.0.0.1:3005/api/party/7001/seats/media/toggle | head -n 10
    curl -s http://127.0.0.1:3005/api/party/7001/audience | head -n 10
    curl -s http://127.0.0.1:3005/api/party/7001/chat/messages | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"senderId":"vps_test","senderName":"VPS Test","messageText":"VPS chat verified 🚀"}' http://127.0.0.1:3005/api/party/7001/chat/send | head -n 10
    curl -s http://127.0.0.1:3005/api/party/themes | head -n 10
    curl -s http://127.0.0.1:3005/api/party/7001/theme | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"themeId":"galaxy","isHostAction":true,"userId":"host_maria"}' http://127.0.0.1:3005/api/party/7001/theme/apply | head -n 10
    curl -s -I http://127.0.0.1:3005/party/themes?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/party/7001/web-info | head -n 10
    curl -s -I http://127.0.0.1:3005/party/web?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/party/web/7001 | head -n 5
    curl -s -I http://127.0.0.1:3005/party/order-closing?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/party/room/7001/order-closing | head -n 5
    curl -s -X POST -H "Content-Type: application/json" -d '{"fromSeat":2,"toSeat":3,"isHostAction":true}' http://127.0.0.1:3005/api/party/7001/seats/reorder | head -n 10
    curl -s http://127.0.0.1:3005/api/party/7001/status | head -n 10
    curl -s -I http://127.0.0.1:3005/party/limits?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/party/room/7001/limits | head -n 5
    curl -s http://127.0.0.1:3005/api/party/7001/limits | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"audienceLimit":1000,"joinRequestsEnabled":true,"isHostAction":true}' http://127.0.0.1:3005/api/party/7001/limits | head -n 10
    curl -s -I http://127.0.0.1:3005/party/rules?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/party/room/7001/rules | head -n 5
    curl -s http://127.0.0.1:3005/api/party/7001/rules | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"userId":"vps_deploy_viewer","policyVersion":"v1.0"}' http://127.0.0.1:3005/api/party/7001/rules/accept | head -n 10
    curl -s -I http://127.0.0.1:3005/pk/battle-types?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/pk/room/7001/battle-types?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/pk/battle-types | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"battleTypeId":"1v1","roomId":"7001","selectedBy":"vps_deploy_host"}' http://127.0.0.1:3005/api/pk/battle-types/select | head -n 10
    curl -s -X POST -H "Content-Type: application/json" -d '{"battleTypeId":"4_host","roomId":"7001","selectedBy":"vps_deploy_host"}' http://127.0.0.1:3005/api/pk/battle-types/select | head -n 10
    curl -s "http://127.0.0.1:3005/api/pk/battle-types/session?roomId=7001" | head -n 10
    curl -s -I http://127.0.0.1:3005/pk/start?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/pk/room/7001/start?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/pk/hosts | head -n 10
    curl -s -X POST http://127.0.0.1:3005/api/pk/test-reset | head -n 5
    curl -s -I http://127.0.0.1:3005/pk/reactions?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/pk/battle/00000000-0000-0000-0000-000000000603/reaction/catalog | head -n 10
    curl -s http://127.0.0.1:3005/api/pk/battle/00000000-0000-0000-0000-000000000603/reaction/counters | head -n 10
    curl -s -I http://127.0.0.1:3005/pk/fair-play?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/pk/security/rules | head -n 10
    curl -s http://127.0.0.1:3005/api/pk/security/report/categories | head -n 10
    curl -s -I http://127.0.0.1:3005/pk/gifts?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/pk/battle/00000000-0000-0000-0000-000000000603/gifts?preview=demo | head -n 5
    curl -s http://127.0.0.1:3005/api/pk/battle/00000000-0000-0000-0000-000000000603/gifts/catalog | head -n 10
    curl -s http://127.0.0.1:3005/api/pk/battle/00000000-0000-0000-0000-000000000603/gifts/wallet | head -n 10
    curl -s -I http://127.0.0.1:3005/wallet?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/wallet/coin-history?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/wallet/points-history?preview=demo | head -n 5
    curl -s "http://127.0.0.1:3005/api/wallet/balance?userId=user_wallet_demo_701&preview=demo" | head -n 10
    curl -s "http://127.0.0.1:3005/api/wallet/coins/history?userId=user_wallet_demo_701&preview=demo" | head -n 10
    curl -s "http://127.0.0.1:3005/api/wallet/points/history?userId=user_wallet_demo_701&preview=demo" | head -n 10
    curl -s -I http://127.0.0.1:3005/gifts?preview=demo | head -n 5
    curl -s -I http://127.0.0.1:3005/admin/gifts | head -n 5
    curl -s "http://127.0.0.1:3005/api/gifts/catalog" | head -n 10
    curl -s "http://127.0.0.1:3005/api/gifts/categories" | head -n 10
    curl -s "http://127.0.0.1:3005/api/gifts/popular" | head -n 10
    curl -s "http://127.0.0.1:3005/api/gifts/new" | head -n 10
    curl -s "http://127.0.0.1:3005/api/gifts/featured" | head -n 10
    curl -s "http://127.0.0.1:3005/api/gifts/search?q=Rose" | head -n 10
    curl -s -I http://127.0.0.1:3005/gifts/send?preview=demo | head -n 5
    curl -s "http://127.0.0.1:3005/api/gifts/send/context?pkBattleId=00000000-0000-0000-0000-000000000603&preview=demo" | head -n 10
    curl -s "http://127.0.0.1:3005/api/gifts/send/context?roomId=880219&preview=demo" | head -n 10
    curl -s -I http://127.0.0.1:3005/animations?preview=demo | head -n 5
    curl -s "http://127.0.0.1:3005/api/animations/config?roomId=880219&preview=demo" | head -n 10
    curl -s -I "http://127.0.0.1:3005/earnings?preview=demo" | head -n 5
    curl -s "http://127.0.0.1:3005/api/earnings/dashboard?preview=demo" | head -n 10
    curl -s -I "http://127.0.0.1:3005/recharge?preview=demo" | head -n 5
    curl -s -I "http://127.0.0.1:3005/topup?preview=demo" | head -n 5
    curl -s "http://127.0.0.1:3005/api/topup/packages" | head -n 10
    curl -s "http://127.0.0.1:3005/api/topup/methods" | head -n 10
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE ON CONTABO VPS!"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', (data) => {
      process.stdout.write(data);
    });
    stream.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
    stream.on('close', (code) => {
      console.log(`\nRemote execution closed with exit code: ${code}`);
      conn.end();
      process.exit(code);
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Failed:', err.message);
  process.exit(1);
}).connect({
  host: '169.58.50.184',
  port: 22,
  username: 'root',
  password: 'Iftkharzaman',
  readyTimeout: 30000,
  keepaliveInterval: 10000,
});
