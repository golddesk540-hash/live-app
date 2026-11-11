const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EXECUTABLE_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const GIFTS_DIR = path.join(__dirname, 'public', 'assets', 'gifts');
const THUMBS_DIR = path.join(GIFTS_DIR, 'thumbs');
const ANIM_DIR = path.join(GIFTS_DIR, 'animations');

const ARTWORKS = [
  {
    slug: 'rose',
    accent: '#ff1e56',
    secondary: '#10b981',
    svg: `
      <defs>
        <radialGradient id="roseGrad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ff6b93"/>
          <stop offset="55%" stop-color="#e11d48"/>
          <stop offset="100%" stop-color="#881337"/>
        </radialGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4ade80"/>
          <stop offset="100%" stop-color="#15803d"/>
        </linearGradient>
      </defs>
      <path d="M120 148 C120 205, 118 228, 120 250" stroke="#16a34a" stroke-width="11" stroke-linecap="round"/>
      <path d="M120 212 C86 198, 72 175, 92 168 C105 164, 115 186, 120 205 Z" fill="url(#leafGrad)"/>
      <path d="M122 204 C156 188, 174 166, 152 158 C138 153, 128 178, 122 198 Z" fill="url(#leafGrad)"/>
      <path d="M70 112 C62 72, 95 54, 120 66 C145 54, 178 72, 170 112 C164 148, 140 164, 120 164 C100 164, 76 148, 70 112 Z" fill="url(#roseGrad)"/>
      <path d="M78 106 C86 78, 112 76, 120 96 C128 76, 154 78, 162 106 C152 132, 134 146, 120 146 C106 146, 88 132, 78 106 Z" fill="#f43f5e" opacity="0.88"/>
      <path d="M92 100 C98 82, 120 76, 132 88 C144 98, 138 122, 120 124 C104 124, 96 112, 102 98 C108 88, 124 90, 126 102 C126 110, 115 112, 114 104" fill="none" stroke="#ffe4e6" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="98" cy="78" rx="12" ry="6" fill="#ffffff" opacity="0.28" transform="rotate(-25 98 78)"/>
    `,
    animType: 'bloom',
  },
  {
    slug: 'heart',
    accent: '#ff2d78',
    secondary: '#f472b6',
    svg: `
      <defs>
        <radialGradient id="heartGrad" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stop-color="#ff99c8"/>
          <stop offset="45%" stop-color="#ff2d78"/>
          <stop offset="100%" stop-color="#9d174d"/>
        </radialGradient>
      </defs>
      <path d="M120 218 C120 218, 42 162, 42 102 C42 66, 70 44, 100 44 C112 44, 118 52, 120 58 C122 52, 128 44, 140 44 C170 44, 198 66, 198 102 C198 162, 120 218, 120 218 Z" fill="url(#heartGrad)"/>
      <ellipse cx="86" cy="84" rx="22" ry="12" fill="#ffffff" opacity="0.42" transform="rotate(-28 86 84)"/>
      <circle cx="152" cy="76" r="6" fill="#fbcfe8" opacity="0.75"/>
    `,
    animType: 'pulse',
  },
  {
    slug: 'teddy',
    accent: '#f59e0b',
    secondary: '#fb7185',
    svg: `
      <defs>
        <radialGradient id="furGrad" cx="45%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#f6bd78"/>
          <stop offset="65%" stop-color="#c97a3e"/>
          <stop offset="100%" stop-color="#7c3f18"/>
        </radialGradient>
      </defs>
      <circle cx="72" cy="68" r="24" fill="url(#furGrad)"/>
      <circle cx="72" cy="68" r="13" fill="#fde68a" opacity="0.65"/>
      <circle cx="168" cy="68" r="24" fill="url(#furGrad)"/>
      <circle cx="168" cy="68" r="13" fill="#fde68a" opacity="0.65"/>
      <ellipse cx="120" cy="176" rx="54" ry="52" fill="url(#furGrad)"/>
      <ellipse cx="120" cy="180" rx="34" ry="34" fill="#fde68a" opacity="0.8"/>
      <circle cx="64" cy="164" r="20" fill="url(#furGrad)"/>
      <circle cx="176" cy="164" r="20" fill="url(#furGrad)"/>
      <ellipse cx="82" cy="218" rx="22" ry="16" fill="#9a4e1e"/>
      <ellipse cx="158" cy="218" rx="22" ry="16" fill="#9a4e1e"/>
      <circle cx="120" cy="100" r="48" fill="url(#furGrad)"/>
      <ellipse cx="120" cy="112" rx="24" ry="19" fill="#fde68a"/>
      <circle cx="102" cy="90" r="6" fill="#1e1b4b"/>
      <circle cx="138" cy="90" r="6" fill="#1e1b4b"/>
      <circle cx="100" cy="88" r="2" fill="#ffffff"/>
      <circle cx="136" cy="88" r="2" fill="#ffffff"/>
      <ellipse cx="120" cy="104" rx="8" ry="6" fill="#3b1d0a"/>
      <path d="M120 110 Q113 118 108 115 M120 110 Q127 118 132 115" stroke="#3b1d0a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M104 140 L120 148 L136 140 L132 156 L120 150 L108 156 Z" fill="#ef4444"/>
    `,
    animType: 'bounce',
  },
  {
    slug: 'crown',
    accent: '#fbbf24',
    secondary: '#ef4444',
    svg: `
      <defs>
        <linearGradient id="goldCrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <path d="M44 176 L58 84 L96 126 L120 62 L144 126 L182 84 L196 176 Z" fill="url(#goldCrown)" stroke="#fef9c3" stroke-width="4" stroke-linejoin="round"/>
      <rect x="44" y="172" width="152" height="26" rx="10" fill="#d97706" stroke="#fef08a" stroke-width="3"/>
      <circle cx="58" cy="78" r="9" fill="#fef08a"/>
      <circle cx="120" cy="56" r="11" fill="#fef08a"/>
      <circle cx="182" cy="78" r="9" fill="#fef08a"/>
      <polygon points="120,126 134,144 120,162 106,144" fill="#ef4444" stroke="#fecaca" stroke-width="2"/>
      <circle cx="84" cy="148" r="8" fill="#38bdf8" stroke="#bae6fd" stroke-width="2"/>
      <circle cx="156" cy="148" r="8" fill="#38bdf8" stroke="#bae6fd" stroke-width="2"/>
    `,
    animType: 'shine',
  },
  {
    slug: 'sports_car',
    accent: '#ff1e7a',
    secondary: '#38bdf8',
    svg: `
      <defs>
        <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff6b9d"/>
          <stop offset="45%" stop-color="#e11d48"/>
          <stop offset="100%" stop-color="#881337"/>
        </linearGradient>
      </defs>
      <path d="M26 154 C28 134, 48 122, 74 118 L108 86 C126 78, 162 78, 182 96 L208 118 C220 124, 224 138, 220 156 Z" fill="url(#carBody)" stroke="#fda4af" stroke-width="3"/>
      <path d="M98 114 L116 94 C134 90, 156 92, 168 108 L178 116 Z" fill="#1e293b" stroke="#7dd3fc" stroke-width="2"/>
      <ellipse cx="44" cy="134" rx="10" ry="6" fill="#fef08a"/>
      <circle cx="72" cy="162" r="24" fill="#0f172a" stroke="#e2e8f0" stroke-width="4"/>
      <circle cx="72" cy="162" r="11" fill="#94a3b8"/>
      <circle cx="176" cy="162" r="24" fill="#0f172a" stroke="#e2e8f0" stroke-width="4"/>
      <circle cx="176" cy="162" r="11" fill="#94a3b8"/>
      <path d="M96 140 L152 140" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
    `,
    animType: 'drive',
  },
  {
    slug: 'castle',
    accent: '#c084fc',
    secondary: '#ff2d78',
    svg: `
      <defs>
        <linearGradient id="castleWall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#e879f9"/>
          <stop offset="50%" stop-color="#a855f7"/>
          <stop offset="100%" stop-color="#581c87"/>
        </linearGradient>
      </defs>
      <rect x="64" y="128" width="112" height="86" rx="8" fill="url(#castleWall)" stroke="#f5d0fe" stroke-width="3"/>
      <rect x="44" y="102" width="34" height="112" rx="6" fill="#9333ea" stroke="#f5d0fe" stroke-width="2.5"/>
      <rect x="162" y="102" width="34" height="112" rx="6" fill="#9333ea" stroke="#f5d0fe" stroke-width="2.5"/>
      <rect x="98" y="84" width="44" height="130" rx="6" fill="#a855f7" stroke="#f5d0fe" stroke-width="3"/>
      <polygon points="61,60 40,104 82,104" fill="#ff2d78" stroke="#fbcfe8" stroke-width="2.5"/>
      <polygon points="179,60 158,104 200,104" fill="#ff2d78" stroke="#fbcfe8" stroke-width="2.5"/>
      <polygon points="120,34 92,86 148,86" fill="#ec4899" stroke="#fde68a" stroke-width="3"/>
      <path d="M104 214 L104 176 C104 162, 136 162, 136 176 L136 214 Z" fill="#fef08a"/>
      <circle cx="120" cy="116" r="8" fill="#fef08a"/>
    `,
    animType: 'fireworks',
  },
  {
    slug: 'lollipop',
    accent: '#f43f5e',
    secondary: '#fde047',
    svg: `
      <rect x="115" y="140" width="10" height="90" rx="5" fill="#f8fafc"/>
      <circle cx="120" cy="96" r="52" fill="#ff2d78" stroke="#fef08a" stroke-width="5"/>
      <path d="M120 96 m-36 0 a36 36 0 1 0 72 0 a26 26 0 1 0 -52 0 a16 16 0 1 0 32 0" fill="none" stroke="#fff1f2" stroke-width="8" stroke-linecap="round"/>
    `,
    animType: 'spin',
  },
  {
    slug: 'love_letter',
    accent: '#fb7185',
    secondary: '#ff2d78',
    svg: `
      <rect x="44" y="76" width="152" height="106" rx="14" fill="#fff1f2" stroke="#f472b6" stroke-width="4"/>
      <path d="M46 82 L120 136 L194 82" fill="none" stroke="#ec4899" stroke-width="5" stroke-linejoin="round"/>
      <path d="M120 148 C120 148, 98 130, 98 114 C98 104, 106 98, 114 98 C118 98, 120 102, 120 104 C120 102, 122 98, 126 98 C134 98, 142 104, 142 114 C142 130, 120 148, 120 148 Z" fill="#ff2d78"/>
    `,
    animType: 'float',
  },
  {
    slug: 'diamond_ring',
    accent: '#38bdf8',
    secondary: '#e0f2fe',
    svg: `
      <circle cx="120" cy="148" r="52" fill="none" stroke="#fbbf24" stroke-width="14"/>
      <circle cx="120" cy="148" r="52" fill="none" stroke="#fef08a" stroke-width="4" stroke-dasharray="14 10"/>
      <polygon points="84,80 102,52 138,52 156,80 120,114" fill="#38bdf8" stroke="#e0f2fe" stroke-width="4" stroke-linejoin="round"/>
      <line x1="84" y1="80" x2="156" y2="80" stroke="#bae6fd" stroke-width="3"/>
      <line x1="120" y1="52" x2="120" y2="114" stroke="#e0f2fe" stroke-width="3"/>
    `,
    animType: 'shine',
  },
  {
    slug: 'event_fireworks',
    accent: '#f59e0b',
    secondary: '#ec4899',
    svg: `
      <circle cx="120" cy="112" r="14" fill="#fef08a"/>
      <g stroke="#fbbf24" stroke-width="6" stroke-linecap="round">
        <line x1="120" y1="44" x2="120" y2="78"/>
        <line x1="120" y1="146" x2="120" y2="180"/>
        <line x1="52" y1="112" x2="86" y2="112"/>
        <line x1="154" y1="112" x2="188" y2="112"/>
      </g>
      <g stroke="#ff2d78" stroke-width="5" stroke-linecap="round">
        <line x1="72" y1="64" x2="96" y2="88"/>
        <line x1="144" y1="136" x2="168" y2="160"/>
        <line x1="168" y1="64" x2="144" y2="88"/>
        <line x1="96" y1="136" x2="72" y2="160"/>
      </g>
      <circle cx="72" cy="58" r="6" fill="#38bdf8"/>
      <circle cx="176" cy="60" r="6" fill="#4ade80"/>
      <circle cx="176" cy="166" r="6" fill="#c084fc"/>
      <circle cx="68" cy="166" r="6" fill="#f472b6"/>
    `,
    animType: 'fireworks',
  },
  {
    slug: 'festive_lantern',
    accent: '#f97316',
    secondary: '#fde047',
    svg: `
      <line x1="120" y1="30" x2="120" y2="62" stroke="#fde047" stroke-width="5"/>
      <rect x="92" y="56" width="56" height="14" rx="5" fill="#fbbf24"/>
      <ellipse cx="120" cy="118" rx="48" ry="52" fill="#f97316" stroke="#fde047" stroke-width="4"/>
      <ellipse cx="120" cy="118" rx="22" ry="52" fill="none" stroke="#fef08a" stroke-width="3"/>
      <rect x="92" y="166" width="56" height="14" rx="5" fill="#fbbf24"/>
      <line x1="112" y1="180" x2="112" y2="212" stroke="#fde047" stroke-width="4"/>
      <line x1="120" y1="180" x2="120" y2="220" stroke="#f43f5e" stroke-width="4"/>
      <line x1="128" y1="180" x2="128" y2="212" stroke="#fde047" stroke-width="4"/>
    `,
    animType: 'float',
  },
  {
    slug: 'galaxy_jet',
    accent: '#38bdf8',
    secondary: '#a855f7',
    svg: `
      <polygon points="120,34 152,130 198,162 152,158 138,196 120,174 102,196 88,158 42,162 88,130" fill="#38bdf8" stroke="#e0f2fe" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="120" cy="108" rx="14" ry="28" fill="#1e1b4b" stroke="#7dd3fc" stroke-width="2.5"/>
      <polygon points="108,194 120,232 132,194" fill="#ff2d78"/>
    `,
    animType: 'launch',
  },
  {
    slug: 'royal_yacht',
    accent: '#06b6d4',
    secondary: '#f8fafc',
    svg: `
      <polygon points="34,154 206,154 184,194 52,194" fill="#e2e8f0" stroke="#38bdf8" stroke-width="3"/>
      <polygon points="62,124 166,124 184,154 52,154" fill="#ffffff"/>
      <polygon points="88,96 142,96 154,124 78,124" fill="#38bdf8"/>
      <path d="M28 202 Q60 192 92 202 T156 202 T214 202" fill="none" stroke="#0284c7" stroke-width="6" stroke-linecap="round"/>
    `,
    animType: 'glide',
  },
  {
    slug: 'dragon_phoenix',
    accent: '#f59e0b',
    secondary: '#ff2d78',
    svg: `
      <circle cx="120" cy="120" r="68" fill="none" stroke="#fbbf24" stroke-width="5" stroke-dasharray="18 8"/>
      <path d="M58 156 C52 98, 92 52, 134 52 C172 52, 186 92, 162 126 C144 150, 96 144, 96 184 L120 200 L152 176" fill="none" stroke="#ff2d78" stroke-width="14" stroke-linecap="round"/>
      <path d="M74 148 C68 106, 98 70, 132 70 C158 70, 168 96, 152 118" fill="none" stroke="#fef08a" stroke-width="6" stroke-linecap="round"/>
      <circle cx="136" cy="78" r="7" fill="#fef08a"/>
    `,
    animType: 'shine',
  },
  {
    slug: 'fallback_gift',
    accent: '#a855f7',
    secondary: '#ff2d78',
    svg: `
      <rect x="52" y="96" width="136" height="106" rx="14" fill="#9333ea" stroke="#f5d0fe" stroke-width="4"/>
      <rect x="44" y="72" width="152" height="32" rx="10" fill="#ff2d78" stroke="#fbcfe8" stroke-width="3"/>
      <rect x="108" y="72" width="24" height="130" fill="#fbbf24"/>
      <path d="M120 72 C92 40, 68 58, 96 72 M120 72 C148 40, 172 58, 144 72" fill="none" stroke="#fde047" stroke-width="8" stroke-linecap="round"/>
    `,
    animType: 'bounce',
  },
];

function buildLottieSpec(slug, accent, animType) {
  return {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 60,
    w: 240,
    h: 240,
    nm: `popo_gift_${slug}`,
    ddd: 0,
    assets: [],
    meta: { generator: 'Popo Live Asset Studio', animType, accent },
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'GiftMotionPulse',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: {
            a: 1,
            k: [
              { t: 0, s: [0] },
              { t: 30, s: [animType === 'spin' ? 180 : 6] },
              { t: 60, s: [animType === 'spin' ? 360 : 0] },
            ],
          },
          p: {
            a: 1,
            k: [
              { t: 0, s: [120, 120, 0] },
              { t: 30, s: [120, animType === 'launch' ? 92 : 112, 0] },
              { t: 60, s: [120, 120, 0] },
            ],
          },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [95, 95, 100] },
              { t: 30, s: [112, 112, 100] },
              { t: 60, s: [95, 95, 100] },
            ],
          },
        },
        shapes: [
          {
            ty: 'el',
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [120, 120] },
            nm: 'GlowRing',
          },
        ],
        ip: 0,
        op: 60,
        st: 0,
      },
    ],
  };
}

async function run() {
  fs.mkdirSync(GIFTS_DIR, { recursive: true });
  fs.mkdirSync(THUMBS_DIR, { recursive: true });
  fs.mkdirSync(ANIM_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: EXECUTABLE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  for (const item of ARTWORKS) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:transparent;display:flex;align-items:center;justify-content:center;width:240px;height:240px;overflow:hidden;">
          <div style="position:relative;width:240px;height:240px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:24px;border-radius:999px;background:radial-gradient(circle, ${item.accent}44 0%, transparent 72%);filter:blur(8px);"></div>
            <svg width="240" height="240" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" style="position:relative;z-index:2;filter:drop-shadow(0 8px 18px ${item.accent}66);">
              ${item.svg}
            </svg>
          </div>
        </body>
      </html>
    `;

    // Main 240x240 @2x PNG
    await page.setViewport({ width: 240, height: 240, deviceScaleFactor: 2 });
    await page.setContent(html);
    await page.screenshot({
      path: path.join(GIFTS_DIR, `${item.slug}.png`),
      omitBackground: true,
    });

    // Optimized 128x128 Thumbnail WebP + PNG
    await page.setViewport({ width: 128, height: 128, deviceScaleFactor: 1 });
    await page.setContent(html.replace(/240px/g, '128px'));
    await page.screenshot({
      path: path.join(THUMBS_DIR, `${item.slug}.png`),
      omitBackground: true,
    });
    await page.screenshot({
      path: path.join(GIFTS_DIR, `${item.slug}.webp`),
      type: 'webp',
      quality: 90,
      omitBackground: true,
    });

    // Lottie Animation JSON Asset
    fs.writeFileSync(
      path.join(ANIM_DIR, `${item.slug}.json`),
      JSON.stringify(buildLottieSpec(item.slug, item.accent, item.animType), null, 2)
    );
  }

  await browser.close();
  console.log(`Generated ${ARTWORKS.length} Gift PNGs, WebPs, Thumbnails, and Lottie JSON assets in public/assets/gifts!`);
}

run().catch((err) => {
  console.error('Failed to generate gift assets:', err);
  process.exit(1);
});
