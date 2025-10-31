// db.js
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './ym_mining.db';

const db = new sqlite3.Database(DB_PATH);

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      ym_balance INTEGER DEFAULT 0,
      usdt_balance REAL DEFAULT 0.0
    );`);
    db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      usdt_amount REAL,
      address TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);
  });
}

function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { db, init, run, get, all };

