#!/usr/bin/env node
// Performance baseline guard: fails the build if the production bundle exceeds
// the documented budgets. No third-party dependencies (node:zlib only).
//
// Run after `npm run build` (with VITE_API_URL set). Budgets carry ~30% headroom
// over the recorded baseline so normal growth passes while regressions trip CI.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const DIST_ASSETS = join(process.cwd(), "dist", "assets");

const BUDGETS = {
  largestJsGzipKb: 140,
  totalJsGzipKb: 320,
  totalCssGzipKb: 45,
  totalRawKb: 900,
};

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

function gzipSize(file) {
  return gzipSync(readFileSync(file), { level: 9 }).length;
}

function collect(ext) {
  let entries;
  try {
    entries = readdirSync(DIST_ASSETS).filter((name) => name.endsWith(ext));
  } catch {
    console.error(`Bundle size check: no build output found at ${DIST_ASSETS}`);
    console.error("Run `npm run build` first (with VITE_API_URL set).");
    process.exit(1);
  }
  return entries
    .map((name) => {
      const file = join(DIST_ASSETS, name);
      return { name, raw: statSync(file).size, gzip: gzipSize(file) };
    })
    .sort((a, b) => b.gzip - a.gzip);
}

function total(entries, key) {
  return entries.reduce((sum, entry) => sum + entry[key], 0);
}

function check(label, actualKb, budgetKb) {
  const ok = actualKb <= budgetKb;
  const marker = ok ? "OK " : "OVER";
  console.log(
    `  ${marker} ${label}: ${actualKb.toFixed(1)} kB (budget ${budgetKb.toFixed(1)} kB)`
  );
  return ok;
}

const js = collect(".js");
const css = collect(".css");

const largestJs = js[0] ?? { name: "(none)", gzip: 0 };
const totalJsGzip = kb(total(js, "gzip"));
const totalCssGzip = kb(total(css, "gzip"));
const totalRaw = kb(total(js, "raw") + total(css, "raw"));

console.log("Bundle size report (gzip)");
for (const entry of js.slice(0, 10)) {
  console.log(`  ${entry.gzip.toString().padStart(8)}  ${entry.name}`);
}
if (js.length > 10) console.log(`  ... and ${js.length - 10} more JS chunks`);
console.log(`  (JS: ${js.length} files, CSS: ${css.length} files)`);
console.log("");

let ok = true;
ok = check("Largest JS chunk", kb(largestJs.gzip), BUDGETS.largestJsGzipKb) && ok;
ok = check("Total JS", totalJsGzip, BUDGETS.totalJsGzipKb) && ok;
ok = check("Total CSS", totalCssGzip, BUDGETS.totalCssGzipKb) && ok;
ok = check("Total raw output", totalRaw, BUDGETS.totalRawKb) && ok;

console.log("");
if (!ok) {
  console.error("Bundle size budgets exceeded. See report above.");
  process.exit(1);
}
console.log("All bundle size budgets satisfied.");
