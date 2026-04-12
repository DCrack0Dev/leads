const cron = require('node-cron');
const { findLeads } = require('./leadFinder');
const { checkWebsiteQuality } = require('./websiteChecker');
const db = require('../db/database');
const config = require('../config');

async function enrichLeads() {
  console.log('Starting background email enrichment...');
  try {
    const leads = await db.prepare("SELECT * FROM leads WHERE (email IS NULL OR email = '') AND (website IS NOT NULL AND website != '') LIMIT 10").all();
    
    for (const lead of leads) {
      console.log(`Enriching ${lead.business_name} (${lead.website})...`);
      const { score, issues, email } = await checkWebsiteQuality(lead.website);
      
      if (email) {
        await db.prepare("UPDATE leads SET email = ? WHERE id = ?").run(email, lead.id);
        console.log(`Successfully enriched ${lead.business_name} with email: ${email}`);
      } else {
        console.log(`Could not find email for ${lead.business_name}`);
      }
      
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (error) {
    console.error('Enrichment job failed:', error.message);
  }
}

function startScheduler() {
  const [hour, minute] = config.botRunTime.split(':');
  
  // Run every day at the configured time
  cron.schedule(`${minute} ${hour} * * *`, async () => {
    console.log(`Starting scheduled bot run at ${config.botRunTime}...`);
    try {
      await findLeads();
      console.log('Scheduled bot run completed successfully.');
    } catch (error) {
      console.error('Scheduled bot run failed:', error.message);
    }
  });

  // Run enrichment job every hour
  cron.schedule('0 * * * *', enrichLeads);

  console.log(`Bot scheduler started. Next run scheduled for ${config.botRunTime} daily. Enrichment job runs hourly.`);
}

module.exports = { startScheduler, enrichLeads };
