/**
 * Generates authentic WAV sound effect files and crisp PNG + Lottie JSON host entrance
 * artwork assets under apps/web/public/assets/gifts/{sfx,entrances}/ so Module 7.4 has
 * zero broken media or 404 assets locally and in production.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PUBLIC_GIFTS_DIR = path.join(__dirname, 'public', 'assets', 'gifts');
const SFX_DIR = path.join(PUBLIC_GIFTS_DIR, 'sfx');
const ENTRANCES_DIR = path.join(PUBLIC_GIFTS_DIR, 'entrances');

fs.mkdirSync(SFX_DIR, { recursive: true });
fs.mkdirSync(ENTRANCES_DIR, { recursive: true });

// ---- 1. PCM 16-bit Mono WAV Synthesizer ----
function writeWavFile(filePath, durationSec, notes) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let mixed = 0;
    for (const note of notes) {
      if (t >= note.start && t <= note.start + note.dur) {
        const localT = t - note.start;
        const env =
          Math.min(1, localT / 0.02) *
          Math.exp((-3.8 * localT) / Math.max(0.08, note.dur));
        const wave =
          Math.sin(2 * Math.PI * note.freq * localT) * 0.72 +
          Math.sin(4 * Math.PI * note.freq * localT) * 0.28;
        mixed += wave * env * (note.amp ?? 0.35);
      }
    }
    const clamped = Math.max(-1, Math.min(1, mixed));
    samples[i] = Math.round(clamped * 32767);
  }

  const dataByteLen = samples.length * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataByteLen, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataByteLen, 40);

  const pcmBuf = Buffer.from(samples.buffer);
  fs.writeFileSync(filePath, Buffer.concat([header, pcmBuf]));
}

const SFX_PRESETS = {
  'sfx_small_chime.wav': {
    dur: 0.45,
    notes: [
      { start: 0.0, dur: 0.25, freq: 880, amp: 0.32 },
      { start: 0.1, dur: 0.32, freq: 1174.66, amp: 0.3 },
    ],
  },
  'sfx_medium_sparkle.wav': {
    dur: 0.65,
    notes: [
      { start: 0.0, dur: 0.25, freq: 659.25, amp: 0.28 },
      { start: 0.12, dur: 0.25, freq: 880, amp: 0.3 },
      { start: 0.24, dur: 0.38, freq: 1318.5, amp: 0.32 },
    ],
  },
  'sfx_large_fanfare.wav': {
    dur: 0.9,
    notes: [
      { start: 0.0, dur: 0.3, freq: 523.25, amp: 0.3 },
      { start: 0.15, dur: 0.3, freq: 659.25, amp: 0.3 },
      { start: 0.3, dur: 0.3, freq: 783.99, amp: 0.32 },
      { start: 0.45, dur: 0.45, freq: 1046.5, amp: 0.35 },
    ],
  },
  'sfx_luxury_grand.wav': {
    dur: 1.15,
    notes: [
      { start: 0.0, dur: 0.4, freq: 440, amp: 0.28 },
      { start: 0.0, dur: 0.4, freq: 554.37, amp: 0.22 },
      { start: 0.18, dur: 0.4, freq: 659.25, amp: 0.28 },
      { start: 0.36, dur: 0.45, freq: 880, amp: 0.32 },
      { start: 0.56, dur: 0.58, freq: 1108.73, amp: 0.34 },
      { start: 0.62, dur: 0.52, freq: 1318.51, amp: 0.28 },
    ],
  },
  'sfx_special_event.wav': {
    dur: 0.95,
    notes: [
      { start: 0.0, dur: 0.2, freq: 587.33, amp: 0.26 },
      { start: 0.12, dur: 0.25, freq: 880, amp: 0.28 },
      { start: 0.26, dur: 0.32, freq: 1174.66, amp: 0.3 },
      { start: 0.42, dur: 0.5, freq: 1479.98, amp: 0.3 },
    ],
  },
  'sfx_entrance_standard.wav': {
    dur: 0.5,
    notes: [
      { start: 0.0, dur: 0.22, freq: 587.33, amp: 0.25 },
      { start: 0.14, dur: 0.32, freq: 783.99, amp: 0.26 },
    ],
  },
  'sfx_entrance_premium.wav': {
    dur: 0.75,
    notes: [
      { start: 0.0, dur: 0.25, freq: 659.25, amp: 0.28 },
      { start: 0.16, dur: 0.3, freq: 987.77, amp: 0.28 },
      { start: 0.32, dur: 0.4, freq: 1318.51, amp: 0.3 },
    ],
  },
  'sfx_entrance_vip.wav': {
    dur: 1.05,
    notes: [
      { start: 0.0, dur: 0.35, freq: 523.25, amp: 0.3 },
      { start: 0.0, dur: 0.35, freq: 783.99, amp: 0.24 },
      { start: 0.22, dur: 0.35, freq: 987.77, amp: 0.3 },
      { start: 0.44, dur: 0.58, freq: 1567.98, amp: 0.32 },
    ],
  },
  'sfx_entrance_special_event.wav': {
    dur: 1.0,
    notes: [
      { start: 0.0, dur: 0.3, freq: 698.46, amp: 0.28 },
      { start: 0.18, dur: 0.35, freq: 1046.5, amp: 0.3 },
      { start: 0.38, dur: 0.6, freq: 1396.91, amp: 0.32 },
    ],
  },
};

for (const [fileName, cfg] of Object.entries(SFX_PRESETS)) {
  writeWavFile(path.join(SFX_DIR, fileName), cfg.dur, cfg.notes);
}

// ---- 2. Minimal Pure-Node PNG Generator for Host Entrance Badges ----
const CRC_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tbl[n] = c >>> 0;
  }
  return tbl;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function renderEntrancePng(filePath, c1, c2, goldAccent) {
  const w = 160;
  const h = 160;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    const rowStart = y * (w * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < w; x++) {
      const dx = (x - w / 2) / (w / 2);
      const dy = (y - h / 2) / (h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const px = rowStart + 1 + x * 4;
      if (dist > 0.96) {
        raw[px] = 0;
        raw[px + 1] = 0;
        raw[px + 2] = 0;
        raw[px + 3] = 0;
      } else {
        const ring = dist > 0.78 && dist <= 0.92;
        const sparkle =
          Math.abs(dx) + Math.abs(dy) < 0.36 ||
          (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.55) ||
          (Math.abs(dy) < 0.08 && Math.abs(dx) < 0.55);
        const mix = (x + y) / (w + h);
        const r = ring
          ? goldAccent[0]
          : sparkle
          ? 255
          : Math.round(c1[0] * (1 - mix) + c2[0] * mix);
        const g = ring
          ? goldAccent[1]
          : sparkle
          ? 236
          : Math.round(c1[1] * (1 - mix) + c2[1] * mix);
        const b = ring
          ? goldAccent[2]
          : sparkle
          ? 168
          : Math.round(c1[2] * (1 - mix) + c2[2] * mix);
        raw[px] = r;
        raw[px + 1] = g;
        raw[px + 2] = b;
        raw[px + 3] = dist > 0.92 ? Math.round((0.96 - dist) * 25 * 255) : 255;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const compressed = zlib.deflateSync(raw);
  const png = Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, png);
}

const ENTRANCE_SPECS = [
  {
    slug: 'standard',
    nm: 'popo_entrance_standard',
    accent: '#a855f7',
    c1: [88, 28, 135],
    c2: [236, 72, 153],
    ring: [244, 114, 182],
    animType: 'shimmer',
  },
  {
    slug: 'premium',
    nm: 'popo_entrance_premium',
    accent: '#ff2e93',
    c1: [157, 23, 77],
    c2: [126, 34, 206],
    ring: [251, 191, 36],
    animType: 'sparkle',
  },
  {
    slug: 'vip',
    nm: 'popo_entrance_vip',
    accent: '#f59e0b',
    c1: [120, 53, 15],
    c2: [217, 119, 6],
    ring: [253, 224, 71],
    animType: 'royal_aura',
  },
  {
    slug: 'special_event',
    nm: 'popo_entrance_special_event',
    accent: '#38bdf8',
    c1: [30, 58, 138],
    c2: [236, 72, 153],
    ring: [103, 232, 249],
    animType: 'fireworks',
  },
];

for (const spec of ENTRANCE_SPECS) {
  renderEntrancePng(
    path.join(ENTRANCES_DIR, `entrance_${spec.slug}.png`),
    spec.c1,
    spec.c2,
    spec.ring
  );
  const lottieJson = {
    v: '5.7.4',
    fr: 30,
    ip: 0,
    op: 90,
    w: 320,
    h: 120,
    nm: spec.nm,
    ddd: 0,
    assets: [],
    meta: {
      generator: 'Popo Live Animation Studio',
      animType: spec.animType,
      accent: spec.accent,
      tier: spec.slug,
    },
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'EntranceGlowSweep',
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: {
            a: 1,
            k: [
              { t: 0, s: [-40, 60, 0] },
              { t: 45, s: [160, 60, 0] },
              { t: 90, s: [360, 60, 0] },
            ],
          },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
      },
    ],
  };
  fs.writeFileSync(
    path.join(ENTRANCES_DIR, `entrance_${spec.slug}.json`),
    JSON.stringify(lottieJson, null, 2)
  );
}

console.log('Generated SFX:', Object.keys(SFX_PRESETS).length, 'and Entrances:', ENTRANCE_SPECS.length);
