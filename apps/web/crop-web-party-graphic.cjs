const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

async function cropGraphic() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 800 });

  const imgPath = path.resolve(__dirname, 'public/assets/party/05_07_web_party.png').replace(/\\/g, '/');
  const base64Img = fs.readFileSync(imgPath).toString('base64');
  const dataUri = `data:image/png;base64,${base64Img}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:black;">
        <canvas id="c"></canvas>
      </body>
    </html>
  `;
  await page.setContent(html);

  // Crop the device mockup graphic: x: 5, y: 90, w: 290, h: 220
  const crop = { x: 8, y: 95, w: 285, h: 225 };

  const croppedDataUri = await page.evaluate(async (dataUri, crop) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = crop.w;
        canvas.height = crop.h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUri;
    });
  }, dataUri, crop);

  const base64Data = croppedDataUri.replace(/^data:image\/png;base64,/, '');
  const outPath = path.resolve(__dirname, 'public/assets/party/web_party_devices_hero.png');
  fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
  console.log(`Saved web_party_devices_hero.png (${crop.w}x${crop.h})`);

  await browser.close();
}

cropGraphic().catch(console.error);
