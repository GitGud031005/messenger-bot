/**
 * Helper script: Encode appstate.json → base64 string for cloud deployment.
 *
 * Usage:
 *   node scripts/encode-appstate.js
 *
 * It reads appstate.json from the project root and outputs a base64 string
 * that you can paste into the APPSTATE_BASE64 environment variable on Render.
 */
import fs from "fs";
import path from "path";

const appstatePath = path.resolve("appstate.json");

if (!fs.existsSync(appstatePath)) {
  console.error("❌ appstate.json not found in project root!");
  console.error("   Export it using the C3C UFC Utility browser extension first.");
  process.exit(1);
}

const raw = fs.readFileSync(appstatePath, "utf8");

// Validate it's valid JSON
try {
  JSON.parse(raw);
} catch {
  console.error("❌ appstate.json is not valid JSON!");
  process.exit(1);
}

const base64 = Buffer.from(raw).toString("base64");

console.log("✅ Base64-encoded appstate (copy this entire string):\n");
console.log(base64);
console.log("\n📋 Paste this as the APPSTATE_BASE64 environment variable on Render.");
console.log(`   String length: ${base64.length} characters`);
