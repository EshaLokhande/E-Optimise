const Database = require('better-sqlite3');
const path = require('path');

// Creates a file called eoptimise.db in your backend folder
const db = new Database(path.join(__dirname, 'eoptimise.db'));

// Create tables when server starts
db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    type TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Save a new analysis
function saveAnalysis(code, language, type, result) {
  try {
    console.log(`[DB] Saving ${type} analysis for ${language}...`);
    const stmt = db.prepare(
      'INSERT INTO analyses (code, language, type, result) VALUES (?, ?, ?, ?)'
    );
    const res = stmt.run(code, language, type, JSON.stringify(result));
    console.log(`[DB] Saved with ID: ${res.lastInsertRowid}`);
    return res;
  } catch (err) {
    console.error(`[DB] Save failed: ${err.message}`);
    throw err;
  }
}

// Get all past analyses
function getAnalyses() {
  return db.prepare('SELECT * FROM analyses ORDER BY created_at DESC').all();
}

// Get last 10 analyses
function getRecentAnalyses(limit = 10) {
  return db.prepare('SELECT * FROM analyses ORDER BY created_at DESC LIMIT ?').all(limit);
}

module.exports = { saveAnalysis, getAnalyses, getRecentAnalyses };