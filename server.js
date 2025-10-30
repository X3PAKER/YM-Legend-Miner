// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // phục vụ file index.html

// --- Database giả (trong RAM)
const users = {};
const withdraws = [];
const RATE = 1000; // 1000 YM = 1 USDT

// Đăng ký user
app.post("/api/register", (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ ok: false, error: "username required" });
  if (!users[username]) users[username] = { ym: 0, usdt: 0 };
  res.json({ ok: true, username });
});

// Lấy số dư
app.get("/api/balance", (req, res) => {
  const username = req.query.username;
  if (!username || !users[username])
    return res.json({ ok: false, error: "user not found" });
  res.json({ ok: true, username, ym: users[username].ym, usdt: users[username].usdt });
});

// Cộng YM (claim)
app.post("/api/credit", (req, res) => {
  const { username, ym_amount } = req.body;
  if (!username || !ym_amount || ym_amount <= 0)
    return res.json({ ok: false, error: "invalid data" });
  if (!users[username]) users[username] = { ym: 0, usdt: 0 };
  users[username].ym += ym_amount;
  res.json({ ok: true, username, ym: users[username].ym });
});

// Swap YM sang USDT
app.post("/api/swap", (req, res) => {
  const { username, ym_amount } = req.body;
  if (!username || !ym_amount || ym_amount <= 0)
    return res.json({ ok: false, error: "invalid data" });
  const u = users[username];
  if (!u) return res.json({ ok: false, error: "user not found" });
  if (u.ym < ym_amount)
    return res.json({ ok: false, error: "insufficient YM" });
  const usdtGain = ym_amount / RATE;
  u.ym -= ym_amount;
  u.usdt += usdtGain;
  res.json({ ok: true, username, ym: u.ym, usdt: u.usdt, swapped_usdt: usdtGain });
});

// Rút USDT
app.post("/api/withdraw", (req, res) => {
  const { username, usdt_amount, address } = req.body;
  if (!username || !usdt_amount || !address)
    return res.json({ ok: false, error: "missing fields" });
  const u = users[username];
  if (!u) return res.json({ ok: false, error: "user not found" });
  if (u.usdt < usdt_amount)
    return res.json({ ok: false, error: "insufficient balance" });

  u.usdt -= usdt_amount;
  const id = withdraws.length + 1;
  withdraws.push({ id, username, usdt_amount, address });
  res.json({ ok: true, id });
});

app.listen(PORT, () =>
  console.log(`✅ YM Legend Miner server running at http://localhost:${PORT}`)
);
