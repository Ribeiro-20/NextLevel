#!/usr/bin/env node
// tools/setPromo.js
// Usage:
//   node tools/setPromo.js --id <docId> --promo <percent>
//   node tools/setPromo.js --file <path-to-json-array>
// Notes:
// - Requires Firebase Admin credentials available via GOOGLE_APPLICATION_CREDENTIALS or running in the same environment
// - If you run against the emulator set FIRESTORE_EMULATOR_HOST=localhost:8080

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--id') out.id = args[++i];
    else if (a === '--promo') out.promo = args[++i];
    else if (a === '--file') out.file = args[++i];
    else if (a === '--help') out.help = true;
  }
  return out;
}

async function main() {
  const opts = parseArgs();
  if (opts.help || (!opts.id && !opts.file)) {
    console.log('Usage: node tools/setPromo.js --id <docId> --promo <percent>');
    console.log('   or: node tools/setPromo.js --file <path-to-json-array>');
    process.exit(0);
  }

  // Initialize admin SDK
  try {
    admin.initializeApp();
  } catch (e) {
    // already initialized
  }
  const db = admin.firestore();
#!/usr/bin/env node
// tools/setPromo.js
// Usage:
//   node tools/setPromo.js --id <docId> --promo <percent>
//   node tools/setPromo.js --file <path-to-json-array>
// Notes:
// - Requires Firebase Admin credentials available via GOOGLE_APPLICATION_CREDENTIALS or running in the same environment
// - If you run against the emulator set FIRESTORE_EMULATOR_HOST=localhost:8080

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--id') out.id = args[++i];
    else if (a === '--promo') out.promo = args[++i];
    else if (a === '--file') out.file = args[++i];
    else if (a === '--help') out.help = true;
  }
  return out;
}

async function main() {
  const opts = parseArgs();
  if (opts.help || (!opts.id && !opts.file)) {
    console.log('Usage: node tools/setPromo.js --id <docId> --promo <percent>');
    console.log('   or: node tools/setPromo.js --file <path-to-json-array>');
    process.exit(0);
  }

  // Initialize admin SDK
  try {
    admin.initializeApp();
  } catch (e) {
    // already initialized
  }
  const db = admin.firestore();

  if (opts.file) {
    const fpath = path.resolve(opts.file);
    if (!fs.existsSync(fpath)) {
      console.error('File not found:', fpath);
      process.exit(1);
    }
    const content = JSON.parse(fs.readFileSync(fpath, 'utf8'));
    if (!Array.isArray(content)) {
      console.error('JSON file must contain an array of game objects');
      process.exit(1);
    }
    for (const game of content) {
      const id = game.id || game.title || game.name;
      if (!id) {
        console.warn('Skipping entry without id/title/name', game);
        continue;
      }
      const promo = game.promo != null ? Number(game.promo) : (game.promo_price != null ? null : undefined);
      const data = {};
      if (promo != null) data.promo = promo;
      if (game.promo_price != null) data.promo_price = Number(game.promo_price);
      if (Object.keys(data).length === 0) {
        console.log(`No promo fields for ${id}, skipping.`);
        continue;
      }
      await db.collection('games').doc(String(id)).set(data, { merge: true });
      console.log(`Updated ${id} ->`, data);
    }
    process.exit(0);
  }

  // Single id mode
  const id = opts.id;
  const promo = opts.promo != null ? Number(opts.promo) : null;
  if (promo == null) {
    console.error('--promo is required when using --id');
    process.exit(1);
  }
  await db.collection('games').doc(String(id)).set({ promo: promo }, { merge: true });
  console.log(`Set promo ${promo}% for game ${id}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
