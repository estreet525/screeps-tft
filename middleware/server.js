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
  const url = `${SCREEPS_HOST}/api/user/memory?path=dashboard&shard=${encodeURIComponent(SHARD)}`;

  const res = await fetch(url, {
    headers: {
      "X-Token": TOKEN
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Screeps API ${res.status}: ${text}`);
  }

  const body = await res.json();

  // body.data is a JSON string representing Memory.dashboard
  // Example: { ok: 1, data: "{\"v\":1,\"tick\":...}" }
  if (!body || body.ok !== 1) return null;
  if (!body.data) return null;

  try {
    return JSON.parse(body.data);
  } catch {
    return null;
  }
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Middleware running: http://localhost:${PORT}/snapshot`);
});
