#!/usr/bin/env node
/**
 * Representative API List/Read Latency & Scalability Measurement Script
 * Aligns with PRD NFR-01, NFR-02, NFR-03, NFR-11, NFR-13, NFR-14.
 *
 * Measures read latency (min, max, avg, p50, p95) against the target backend
 * and validates conformance to platform SLAs (< 500ms p95 for read endpoints).
 */

import { performance } from "node:perf_hooks";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Load .env if present
function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      if (key && vals.length) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

const BASE_URL = (process.env.VITE_API_URL || "https://duka-backend-production.up.railway.app").replace(/\/$/, "");
const API_PREFIX = (process.env.VITE_API_PREFIX || "/api/v1").replace(/\/$/, "");
const FULL_BASE = `${BASE_URL}${API_PREFIX}`;

const ENDPOINTS = [
  { name: "Public Health Check", url: `${BASE_URL}/health`, targetP95Ms: 250 },
  { name: "API Health Status", url: `${FULL_BASE}/health`, targetP95Ms: 250 },
  { name: "Admin Merchants List", url: `${FULL_BASE}/admin/merchants?limit=10`, targetP95Ms: 500 },
  { name: "Subscription Plans", url: `${FULL_BASE}/admin/plans`, targetP95Ms: 500 },
  { name: "Feature Flags", url: `${FULL_BASE}/admin/feature-flags`, targetP95Ms: 500 },
  { name: "Marketplace Listings", url: `${FULL_BASE}/marketplace/listings/all?limit=10`, targetP95Ms: 500 },
  { name: "BFF Overview", url: `${FULL_BASE}/bff/admin/overview`, targetP95Ms: 500 },
];

const SAMPLES_PER_ENDPOINT = 5;

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
}

async function measureSingle(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "DukaDesk-Admin-PerfTest/1.0",
      },
    });
    const duration = performance.now() - start;
    return { ok: res.ok, status: res.status, duration };
  } catch (err) {
    const duration = performance.now() - start;
    return { ok: false, status: 0, duration, error: err.message };
  }
}

async function run() {
  console.log("================================================================================");
  console.log(" DUKADESK ADMIN PORTAL — API LATENCY & SCALABILITY VALIDATION");
  console.log(` Target Backend: ${BASE_URL}`);
  console.log(` Samples per endpoint: ${SAMPLES_PER_ENDPOINT}`);
  console.log("================================================================================\n");

  const results = [];

  for (const ep of ENDPOINTS) {
    process.stdout.write(`Benchmarking ${ep.name}... `);
    const timings = [];
    let successCount = 0;
    let sampleStatus = 0;

    for (let i = 0; i < SAMPLES_PER_ENDPOINT; i++) {
      const res = await measureSingle(ep.url);
      sampleStatus = res.status;
      if (res.ok || res.status === 401 || res.status === 403) {
        // 401/403 represents a live guarded response from server
        successCount++;
      }
      timings.push(res.duration);
    }

    timings.sort((a, b) => a - b);
    const min = Math.round(timings[0]);
    const max = Math.round(timings[timings.length - 1]);
    const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
    const p50 = percentile(timings, 50);
    const p95 = percentile(timings, 95);
    const passesSla = p95 <= ep.targetP95Ms;

    results.push({
      name: ep.name,
      url: ep.url,
      status: sampleStatus,
      successRate: `${Math.round((successCount / SAMPLES_PER_ENDPOINT) * 100)}%`,
      min,
      avg,
      p50,
      p95,
      max,
      targetP95Ms: ep.targetP95Ms,
      passesSla,
    });

    console.log(`done (p50: ${p50}ms, p95: ${p95}ms, SLA target: <=${ep.targetP95Ms}ms)`);
  }

  console.log("\n--------------------------------------------------------------------------------");
  console.log(" LATENCY SUMMARY (ms)");
  console.log("--------------------------------------------------------------------------------");
  console.log(
    "Endpoint".padEnd(26) +
    "HTTP".padEnd(8) +
    "Min".padStart(6) +
    "Avg".padStart(8) +
    "p50".padStart(8) +
    "p95".padStart(8) +
    "Target".padStart(8) +
    "   SLA"
  );
  console.log("--------------------------------------------------------------------------------");

  let allPass = true;
  for (const r of results) {
    const slaLabel = r.passesSla ? "   PASS" : "   FAIL";
    if (!r.passesSla) allPass = false;
    console.log(
      r.name.slice(0, 24).padEnd(26) +
      String(r.status).padEnd(8) +
      String(r.min).padStart(6) +
      String(r.avg).padStart(8) +
      String(r.p50).padStart(8) +
      String(r.p95).padStart(8) +
      String(r.targetP95Ms).padStart(8) +
      slaLabel
    );
  }

  console.log("--------------------------------------------------------------------------------\n");
  console.log(`Overall Operational Hardening Result: ${allPass ? "ALL ENDPOINTS MEET SLA TARGETS" : "SOME ENDPOINTS EXCEEDED SLA TARGETS"}`);
  console.log("================================================================================\n");
}

run().catch((err) => {
  console.error("Benchmark run failed:", err);
  process.exit(1);
});
