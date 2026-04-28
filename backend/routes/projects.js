const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../utils/supabase');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory fallback for demo
const inMemoryProjects = {};

// GET /api/projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data);
    }
    const userProjects = Object.values(inMemoryProjects).filter(p => p.user_id === userId);
    res.json(userProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (err) {
    logger.error('Fetch projects error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, content, contentType, tone, industry, keywords, seoScore } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const project = {
      id: uuidv4(),
      user_id: req.user.id,
      title,
      content,
      content_type: contentType,
      tone,
      industry,
      keywords,
      seo_score: seoScore || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('projects').insert([project]).select().single();
      if (error) throw error;
      logger.info('Project saved', { projectId: data.id, userId: req.user.id });
      return res.status(201).json(data);
    }

    inMemoryProjects[project.id] = project;
    res.status(201).json(project);
  } catch (err) {
    logger.error('Save project error', { error: err.message });
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };

    if (supabase) {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .eq('user_id', req.user.id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    if (!inMemoryProjects[id]) return res.status(404).json({ error: 'Project not found' });
    inMemoryProjects[id] = { ...inMemoryProjects[id], ...updates };
    res.json(inMemoryProjects[id]);
  } catch (err) {
    logger.error('Update project error', { error: err.message });
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (supabase) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', req.user.id);
      if (error) throw error;
      return res.json({ message: 'Project deleted' });
    }

    delete inMemoryProjects[id];
    res.json({ message: 'Project deleted' });
  } catch (err) {
    logger.error('Delete project error', { error: err.message });
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
