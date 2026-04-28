const express = require('express');
const axios = require('axios');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const TRENDS_URL = process.env.TRENDS_SERVICE_URL || 'http://localhost:8000';

// GET /api/trends?niche=tech
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { niche = 'technology', geo = 'US' } = req.query;
    const response = await axios.get(`${TRENDS_URL}/trends`, {
      params: { niche, geo },
      timeout: 10000
    });
    res.json(response.data);
  } catch (err) {
    logger.warn('Trends service error', { error: err.message });
    // Return mock data if trends service is down
    res.json({
      niche: req.query.niche || 'technology',
      trending_keywords: ['AI tools', 'automation', 'productivity', 'digital marketing', 'content strategy'],
      rising_queries: ['AI content generator', 'marketing automation 2024', 'SEO trends'],
      geo_data: [],
      mock: true
    });
  }
});

// GET /api/trends/dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { niche = 'technology' } = req.query;
    const response = await axios.get(`${TRENDS_URL}/dashboard`, {
      params: { niche },
      timeout: 10000
    });
    res.json(response.data);
  } catch (err) {
    logger.warn('Trends dashboard error', { error: err.message });
    res.json({
      trending: ['AI', 'Machine Learning', 'Automation', 'No-Code', 'SaaS'],
      scores: [95, 88, 82, 75, 70],
      mock: true
    });
  }
});

module.exports = router;
