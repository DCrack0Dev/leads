const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all settings
router.get('/', async (req, res) => {
  try {
    const settings = await db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST save setting
router.post('/', async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) return res.status(400).json({ error: 'Key and value required' });

  try {
    await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    res.json({ message: 'Setting saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
