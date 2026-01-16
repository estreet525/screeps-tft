const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const SCREEPS_HOST = "https://screeps.com";
const TOKEN = process.env.SCREEPS_TOKEN;
const SHARD = process.env.SCREEPS_SHARD || "shard1";
const PORT = Number(process.env.PORT || 3000);

if (!TOKEN) {
  console.error("❌ Missing SCREEPS_TOKEN. Add it to middleware/.env");
  process.exit(1);
}

async function getDashboardMemory() {
  // Using _token query param as an alternative auth method
  // (Docs: X-Token header OR _token query param are both valid)
  const url =
    `${SCREEPS_HOST}/api/user/memory?path=dashboard` +
    `&shard=${encodeURIComponent(SHARD)}` +
    `&_token=${encodeURIComponent(TOKEN)}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Screeps API ${res.status}: ${text}`);
  }

  const body = await res.json();

  // body.data can be:
  // - a JSON string (common)
  // - an object (some wrappers/libraries)
  // - null/undefined if the path doesn't exist on that shard
  if (!body || body.ok !== 1) return null;

  const d = body.data;

  if (d == null) return null;

  // If it's already an object, just return it
  if (typeof d === "object") return d;

  // If it's a string, try parsing JSON
  if (typeof d === "string") {
    const trimmed = d.trim();
    if (!trimmed) return null;

    try {
      return JSON.parse(trimmed);
    } catch {
      // If it's not JSON (e.g., "undefined"), return raw string so we can see it
      return { raw: trimmed };
    }
  }

  // Fallback for unexpected types
  return { raw: String(d) };
}


const app = express();

app.get("/health", (req, res) => {
  res.json({ ok: true, host: SCREEPS_HOST, shard: SHARD });
});

app.get("/snapshot", async (req, res) => {
  try {
    const dashboard = await getDashboardMemory();
    res.json({
      ok: true,
      fetchedAt: Date.now(),
      shard: SHARD,
      dashboard
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/snapshot-raw", async (req, res) => {
  const url =
    `${SCREEPS_HOST}/api/user/memory?path=dashboard` +
    `&shard=${encodeURIComponent(SHARD)}` +
    `&_token=${encodeURIComponent(TOKEN)}`;

  const r = await fetch(url);
  const text = await r.text();

  res.type("text/plain").send(text);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Middleware running: http://localhost:${PORT}/snapshot`);
});
