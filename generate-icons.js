// PWA icon generator — pure Node.js, no dependencies
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32 table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function buildPNG(pixels, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // RGB
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  // Scanlines with filter byte 0
  const raw = Buffer.allocUnsafe(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 3;
      const dst = y * (1 + size * 3) + 1 + x * 3;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Icon drawing ---

// "S" glyph — 5x7 pixel bitmap
const S_GLYPH = [
  [0,1,1,1,0],
  [1,0,0,0,1],
  [1,0,0,0,0],
  [0,1,1,1,0],
  [0,0,0,0,1],
  [1,0,0,0,1],
  [0,1,1,1,0],
];

function drawIcon(size, maskable = false) {
  const pixels = new Uint8Array(size * size * 3);

  const BG   = [18, 18, 18];         // #121212
  const GRN  = [173, 255, 47];       // #adff2f neon green
  const DARK = [10, 10, 10];         // text color on circle

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3]     = BG[0];
    pixels[i * 3 + 1] = BG[1];
    pixels[i * 3 + 2] = BG[2];
  }

  const cx = size / 2;
  const cy = size / 2;

  // Outer circle radius — for maskable, fill more of the safe zone
  const outerR = maskable ? size * 0.46 : size * 0.42;
  const outerR2 = outerR * outerR;

  // Draw neon green circle
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      if (dx * dx + dy * dy <= outerR2) {
        const idx = (y * size + x) * 3;
        pixels[idx]     = GRN[0];
        pixels[idx + 1] = GRN[1];
        pixels[idx + 2] = GRN[2];
      }
    }
  }

  // Draw "SS" text centered on the circle
  const scale = Math.floor(size / 28);        // glyph pixel scale
  const gW = 5 * scale;                       // one glyph width
  const gH = 7 * scale;
  const gap = Math.max(2, Math.floor(size / 40));
  const totalW = gW * 2 + gap;
  const startX = Math.round(cx - totalW / 2);
  const startY = Math.round(cy - gH / 2);

  function drawGlyph(ox) {
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (!S_GLYPH[gy][gx]) continue;
        for (let py = 0; py < scale; py++) {
          for (let px = 0; px < scale; px++) {
            const rx = ox + gx * scale + px;
            const ry = startY + gy * scale + py;
            if (rx < 0 || rx >= size || ry < 0 || ry >= size) continue;
            const idx = (ry * size + rx) * 3;
            pixels[idx]     = DARK[0];
            pixels[idx + 1] = DARK[1];
            pixels[idx + 2] = DARK[2];
          }
        }
      }
    }
  }

  drawGlyph(startX);
  drawGlyph(startX + gW + gap);

  return pixels;
}

// Create icons folder
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

const sizes = [
  { size: 192, name: 'icon-192.png', maskable: false },
  { size: 512, name: 'icon-512.png', maskable: false },
  { size: 512, name: 'icon-maskable-512.png', maskable: true },
];

for (const { size, name, maskable } of sizes) {
  const pixels = drawIcon(size, maskable);
  const png = buildPNG(pixels, size);
  fs.writeFileSync(path.join(iconsDir, name), png);
  console.log(`Created icons/${name} (${size}x${size})`);
}

console.log('Done!');
