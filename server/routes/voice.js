const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const axios = require('axios');
const db = require('../db/database');
const config = require('../config');

const VoiceResponse = twilio.twiml.VoiceResponse;

// POST /voice/call/:id - Initiate outbound call
router.post('/call/:id', async (req, res) => {
  try {
    const lead = await db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead || !lead.phone) {
      return res.status(404).json({ error: 'Lead with phone number not found' });
    }

    const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
    
    const call = await client.calls.create({
      url: `${config.webhookBaseUrl}/api/voice/outbound?lead_id=${lead.id}`,
      to: lead.phone,
      from: config.twilioPhoneNumber
    });

    // Update lead status
    await db.prepare("UPDATE leads SET call_status = 'calling', status = 'contacted' WHERE id = ?").run(lead.id);

    res.json({ message: 'Call initiated', callSid: call.sid });
  } catch (error) {
    console.error('Twilio Call Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /voice/outbound - Twilio callback to handle initial TwiML
router.post('/outbound', (req, res) => {
  const leadId = req.query.lead_id;
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: `${config.webhookBaseUrl}/api/voice/keypress?lead_id=${leadId}`,
    timeout: 10
  });

  // Message with ElevenLabs voice
  const message = "Hi, this is LeadFinder Pro. We help local businesses grow their online presence and attract more customers. If you'd like to learn more, press 1 now. If you're not interested, press 2 and we won't bother you again.";
  
  // Use ElevenLabs TTS via our proxy endpoint
  const ttsUrl = `${config.webhookBaseUrl}/api/voice/tts?text=${encodeURIComponent(message)}`;
  gather.play(ttsUrl);

  // If no input, hang up after 10 seconds (handled by timeout in gather)
  twiml.say('We didn\'t receive any input. Goodbye.');
  twiml.hangup();

  // Log "no response" initially, will be updated if they press something
  db.prepare("UPDATE leads SET call_status = 'no_response' WHERE id = ?").run(leadId);

  res.type('text/xml');
  res.send(twiml.toString());
});

// POST /voice/keypress - Handle user input
router.post('/keypress', async (req, res) => {
  const leadId = req.query.lead_id;
  const digits = req.body.Digits;
  const twiml = new VoiceResponse();

  if (digits === '1') {
    // Interested
    await db.prepare("UPDATE leads SET call_status = 'interested' WHERE id = ?").run(leadId);
    twiml.say('Connecting you now. Please hold.');
    twiml.dial(config.myPhone);
  } else if (digits === '2') {
    // Not interested
    await db.prepare("UPDATE leads SET call_status = 'not_interested' WHERE id = ?").run(leadId);
    twiml.say('Thank you for your time. Goodbye.');
    twiml.hangup();
  } else {
    // Invalid input
    twiml.say('Invalid input. Goodbye.');
    twiml.hangup();
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// GET /voice/tts - Proxy for ElevenLabs TTS
router.get('/tts', async (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).send('Text is required');

  try {
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenLabsVoiceId}`,
      data: {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      headers: {
        'xi-api-key': config.elevenLabsApiKey,
        'Accept': 'audio/mpeg'
      },
      responseType: 'stream'
    });

    res.set('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error) {
    console.error('ElevenLabs Error:', error.response?.data || error.message);
    // Fallback to Twilio Say if ElevenLabs fails
    const twiml = new VoiceResponse();
    twiml.say(text);
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

module.exports = router;
