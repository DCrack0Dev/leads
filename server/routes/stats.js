const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET dashboard stats
router.get('/', async (req, res) => {
  try {
    const totalLeadsRes = await db.prepare('SELECT COUNT(*) as count FROM leads').get();
    const newTodayRes = await db.prepare('SELECT COUNT(*) as count FROM leads WHERE date_found = ?').get(new Date().toISOString().split('T')[0]);
    const emailsSentTodayRes = await db.prepare('SELECT COUNT(*) as count FROM outreach_log WHERE channel = "email" AND DATE(sent_at) = DATE("now")').get();
    const repliesReceivedRes = await db.prepare('SELECT COUNT(*) as count FROM leads WHERE reply_received = 1').get();

    res.json({
      totalLeads: totalLeadsRes.count,
      newToday: newTodayRes.count,
      emailsSentToday: emailsSentTodayRes.count,
      repliesReceived: repliesReceivedRes.count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET pipeline counts
router.get('/pipeline', async (req, res) => {
  try {
    const pipeline = await db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status').all();
    res.json(pipeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET recent activity
router.get('/activity', async (req, res) => {
  try {
    const activity = await db.prepare(`
      SELECT l.business_name, o.channel, o.sent_at as timestamp, o.status
      FROM outreach_log o
      JOIN leads l ON o.lead_id = l.id
      ORDER BY o.sent_at DESC
      LIMIT 10
    `).all();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
