const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');
const logger = require('../utils/logger');

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    if (supabase) {
      const { data: existing } = await supabase
        .from('users').select('id').eq('email', email).single();
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const { data, error } = await supabase.from('users').insert([
        { id: userId, name, email, password_hash: passwordHash, created_at: new Date().toISOString() }
      ]).select().single();

      if (error) throw error;
      const token = generateToken(data);
      logger.info('New user registered', { email, userId });
      return res.status(201).json({ token, user: { id: data.id, name: data.name, email: data.email } });
    }

    // Fallback: in-memory (demo mode)
    const user = { id: userId, name, email, password_hash: passwordHash };
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: userId, name, email } });
  } catch (err) {
    logger.error('Signup error', { error: err.message });
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    if (supabase) {
      const { data: user, error } = await supabase
        .from('users').select('*').eq('email', email).single();
      if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = generateToken(user);
      logger.info('User logged in', { email });
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    }

    // Demo mode fallback
    return res.status(503).json({ error: 'Database not configured. Using demo mode.' });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
