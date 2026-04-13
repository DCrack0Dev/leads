const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const { startScheduler } = require('./jobs/scheduler');
const { findLeads, REGIONAL_GROUPS } = require('./jobs/leadFinder');

// Routes
const leadsRoutes = require('./routes/leads');
const outreachRoutes = require('./routes/outreach');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');
const voiceRoutes = require('./routes/voice');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Added for Twilio webhooks
app.use(morgan('dev'));

// Static files for demos
app.use('/demos', express.static(path.join(__dirname, '../public/demos')));

// API Routes
app.use('/api/leads', leadsRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// Bot status and manual run
let isBotRunning = false;
let lastBotLog = '';

app.post('/api/bot/run', async (req, res) => {
  if (isBotRunning) return res.status(400).json({ error: 'Bot is already running' });
  
  const { group } = req.body;
  
  isBotRunning = true;
  lastBotLog = `Bot started manual run for ${group || 'next scheduled group'} at ` + new Date().toISOString() + '\n';
  
  // Non-blocking run
  findLeads(group, (logLine) => {
    lastBotLog += logLine + '\n';
  })
    .then(() => {
      isBotRunning = false;
      lastBotLog += 'Bot finished manual run at ' + new Date().toISOString() + '\n';
    })
    .catch(err => {
      isBotRunning = false;
      lastBotLog += 'Bot failed: ' + err.message + '\n';
    });

  res.json({ message: 'Bot started' });
});

app.get('/api/bot/status', (req, res) => {
  res.json({ running: isBotRunning, log: lastBotLog });
});

app.get('/api/bot/logs', (req, res) => {
  res.json({ log: lastBotLog });
});

app.get('/api/bot/groups', (req, res) => {
  const groups = Object.keys(REGIONAL_GROUPS).map(key => ({
    id: key,
    label: key.replace(/_/g, ' ').toUpperCase(),
    cityCount: REGIONAL_GROUPS[key].cities.length
  }));
  res.json(groups);
});

// Cron endpoint for Vercel
app.get('/api/bot-run', async (req, res) => {
  // Use a secret key to prevent unauthorized triggers if needed
  // For now, we'll just run a small batch
  try {
    console.log('Cron job triggered: /api/bot-run');
    // We can logic here to pick a group or city that hasn't been scanned recently
    const groups = Object.keys(REGIONAL_GROUPS);
    const randomGroup = groups[Math.floor(Math.random() * groups.length)];
    
    // In a serverless environment, we must await the result because the function 
    // will be terminated as soon as the response is sent.
    // To stay under the timeout, we should modify findLeads to support smaller chunks.
    await findLeads(randomGroup, (logLine) => console.log(logLine));
    
    res.json({ message: `Cron run successful for ${randomGroup}` });
  } catch (error) {
    console.error('Cron job failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server if not running on Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
    
    // Start cron scheduler
    startScheduler();
  });
}

module.exports = app;
