const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 3001,
  googleApiKey: process.env.GOOGLE_PLACES_API_KEY,
  locationIqApiKey: process.env.LOCATION_IQ_API_KEY,
  brevoApiKey: process.env.BREVO_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'demitechwebservices@gmail.com',
  fromName: process.env.FROM_NAME || 'Tebogo | Demitech Web Services',
  myPhone: process.env.MY_PHONE || '0650241517',
  myWebsite: process.env.MY_WEBSITE || 'https://demitechwebservice-website.vercel.app',
  forwardingInbox: process.env.FORWARDING_INBOX || 'finderleads007@outlook.com',
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  dailyEmailLimit: parseInt(process.env.DAILY_EMAIL_LIMIT) || 280,
  botRunTime: process.env.BOT_RUN_TIME || '08:00',
  websiteScoreThreshold: parseInt(process.env.WEBSITE_SCORE_THRESHOLD) || 44,
  
  // Twilio + ElevenLabs
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID,
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL
};
