const express = require("express");
const dotenv = require("dotenv");
const pako = require("pako");

dotenv.config();

const SCREEPS_HOST = "https://screeps.com";
const TOKEN = process.env.SCREEPS_TOKEN;
const SHARD = process.env.SCREEPS_SHARD || "shard3";
const PORT = Number(process.env.PORT || 3000);

if (!TOKEN) {
  console.error("❌ Missing SCREEPS_TOKEN. Add it to middleware/.env");
  process.exit(1);
}

function decodeScreepsMemoryData(data) {
  if (data == null) return null;

  // Sometimes it can already be an object
  if (typeof data === "object") return data;

  if (typeof data !== "string") return { raw: String(data) };

  const trimmed = data.trim();
  if (!trimmed) return null;

  // Screeps compressed format: "gz:<base64>"
  if (trimmed.startsWith("gz:")) {
    const b64 = trimmed.slice(3);
    const compressed = Buffer.from(b64, "base64");
    const inflated = pako.ungzip(compressed, { to: "string" });
    return JSON.parse(inflated);
  }

  // Normal JSON string
  return JSON.parse(trimmed);
}

async function getDashboardMemory() {
  const url =
    `${SCREEPS_HOST}/api/user/memory?path=dashboard` +
    `&shard=${encodeURIComponent(SHARD)}`;

  const res = await fetch(url, {
    headers: { "X-Token": TOKEN },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Screeps API ${res.status}: ${text}`);
  }

  const body = await res.json();

  if (!body || body.ok !== 1) return null;

  // body.data is the memory at path=dashboard (string or gz:string)
  return decodeScreepsMemoryData(body.data);
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
      dashboard,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Raw debug: shows the exact Screeps response body (useful while we’re setting up)
app.get("/snapshot-raw", async (req, res) => {
  try {
    const url =
      `${SCREEPS_HOST}/api/user/memory?path=dashboard` +
      `&shard=${encodeURIComponent(SHARD)}`;

    const r = await fetch(url, {
      headers: { "X-Token": TOKEN },
    });

    const text = await r.text();
    res.status(r.status).type("text/plain").send(text);
  } catch (err) {
    res.status(500).type("text/plain").send(String(err));
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Middleware running: http://localhost:${PORT}/snapshot`);
  console.log(`🧪 Raw debug:          http://localhost:${PORT}/snapshot-raw`);
});
