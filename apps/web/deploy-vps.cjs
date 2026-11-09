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
    
    echo "--- 3. Rebuilding Next.js on VPS ---"
    npm run build
    
    echo "--- 4. Reloading PM2 process 'popo-live' ---"
    pm2 restart popo-live
    
    echo "--- 5. Verifying local endpoints on VPS ---"
    sleep 3
    curl -s -I http://127.0.0.1:3005/live/setup/pre-live | head -n 5
    curl -s http://127.0.0.1:3005/api/live/pre-live/config?preview=demo | head -n 5
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
