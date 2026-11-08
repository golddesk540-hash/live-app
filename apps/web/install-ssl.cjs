const { Client } = require('ssh2');

const conn = new Client();

function exec(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => { process.stderr.write(d.toString()); });
      stream.on('close', code => {
        if (code === 0) resolve(out);
        else reject(new Error(`Exit code ${code}`));
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

  // Run Certbot for kigolive.com and www.kigolive.com
  const certbotCmd = 'certbot --nginx -d kigolive.com -d www.kigolive.com --non-interactive --agree-tos -m iftikharzaman540@gmail.com --redirect';
  await exec(certbotCmd);

  // Test Nginx & reload
  await exec('nginx -t && systemctl reload nginx');

  console.log('\n🔒 SSL CERTIFICATE ISSUED AND CONFIGURED SUCCESSFULLY!');
  conn.end();
}

main().catch(err => {
  console.error('Certbot failed:', err);
  conn.end();
  process.exit(1);
});
