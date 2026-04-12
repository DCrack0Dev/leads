const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { checkWebsiteQuality } = require('../jobs/websiteChecker');

// POST enrich single lead email & score
router.post('/:id/enrich', async (req, res) => {
  try {
    const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead || !lead.website) return res.status(404).json({ error: 'Lead with website not found' });

    const { score, issues, email } = await checkWebsiteQuality(lead.website);
    
    const updates = [];
    const params = [];

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    
    updates.push('website_score = ?', 'website_issues = ?');
    params.push(score, JSON.stringify(issues));
    
    params.push(req.params.id);
    
    await db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    
    return res.json({ 
      message: 'Lead enriched!', 
      email: email || lead.email,
      score,
      issues
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all leads
router.get('/', async (req, res) => {
  const { status, city, niche, lead_type } = req.query;
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (city) {
    query += ' AND city = ?';
    params.push(city);
  }
  if (niche) {
    query += ' AND niche = ?';
    params.push(niche);
  }
  if (lead_type) {
    query += ' AND lead_type = ?';
    params.push(lead_type);
  }

  query += ' ORDER BY created_at DESC';
  try {
    const leads = await db.prepare(query).all(...params);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update lead
router.patch('/:id', async (req, res) => {
  const { status, notes, email } = req.body;
  const { id } = req.params;

  const updates = [];
  const params = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }

  if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

  params.push(id);
  try {
    const stmt = db.prepare(`UPDATE leads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
    const result = await stmt.run(...params);

    if (result.changes === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all leads
router.delete('/', async (req, res) => {
  try {
    await db.prepare('DELETE FROM leads').run();
    res.json({ message: 'All leads deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE lead
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
