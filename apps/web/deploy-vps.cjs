const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to VPS 169.58.50.184 via ssh2...');

conn.on('ready', () => {
  console.log('✅ SSH connected to production VPS as root.');

  const cmd = `
    set -e
    cd /var/www/popo-live
    echo "--- 1. Pulling latest code from origin main ---"
    git checkout -- apps/web/data/consents.json || true
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
});
