import session from 'express-session';
import db from './database.js';

// Create table if not exists for storing sessions
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    expired INTEGER NOT NULL,
    sess TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
`);

/**
 * A custom vanilla SQLite store for express-session
 * using our existing better-sqlite3 database connection.
 * Avoids MemoryStore warnings and persists sessions across server restarts.
 */
export class SqliteStore extends session.Store {
  constructor() {
    super();
    this.getStmt = db.prepare('SELECT sess FROM sessions WHERE sid = ? AND expired > ?');
    this.setStmt = db.prepare('INSERT OR REPLACE INTO sessions (sid, expired, sess) VALUES (?, ?, ?)');
    this.destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.clearExpiredStmt = db.prepare('DELETE FROM sessions WHERE expired <= ?');
    
    // Automatically clean up expired sessions every hour
    setInterval(() => {
      try {
        this.clearExpiredStmt.run(Date.now());
      } catch (err) {
        console.error('[SessionStore] Cleanup Error:', err);
      }
    }, 1000 * 60 * 60).unref();
  }

  get(sid, cb) {
    try {
      const now = Date.now();
      const row = this.getStmt.get(sid, now);
      if (!row) return cb(null, null);
      return cb(null, JSON.parse(row.sess));
    } catch (err) {
      return cb(err);
    }
  }

  set(sid, sess, cb) {
    try {
      // Default to 1 week if no maxAge is specified
      const maxAge = sess.cookie && sess.cookie.maxAge ? sess.cookie.maxAge : 7 * 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;
      this.setStmt.run(sid, expired, JSON.stringify(sess));
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }

  destroy(sid, cb) {
    try {
      this.destroyStmt.run(sid);
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }
}
