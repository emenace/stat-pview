import db from '../config/database.js';

export function getAllUsers() {
  return db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id ASC').all();
}

export function getUserById(id) {
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
}

export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function createUser(username, passwordHash, role) {
  const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
  const result = stmt.run(username, passwordHash, role);
  return { id: result.lastInsertRowid, username, role };
}

export function updateUser(id, username, passwordHash, role) {
  if (passwordHash) {
    const stmt = db.prepare('UPDATE users SET username = ?, password_hash = ?, role = ? WHERE id = ?');
    stmt.run(username, passwordHash, role, id);
  } else {
    const stmt = db.prepare('UPDATE users SET username = ?, role = ? WHERE id = ?');
    stmt.run(username, role, id);
  }
}

export function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}
