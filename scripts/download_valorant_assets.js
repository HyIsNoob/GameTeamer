import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../public/valorant/agents');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 26 Official Valorant Agents
const AGENTS = [
  { id: 'astra', name: 'Astra', slug: 'astra' },
  { id: 'breach', name: 'Breach', slug: 'breach' },
  { id: 'brimstone', name: 'Brimstone', slug: 'brimstone' },
  { id: 'chamber', name: 'Chamber', slug: 'chamber' },
  { id: 'clove', name: 'Clove', slug: 'clove' },
  { id: 'cypher', name: 'Cypher', slug: 'cypher' },
  { id: 'deadlock', name: 'Deadlock', slug: 'deadlock' },
  { id: 'fade', name: 'Fade', slug: 'fade' },
  { id: 'gekko', name: 'Gekko', slug: 'gekko' },
  { id: 'harbor', name: 'Harbor', slug: 'harbor' },
  { id: 'iso', name: 'Iso', slug: 'iso' },
  { id: 'jett', name: 'Jett', slug: 'jett' },
  { id: 'kayo', name: 'KAY/O', slug: 'kay-o' },
  { id: 'killjoy', name: 'Killjoy', slug: 'killjoy' },
  { id: 'neon', name: 'Neon', slug: 'neon' },
  { id: 'omen', name: 'Omen', slug: 'omen' },
  { id: 'phoenix', name: 'Phoenix', slug: 'phoenix' },
  { id: 'raze', name: 'Raze', slug: 'raze' },
  { id: 'reyna', name: 'Reyna', slug: 'reyna' },
  { id: 'sage', name: 'Sage', slug: 'sage' },
  { id: 'skye', name: 'Skye', slug: 'skye' },
  { id: 'sova', name: 'Sova', slug: 'sova' },
  { id: 'tejo', name: 'Tejo', slug: 'tejo' },
  { id: 'viper', name: 'Viper', slug: 'viper' },
  { id: 'vyse', name: 'Vyse', slug: 'vyse' },
  { id: 'yoru', name: 'Yoru', slug: 'yoru' }
];

const fetchWithTimeout = async (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        ...options.headers
      }
    });
    return res;
  } finally {
    clearTimeout(id);
  }
};

const main = async () => {
  console.log(`Starting VALORANT agent assets download to ${OUTPUT_DIR}...`);

  // First fetch the official agent metadata
  let valorantApiAgents = [];
  try {
    const res = await fetchWithTimeout('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    if (res.ok) {
      const json = await res.json();
      valorantApiAgents = json.data || [];
    }
  } catch (err) {
    console.warn('Could not reach valorant-api, will use playvalorant:', err.message);
  }

  let successCount = 0;

  for (const agent of AGENTS) {
    const destPath = path.join(OUTPUT_DIR, `${agent.id}.png`);

    // Find in valorantApiAgents
    const apiMatch = valorantApiAgents.find(
      (a) =>
        a.displayName.toLowerCase() === agent.name.toLowerCase() ||
        a.developerName.toLowerCase() === agent.id.toLowerCase() ||
        (agent.id === 'kayo' && a.displayName.toLowerCase().includes('kay'))
    );

    let imageUrl = apiMatch?.fullPortrait || apiMatch?.displayIcon;

    if (!imageUrl) {
      // Try playvalorant.com
      try {
        const pageRes = await fetchWithTimeout(`https://playvalorant.com/en-us/agents/${agent.slug}/`);
        if (pageRes.ok) {
          const html = await pageRes.text();
          const match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
          if (match && match[1]) {
            imageUrl = match[1];
          }
        }
      } catch (e) {
        console.warn(`Error scraping playvalorant for ${agent.name}:`, e.message);
      }
    }

    if (!imageUrl) {
      console.error(`✗ No image found for ${agent.name}`);
      continue;
    }

    try {
      console.log(`Downloading artwork for ${agent.name}...`);
      const imgRes = await fetchWithTimeout(imageUrl);
      if (!imgRes.ok) {
        console.error(`✗ Failed HTTP ${imgRes.status} for ${agent.name}`);
        continue;
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(destPath, buffer);
      console.log(`✓ Saved: ${agent.name} -> ${agent.id}.png (${(buffer.length / 1024).toFixed(1)} KB)`);
      successCount++;
    } catch (err) {
      console.error(`✗ Error saving ${agent.name}:`, err.message);
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`Completed! ${successCount}/${AGENTS.length} agents downloaded.`);
};

main();
