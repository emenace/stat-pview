import db from '../config/database.js';

/**
 * Find user by username
 */
export function findUserByUsername(username) {
  const stmt = db.prepare('SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?');
  return stmt.get(username);
}

/**
 * Find user by ID (excluding password hash)
 */
export function findUserById(id) {
  const stmt = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}
