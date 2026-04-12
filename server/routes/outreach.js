const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { sendOutreachEmail, generateWhatsAppMessage } = require('../jobs/outreachEngine');

// POST send email to one lead
router.post('/email/:id', async (req, res) => {
  const success = await sendOutreachEmail(req.params.id);
  if (success) {
    res.json({ message: 'Email sent successfully' });
  } else {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// POST batch send emails
router.post('/batch-email', async (req, res) => {
  try {
    const leads = await db.prepare('SELECT id FROM leads WHERE email IS NOT NULL AND email_sent = 0').all();
    let successCount = 0;
    for (const lead of leads) {
      const success = await sendOutreachEmail(lead.id);
      if (success) successCount++;
    }
    res.json({ message: `Batch email outreach complete. ${successCount} emails sent.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST mark as queued for WhatsApp
router.post('/whatsapp/:id', async (req, res) => {
  try {
    const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const message = generateWhatsAppMessage(lead);
    await db.prepare(`
      UPDATE leads SET status = 'whatsapped', whatsapp_sent = 1, outreach_count = outreach_count + 1, last_contacted = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'WhatsApp message queued', content: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST batch queue WhatsApp
router.post('/batch-whatsapp', async (req, res) => {
  try {
    const leads = await db.prepare('SELECT id FROM leads WHERE whatsapp_sent = 0').all();
    for (const lead of leads) {
      await db.prepare(`
        UPDATE leads SET status = 'whatsapped', whatsapp_sent = 1, outreach_count = outreach_count + 1, last_contacted = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(lead.id);
    }
    res.json({ message: `Batch WhatsApp outreach complete. ${leads.length} leads queued.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET WhatsApp queue
router.get('/queue', async (req, res) => {
  try {
    const leads = await db.prepare('SELECT * FROM leads WHERE status = "whatsapped" ORDER BY last_contacted DESC').all();
    const queue = leads.map(lead => ({
      ...lead,
      message: generateWhatsAppMessage(lead)
    }));
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH mark WhatsApp as sent
router.patch('/queue/:id/sent', async (req, res) => {
  try {
    const result = await db.prepare('UPDATE leads SET status = "contacted" WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'WhatsApp marked as sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
