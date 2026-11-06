const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure /public exists
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create clean SVG icon with metallic silver bullion styling
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="silverBar" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="25%" stop-color="#cbd5e1"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="75%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background container -->
  <rect width="512" height="512" rx="104" fill="url(#bg)"/>
  <rect width="504" height="504" x="4" y="4" rx="100" fill="none" stroke="#334155" stroke-width="3" stroke-opacity="0.6"/>

  <!-- Subtle glow halo -->
  <circle cx="256" cy="256" r="160" fill="url(#cyanGlow)" opacity="0.25" filter="url(#glow)"/>

  <!-- Silver Bullion Hexagon Shield -->
  <polygon points="256,90 380,162 380,306 256,378 132,306 132,162" 
           fill="none" stroke="url(#silverBar)" stroke-width="8" stroke-linejoin="round"/>
  
  <polygon points="256,110 360,172 360,296 256,358 152,296 152,172" 
           fill="#0f172a" fill-opacity="0.85" stroke="#475569" stroke-width="2"/>

  <!-- Candlestick Graphic in center -->
  <line x1="205" y1="180" x2="205" y2="290" stroke="#06b6d4" stroke-width="3"/>
  <rect x="197" y="205" width="16" height="55" rx="3" fill="#06b6d4"/>

  <line x1="256" y1="155" x2="256" y2="310" stroke="#10b981" stroke-width="3"/>
  <rect x="247" y="175" width="18" height="90" rx="3" fill="#10b981"/>

  <line x1="307" y1="170" x2="307" y2="280" stroke="#cbd5e1" stroke-width="3"/>
  <rect x="299" y="195" width="16" height="50" rx="3" fill="#e2e8f0"/>

  <!-- Chemical Symbol: Ag 47 -->
  <text x="256" y="425" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="44" fill="url(#silverBar)" letter-spacing="4">ARGENTUM</text>
  <text x="256" y="456" text-anchor="middle" font-family="monospace" font-weight="600" font-size="18" fill="#38bdf8" letter-spacing="3">SILVER FUTURES · MOEX</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('Created /public/icon.svg');

// 2. Pure Node.js PNG encoder helper
function createPNG(width, height, drawPixelFn) {
  // RGBA buffer with filter byte 0 at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace: none

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Color drawing logic
function drawIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = (x - cx) / (w / 2);
  const dy = (y - cy) / (h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background gradient: slate-950 #020617 to #0f172a
  const bgGrad = (y / h);
  let r = Math.round(2 + bgGrad * 12);
  let g = Math.round(6 + bgGrad * 16);
  let b = Math.round(23 + bgGrad * 24);
  let a = 255;

  const safeScale = isMaskable ? 0.72 : 0.88;
  const scaledDist = dist / safeScale;

  // Outer border ring for standard icon
  if (!isMaskable && scaledDist > 0.96 && scaledDist < 1.0) {
    return [71, 85, 105, 255]; // slate-600
  }

  // Cyan glowing halo
  if (scaledDist < 0.85 && scaledDist > 0.4) {
    const glow = Math.sin((scaledDist - 0.4) / 0.45 * Math.PI) * 0.35;
    r = Math.min(255, Math.round(r + 6 * glow));
    g = Math.min(255, Math.round(g + 182 * glow));
    b = Math.min(255, Math.round(b + 212 * glow));
  }

  // Hexagonal shield center or inner bullion
  const absDx = Math.abs(dx / safeScale);
  const absDy = Math.abs(dy / safeScale);
  const inHex = (absDx * 0.866 + absDy * 0.5 <= 0.6) && (absDy <= 0.6);

  if (inHex) {
    // Silver metallic gradient
    const silverTone = Math.sin((x / w * 3 + y / h * 2)) * 0.5 + 0.5;
    const sr = Math.round(180 + silverTone * 65);
    const sg = Math.round(195 + silverTone * 55);
    const sb = Math.round(215 + silverTone * 40);

    // Candlesticks drawn inside
    const nx = (x - cx) / (w * safeScale * 0.5);
    const ny = (y - cy) / (h * safeScale * 0.5);

    // Candle 1 (left cyan)
    if (nx >= -0.42 && nx <= -0.18) {
      if (Math.abs(nx - -0.3) < 0.02 && ny >= -0.4 && ny <= 0.4) return [6, 182, 212, 255];
      if (ny >= -0.25 && ny <= 0.25) return [6, 182, 212, 255];
    }
    // Candle 2 (center emerald)
    if (nx >= -0.12 && nx <= 0.12) {
      if (Math.abs(nx) < 0.02 && ny >= -0.55 && ny <= 0.45) return [16, 185, 129, 255];
      if (ny >= -0.38 && ny <= 0.22) return [16, 185, 129, 255];
    }
    // Candle 3 (right silver/white)
    if (nx >= 0.18 && nx <= 0.42) {
      if (Math.abs(nx - 0.3) < 0.02 && ny >= -0.35 && ny <= 0.35) return [241, 245, 249, 255];
      if (ny >= -0.15 && ny <= 0.3) return [226, 232, 240, 255];
    }

    // Hex background plate
    return [Math.round(sr * 0.25), Math.round(sg * 0.28), Math.round(sb * 0.35), 255];
  }

  // Border of hexagon
  const onHexBorder = (Math.abs(absDx * 0.866 + absDy * 0.5 - 0.6) < 0.04 && absDy <= 0.62) || 
                      (Math.abs(absDy - 0.6) < 0.03 && absDx * 0.866 + absDy * 0.5 <= 0.62);
  if (onHexBorder) {
    return [226, 232, 240, 255]; // bright silver
  }

  return [r, g, b, a];
}

console.log('Generating PNG icons...');
const icon192 = createPNG(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
console.log('Created pwa-192x192.png (192x192)');

const icon512 = createPNG(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
console.log('Created pwa-512x512.png (512x512)');

const iconMaskable = createPNG(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);
console.log('Created pwa-maskable-512x512.png (512x512 maskable)');

const appleIcon = createPNG(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Created apple-touch-icon.png (180x180)');

// Also write a standard manifest.webmanifest for static direct serving
const manifest = {
  id: "/",
  name: "Argentum Terminal: Silver Futures & Macro Analytics",
  short_name: "Argentum",
  description: "Институциональный терминал для комплексного анализа цен фьючерсов на серебро (SI/XAG), волатильности, объемов торгов и макроэкономики.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
  orientation: "any",
  background_color: "#020617",
  theme_color: "#020617",
  lang: "ru",
  categories: ["finance", "business", "productivity"],
  icons: [
    {
      src: "/pwa-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any"
    },
    {
      src: "/pwa-maskable-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable"
    },
    {
      src: "/icon.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any"
    }
  ],
  shortcuts: [
    {
      name: "Котировки и График",
      short_name: "График",
      url: "/#price_volatility",
      icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
    },
    {
      name: "Корреляция с DXY",
      short_name: "DXY",
      url: "/#dxy_correlation",
      icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
    },
    {
      name: "Мировой Баланс",
      short_name: "Баланс",
      url: "/#supply_demand",
      icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
    }
  ]
};

fs.writeFileSync(path.join(publicDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Created /public/manifest.webmanifest');
