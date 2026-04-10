import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'game.db');

// Initialize database
const dbInstance = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  }
});

// Promisify database operations
const db = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbInstance.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbInstance.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbInstance.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },
  
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      dbInstance.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

/**
 * Initialize database schema
 */
export async function initializeDatabase() {
  try {
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

    // Players table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(32) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_sync DATETIME
      )
    `);

    // Player stats (cache of their game progress)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS player_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER UNIQUE REFERENCES players(id) ON DELETE CASCADE,
        total_xp BIGINT DEFAULT 0,
        prestige_level INTEGER DEFAULT 0,
        avg_level INTEGER DEFAULT 1,
        playtime_seconds INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sync log (track changes for consistency)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        action VARCHAR(50),
        skill_id VARCHAR(32),
        amount BIGINT,
        details TEXT,
        server_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        client_timestamp DATETIME
      )
    `);

    // Guilds (no member limits)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS guilds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(64) UNIQUE NOT NULL,
        leader_id INTEGER REFERENCES players(id),
        description TEXT,
        treasury_eurodollars BIGINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Guild members
    await db.exec(`
      CREATE TABLE IF NOT EXISTS guild_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        contribution_xp BIGINT DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(guild_id, player_id)
      )
    `);

    // Guild chat
    await db.exec(`
      CREATE TABLE IF NOT EXISTS guild_chat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id INTEGER REFERENCES guilds(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id),
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Events
    await db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(128),
        type VARCHAR(50),
        start_time DATETIME,
        end_time DATETIME,
        reward_xp INTEGER,
        reward_currency INTEGER,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Event participation
    await db.exec(`
      CREATE TABLE IF NOT EXISTS event_participation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, player_id)
      )
    `);

    console.log('✓ Database schema initialized');
    return db;
  } catch (err) {
    console.error('✗ Database initialization failed:', err);
    throw err;
  }
}

export { db };
