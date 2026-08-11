const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { backupDir, dbPath, uploadDir } = require("./config");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(backupDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret TEXT DEFAULT NULL,
    totp_enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    tag TEXT DEFAULT '',
    published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    result TEXT NOT NULL,
    stack TEXT DEFAULT '',
    metric TEXT DEFAULT '',
    published INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    referrer TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const columns = db.prepare("PRAGMA table_info(posts)").all().map((row) => row.name);

if (!columns.includes("cover_url")) {
  db.prepare("ALTER TABLE posts ADD COLUMN cover_url TEXT DEFAULT ''").run();
}

if (!columns.includes("seo_title")) {
  db.prepare("ALTER TABLE posts ADD COLUMN seo_title TEXT DEFAULT ''").run();
}

if (!columns.includes("seo_description")) {
  db.prepare("ALTER TABLE posts ADD COLUMN seo_description TEXT DEFAULT ''").run();
}

module.exports = db;
