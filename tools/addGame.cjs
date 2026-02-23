#!/usr/bin/env node
// tools/addGame.cjs
// Usage:
//   node tools/addGame.cjs --file <path-to-json>
// Notes:
// - Requires Firebase Admin credentials via GOOGLE_APPLICATION_CREDENTIALS
// - If running against emulator set FIRESTORE_EMULATOR_HOST=localhost:8080

const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--file") out.file = args[++i];
    else if (a === "--help") out.help = true;
  }
  return out;
}

function normalizeToArray(content) {
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object") return [content];
  return [];
}

async function main() {
  const opts = parseArgs();
  if (opts.help || !opts.file) {
    console.log("Usage: node tools/addGame.cjs --file <path-to-json>");
    process.exit(0);
  }

  const fpath = path.resolve(opts.file);
  if (!fs.existsSync(fpath)) {
    console.error("File not found:", fpath);
    process.exit(1);
  }

  let content;
  try {
    content = JSON.parse(fs.readFileSync(fpath, "utf8"));
  } catch (err) {
    console.error("Invalid JSON:", err.message || err);
    process.exit(1);
  }

  const items = normalizeToArray(content);
  if (items.length === 0) {
    console.error("JSON must be an object or array of objects");
    process.exit(1);
  }

  try {
    admin.initializeApp();
  } catch (e) {
    // already initialized
  }

  const db = admin.firestore();

  for (const game of items) {
    const id = game.id;
    if (!id) {
      console.warn("Skipping entry without id", game);
      continue;
    }
    await db.collection("games").doc(String(id)).set(game, { merge: true });
    console.log(`Upserted game: ${id}`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
