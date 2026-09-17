/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Production-build end-to-end check for analyzePortfolio. Needs network, the real
 * .env.local (Helius, Jupiter, Upstash, Groq) and a running production server:
 *
 *   bun run build && bun run start -p 3100     # in another terminal
 *   bun run test:e2e                            # or E2E_BASE_URL=http://host:port
 *
 * Calls the server action directly (id read from the build manifest), so no wallet
 * extension is needed. Covers: whale wallets (700–1,000 tokens) get a real AI summary
 * with no aiError, empty wallet, devnet branch, invalid address, per-wallet rate limit.
 */
import assert from "node:assert/strict";
import { generateKeyPairSigner } from "@solana/kit";
import manifest from "../.next/server/server-reference-manifest.json";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const ACTION = Object.keys((manifest as { node: Record<string, unknown> }).node)[0];
assert.ok(ACTION, "no server action in .next/server/server-reference-manifest.json — run bun run build");

// wait for server
for (let i = 0; i < 60; i++) {
  try { const r = await fetch(BASE + "/dashboard"); if (r.status === 200) break; } catch {}
  await new Promise(r => setTimeout(r, 500));
}
const html = await (await fetch(BASE + "/dashboard")).text();
assert.ok(html.includes("<html") && html.length > 5000, "dashboard HTML should render");
console.log("OK  GET /dashboard 200 (" + html.length + " bytes; AI card is client-rendered after wallet connect)");

async function call(wallet: string, cluster = "mainnet-beta") {
  const t0 = Date.now();
  const res = await fetch(BASE + "/dashboard", {
    method: "POST",
    headers: { "Next-Action": ACTION, Accept: "text/x-component", "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify([wallet, cluster]),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  // React flight rows: "id:T<hexlen>,<bytes>" (no trailing newline) or "id:<json>\n"
  const rows: Record<string, unknown> = {};
  let i = 0;
  while (i < buf.length) {
    while (buf[i] === 0x0a) i++;
    const colon = buf.indexOf(0x3a, i); if (colon < 0) break;
    const id = buf.subarray(i, colon).toString();
    if (buf[colon + 1] === 0x54) {
      const comma = buf.indexOf(0x2c, colon + 2);
      const len = parseInt(buf.subarray(colon + 2, comma).toString(), 16);
      rows[id] = buf.subarray(comma + 1, comma + 1 + len).toString("utf8");
      i = comma + 1 + len;
    } else {
      const nl = buf.indexOf(0x0a, colon + 1);
      const end = nl < 0 ? buf.length : nl;
      const raw = buf.subarray(colon + 1, end).toString();
      try { rows[id] = JSON.parse(raw); } catch { rows[id] = raw; }
      i = end + 1;
    }
  }
  const resolve = (v: any): any => {
    if (v === "$undefined") return undefined;
    if (typeof v === "string") { const m = v.match(/^\$(\d+)$/); return m && m[1] in rows ? rows[m[1]] : v; }
    if (Array.isArray(v)) return v.map(resolve);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolve(x)]));
    return v;
  };
  const text = buf.toString("utf8");
  let payload: any = null;
  for (const r of Object.values(rows)) if (r && typeof r === "object" && "success" in (r as object)) payload = resolve(r);
  return { payload, ms: Date.now() - t0, bytes: text.length, http: res.status };
}

function checkAI(d: any, label: string) {
  assert.equal(d.aiError, undefined, `${label}: aiError present: ${JSON.stringify(d.aiError)}`);
  assert.ok(typeof d.aiSummary === "string" && d.aiSummary.length > 300, `${label}: aiSummary too short (${d.aiSummary?.length})`);
  assert.ok(d.aiSummary.includes("**"), `${label}: no bold markdown highlights`);
  assert.ok(!/<(font|span)\b/i.test(d.aiSummary), `${label}: HTML tags leaked`);
  assert.ok(!/^(we need|the user|let me|okay,|first,)/i.test(d.aiSummary.trim()), `${label}: looks like leaked reasoning`);
}

const wallets: Record<string,string> = {
  "Binance 2": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "Binance hot": "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
  "Coinbase hot": "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE",
};

// 1. real wallets, mainnet
for (const [label, w] of Object.entries(wallets)) {
  const { payload, ms, bytes } = await call(w);
  assert.equal(payload.success, true, `${label}: ${JSON.stringify(payload.error)}`);
  const d = payload.data;
  assert.ok(d.holdings.length > 0, `${label}: no holdings`);
  checkAI(d, label);
  console.log(`OK  ${label.padEnd(12)} ${String(ms).padStart(5)}ms  holdings=${d.holdings.length} yieldGroups=${d.activeYieldOpportunities.length} hhi=${d.riskReport.hhiScore} aiChars=${d.aiSummary.length} bytes=${bytes}`);
  console.log(`    ↳ "${d.aiSummary.replace(/\s+/g," ").slice(0, 140)}…"`);
}

// 2. empty wallet → static empty text, no Groq call, no aiError
const fresh = (await generateKeyPairSigner()).address;
{
  const { payload, ms } = await call(fresh);
  assert.equal(payload.success, true);
  assert.equal(payload.data.holdings.length, 0);
  assert.equal(payload.data.aiError, undefined);
  assert.ok(payload.data.aiSummary.includes("appears to be empty"));
  console.log(`OK  empty wallet  ${ms}ms  static empty-portfolio text, no aiError`);
}

// 3. devnet branch (same fresh wallet; exercises cluster switch + devnet RPC)
{
  const { payload, ms } = await call(fresh, "devnet");
  assert.equal(payload.success, true, JSON.stringify(payload.error));
  assert.equal(payload.data.aiError, undefined);
  console.log(`OK  devnet        ${ms}ms  success=${payload.success} holdings=${payload.data.holdings.length}`);
}

// 4. invalid address → INVALID_WALLET, never reaches Groq
{
  const { payload } = await call("not-a-real-address");
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, "INVALID_WALLET");
  console.log("OK  invalid addr  INVALID_WALLET envelope");
}

// 5. rate limiter: 8 parallel calls on a fresh devnet wallet land inside one window
//    (empty wallet → no Groq call). Sliding window: first 5 pass, the rest are RATE_LIMITED.
{
  const w = (await generateKeyPairSigner()).address;
  const results = await Promise.all(Array.from({ length: 8 }, () => call(w, "devnet")));
  const ok = results.filter(r => r.payload.success).length;
  const limited = results.filter(r => !r.payload.success && r.payload.error.code === "RATE_LIMITED").length;
  const other = results.length - ok - limited;
  assert.equal(other, 0, "unexpected non-rate-limit failures");
  assert.ok(ok >= 5 && limited >= 1, `expected >=5 ok and >=1 RATE_LIMITED, got ok=${ok} limited=${limited}`);
  console.log(`OK  rate limit    8 parallel calls → ${ok} ok, ${limited} RATE_LIMITED (limit 5/60s per wallet)`);
}

console.log("\nALL E2E CHECKS PASSED");
