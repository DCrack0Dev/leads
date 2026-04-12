const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'demitech.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath);

// Promisify some common operations for easier use if needed, 
// but we'll stick to the core methods for now to keep it simple.
// We'll also add a helper to run the schema synchronously on init.

const schema = fs.readFileSync(schemaPath, 'utf8');

db.serialize(() => {
  // Split schema by semicolon to run multiple statements if needed, 
  // though sqlite3.Database.exec handles multiple statements.
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database schema:', err.message);
    } else {
      console.log('Database initialized successfully.');
    }
  });
});

// Helper for better-sqlite3 style 'prepare().get()' / 'prepare().run()' / 'prepare().all()'
// but implemented using standard sqlite3 (callback based or async)
const dbHelpers = {
  prepare: (sql) => ({
    get: (...params) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }),
    run: (...params) => new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    }),
    all: (...params) => new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  }),
  // For synchronous-ish usage like better-sqlite3, we'll need to be careful.
  // Express routes and jobs will need to be updated to be async.
  _db: db
};

module.exports = dbHelpers;
