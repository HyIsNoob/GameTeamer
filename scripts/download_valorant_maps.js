import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/valorant/maps');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 11 Competitive VALORANT maps
const OFFICIAL_MAPS = [
  { id: 'ascent', name: 'Ascent', splash: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/splash.png' },
  { id: 'bind', name: 'Bind', splash: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/splash.png' },
  { id: 'haven', name: 'Haven', splash: 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/splash.png' },
  { id: 'split', name: 'Split', splash: 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/splash.png' },
  { id: 'icebox', name: 'Icebox', splash: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/splash.png' },
  { id: 'breeze', name: 'Breeze', splash: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/splash.png' },
  { id: 'fracture', name: 'Fracture', splash: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/splash.png' },
  { id: 'pearl', name: 'Pearl', splash: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/splash.png' },
  { id: 'lotus', name: 'Lotus', splash: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/splash.png' },
  { id: 'sunset', name: 'Sunset', splash: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/splash.png' },
  { id: 'abyss', name: 'Abyss', splash: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/splash.png' }
];

async function download() {
  for (const m of OFFICIAL_MAPS) {
    const dest = path.join(OUTPUT_DIR, `${m.id}.png`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`[SKIP] ${m.name} already exists`);
      continue;
    }
    console.log(`[FETCH] ${m.name}...`);
    try {
      const res = await fetch(m.splash);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`[OK] Saved ${m.name} (${Math.round(buf.length / 1024)} KB)`);
    } catch (e) {
      console.error(`[FAIL] ${m.name}:`, e.message);
    }
  }
}

download().then(() => console.log('All maps downloaded!'));
