import bcrypt from 'bcrypt';
import { findUserByUsername } from '../models/auth_model.js';

/**
 * Handle POST /api/auth/login
 */
export function login(req, res) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required.'
    });
  }

  try {
    const user = findUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.'
      });
    }

    // Establish session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    return res.status(200).json({
      success: true,
      user: req.session.user
    });
  } catch (err) {
    console.error('[AuthController] Login Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.'
    });
  }
}

/**
 * Handle POST /api/auth/logout
 */
export function logout(req, res) {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[AuthController] Logout Error:', err);
        return res.status(500).json({ success: false, error: 'Failed to destroy session' });
      }
      res.clearCookie('stat_session');
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  } else {
    return res.status(200).json({ success: true, message: 'No active session to logout' });
  }
}

/**
 * Handle GET /api/auth/me
 */
export function me(req, res) {
  if (req.session && req.session.user) {
    return res.status(200).json({
      authenticated: true,
      user: req.session.user
    });
  }
  return res.status(200).json({
    authenticated: false,
    user: null
  });
}
