import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGENDS_DIR = path.join(__dirname, '../public/legends');
const WEAPONS_DIR = path.join(__dirname, '../public/weapons');

// Ensure directories exist
if (!fs.existsSync(LEGENDS_DIR)) fs.mkdirSync(LEGENDS_DIR, { recursive: true });
if (!fs.existsSync(WEAPONS_DIR)) fs.mkdirSync(WEAPONS_DIR, { recursive: true });

const LEGENDS = [
  { id: "bangalore", name: "Bangalore" },
  { id: "fuse", name: "Fuse" },
  { id: "ash", name: "Ash" },
  { id: "mad_maggie", name: "Mad Maggie" },
  { id: "ballistic", name: "Ballistic" },
  { id: "wraith", name: "Wraith" },
  { id: "octane", name: "Octane" },
  { id: "horizon", name: "Horizon" },
  { id: "valkyrie", name: "Valkyrie" },
  { id: "pathfinder", name: "Pathfinder" },
  { id: "revenant", name: "Revenant" },
  { id: "alter", name: "Alter" },
  { id: "bloodhound", name: "Bloodhound" },
  { id: "crypto", name: "Crypto" },
  { id: "seer", name: "Seer" },
  { id: "vantage", name: "Vantage" },
  { id: "gibraltar", name: "Gibraltar" },
  { id: "lifeline", name: "Lifeline" },
  { id: "mirage", name: "Mirage" },
  { id: "loba", name: "Loba" },
  { id: "newcastle", name: "Newcastle" },
  { id: "conduit", name: "Conduit" },
  { id: "caustic", name: "Caustic" },
  { id: "wattson", name: "Wattson" },
  { id: "rampart", name: "Rampart" },
  { id: "catalyst", name: "Catalyst" }
];

const WEAPONS = [
  { id: "havoc", name: "Havoc" }, // Remapped names for API guessing
  { id: "flatline", name: "Flatline" },
  { id: "hemlok", name: "Hemlok" },
  { id: "r301", name: "R-301" },
  { id: "nemesis", name: "Nemesis" },
  { id: "alternator", name: "Alternator" },
  { id: "prowler", name: "Prowler" },
  { id: "r99", name: "R-99" },
  { id: "volt", name: "Volt" },
  { id: "devotion", name: "Devotion" },
  { id: "lstar", name: "L-STAR" },
  { id: "spitfire", name: "Spitfire" },
  { id: "rampage", name: "Rampage" },
  { id: "g7_scout", name: "G7 Scout" },
  { id: "triple_take", name: "Triple Take" },
  { id: "3030", name: "30-30 Repeater" },
  { id: "bocek", name: "Bocek" },
  { id: "charge_rifle", name: "Charge Rifle" },
  { id: "longbow", name: "Longbow" },
  { id: "sentinel", name: "Sentinel" },
  { id: "eva8", name: "EVA-8" },
  { id: "mastiff", name: "Mastiff" },
  { id: "mozambique", name: "Mozambique" },
  { id: "peacekeeper", name: "Peacekeeper" },
  { id: "re45", name: "RE-45" },
  { id: "wingman", name: "Wingman" }
];

const downloadImage = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✓ Downloaded: ${path.basename(dest)}`);
                    resolve(true);
                });
            } else {
                fs.unlink(dest, () => {}); // Delete failed file
                // console.log(`x Failed (${response.statusCode}): ${url}`);
                resolve(false);
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            resolve(false);
        });
    });
};

const main = async () => {
    console.log("Downloading Legends...");
    for (const leg of LEGENDS) {
        const dest = path.join(LEGENDS_DIR, `${leg.id}.png`);
        if (fs.existsSync(dest)) continue;
        
        // Try Apex Legends Status API
        let success = await downloadImage(
            `https://api.mozambiquehe.re/assets/icons/legends/${encodeURIComponent(leg.name)}.png`, 
            dest
        );

        if(!success) {
            // Try fallback naming
             success = await downloadImage(
                `https://api.mozambiquehe.re/assets/icons/legends/${encodeURIComponent(leg.name.replace(' ', ''))}.png`, 
                dest
            );
        }
    }

    console.log("Downloading Weapons (Experimental)...");
    for (const wep of WEAPONS) {
        const dest = path.join(WEAPONS_DIR, `${wep.id}.png`);
        if (fs.existsSync(dest)) continue;

        // Try generic pattern
        let success = await downloadImage(
            `https://api.mozambiquehe.re/assets/icons/weapons/${encodeURIComponent(wep.name)}.png`, 
            dest
        );
        
        if (!success) {
             // Try condensed
             await downloadImage(
                `https://api.mozambiquehe.re/assets/icons/weapons/${encodeURIComponent(wep.name.replace(' ', ''))}.png`, 
                dest
            );
        }
    }
};

main();
