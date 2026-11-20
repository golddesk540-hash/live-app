const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to VPS 169.58.50.184 (EU Contabo) as root...');

conn.on('ready', () => {
  console.log('✅ SSH CONNECTED TO VPS AS ROOT!');

  // Build and reload
  const cmd = `
    set -e
    echo "=== STEP 1: VERIFYING REPO STATUS ==="
    cd /var/www/popo-live
    git log -n 1 --oneline

    echo "=== STEP 2: BUILDING APPS/API ==="
    cd /var/www/popo-live/apps/api
    npm run build || npx tsc

    echo "=== STEP 3: BUILDING APPS/WEB ==="
    cd /var/www/popo-live/apps/web
    npm run build

    echo "=== STEP 4: RELOADING PM2 (kigolive) ==="
    pm2 reload kigolive || pm2 restart kigolive
    pm2 save

    echo "=== STEP 5: VERIFYING RUNNING PROCESSES & ENDPOINTS ==="
    pm2 status
    sleep 3
    curl -I http://127.0.0.1:3005/
    curl -I http://127.0.0.1:3005/api/admin/monitoring/metrics || true

    echo "=== 🚀 VPS DEPLOYMENT LIVE & VERIFIED ==="
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Execution error:', err);
      conn.end();
      process.exit(1);
    }

    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`\nRemote deployment finished with exit code: ${code}`);
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
  password: 'Iftz@92071015',
  readyTimeout: 90000,
  keepaliveInterval: 0, // disable keepalive timeout disconnects
});
