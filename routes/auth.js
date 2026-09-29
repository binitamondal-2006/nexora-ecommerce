const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateToken, authMiddleware } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = db.createUser({ name, email, password, phone, address });
    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = db.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken({ id: safeUser.id, email: safeUser.email, name: safeUser.name });

    res.json({
      message: 'Welcome back to Nexora!',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req, res) => {
  try {
    const updated = db.updateUserProfile(req.user.id, req.body);
    res.json({ message: 'Profile updated successfully!', user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', (req, res) => {
  res.json({
    demoAccounts: [
      {
        label: 'Aarav Sharma (Verified Shopper)',
        email: 'aarav@nexora.in',
        password: 'Password@123',
        description: 'Standard account with pre-saved Bengaluru address and previous orders'
      },
      {
        label: 'Priya Patel (Nexora VIP Member)',
        email: 'priya@nexora.in',
        password: 'Password@123',
        description: 'VIP Gold member with Mumbai address and exclusive discount eligibility'
      }
    ]
  });
});

module.exports = router;
