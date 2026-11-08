const { Client } = require('ssh2');

const conn = new Client();

function exec(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => { errOut += d; process.stderr.write(d.toString()); });
      stream.on('close', code => {
        if (code === 0) resolve(out);
        else reject(new Error(`Failed with code ${code}: ${errOut}`));
      });
    });
  });
}

async function main() {
  await new Promise((res, rej) => {
    conn.on('ready', res).on('error', rej).connect({
      host: '169.58.50.184',
      port: 22,
      username: 'root',
      password: 'Iftkharzaman',
      readyTimeout: 20000,
    });
  });

  console.log('Connected to VPS.');

  // 1. Delete failed popo-live PM2 process
  await exec('pm2 delete popo-live || true');

  // 2. Start Popo Live on port 3005
  await exec('cd /var/www/popo-live/apps/web && PORT=3005 pm2 start npm --name "popo-live" -- run start -- -p 3005');
  await exec('pm2 save');

  // 3. Wait 3 seconds and check PM2 status
  await new Promise(r => setTimeout(r, 3000));
  await exec('pm2 list');

  // 4. Test port 3005 locally
  await exec('curl -I http://127.0.0.1:3005');

  // 5. Write Nginx 00-popolive config
  const nginxConf = `
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 169.58.50.184;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

  await exec(`cat << 'EOF' > /etc/nginx/sites-available/00-popolive
${nginxConf.trim()}
EOF`);

  await exec('ln -sf /etc/nginx/sites-available/00-popolive /etc/nginx/sites-enabled/00-popolive');
  await exec('nginx -t && systemctl restart nginx');

  // 6. Test public HTTP
  await exec('curl -I http://169.58.50.184');

  console.log('\n🎉 ALL DONE! Popo Live is now actively running and accessible at http://169.58.50.184');
  conn.end();
}

main().catch(err => {
  console.error('Error:', err);
  conn.end();
  process.exit(1);
});
