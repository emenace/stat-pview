import bcrypt from 'bcrypt';
import { getAllUsers, getUserById, getUserByUsername, createUser, updateUser, deleteUser } from '../models/user_model.js';

export function getListUsers(req, res) {
  try {
    const users = getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error('[UserController] getListUsers error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
}

export function createNewUser(req, res) {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    if (username.toLowerCase() === 'root') {
      return res.status(400).json({ success: false, error: 'Cannot create another Root user' });
    }

    const existingUser = getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const newUser = createUser(username, hash, role || 'user');
    
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error('[UserController] createNewUser error:', err);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
}

export function editUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { username, password, role } = req.body;
    const currentUser = req.session.user; // The admin performing the request

    const targetUser = getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Protection for Root
    if (targetUser.username === 'Root') {
      if (currentUser.username !== 'Root') {
        return res.status(403).json({ success: false, error: 'Only Root can edit the Root account.' });
      }
      // If it is Root editing themselves, they cannot change their own username or demote themselves.
      if (username && username !== 'Root') {
        return res.status(400).json({ success: false, error: 'Root username cannot be changed.' });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({ success: false, error: 'Root role must remain admin.' });
      }
    } else {
      // Prevent other users from taking the username 'Root'
      if (username && username.toLowerCase() === 'root') {
        return res.status(400).json({ success: false, error: 'Cannot rename user to Root.' });
      }
    }

    // Check username collision if username is changed
    if (username && username !== targetUser.username) {
      const existing = getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Username already in use.' });
      }
    }

    const newUsername = username || targetUser.username;
    const newRole = role || targetUser.role;
    let newHash = null;

    if (password) {
      newHash = bcrypt.hashSync(password, 10);
    }

    updateUser(id, newUsername, newHash, newRole);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error('[UserController] editUser error:', err);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
}

export function removeUser(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    
    const targetUser = getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (targetUser.username === 'Root') {
      return res.status(403).json({ success: false, error: 'The Root superuser cannot be deleted.' });
    }

    deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('[UserController] removeUser error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
}
