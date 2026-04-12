const axios = require('axios');
const db = require('../db/database');
const { checkWebsiteQuality } = require('./websiteChecker');
const { generateLandingPage } = require('./landingPageGenerator');
const config = require('../config');

const REGIONAL_GROUPS = {
  // South Africa (3 Groups)
  'sa_north': {
    country: 'South Africa',
    countryCode: 'ZA',
    cities: ['Johannesburg', 'Soweto', 'Sandton', 'Midrand', 'Randburg', 'Roodepoort', 'Pretoria', 'Centurion', 'Soshanguve', 'Polokwane', 'Nelspruit']
  },
  'sa_south': {
    country: 'South Africa',
    countryCode: 'ZA',
    cities: ['Cape Town', 'Bellville', 'Mitchells Plain', 'Khayelitsha', 'Port Elizabeth', 'East London', 'Kimberley']
  },
  'sa_east_central': {
    country: 'South Africa',
    countryCode: 'ZA',
    cities: ['Durban', 'uMlazi', 'Pinetown', 'Chatsworth', 'Phoenix (KZN)', 'Bloemfontein']
  },

  // USA (7 Groups)
  'usa_northeast': {
    country: 'USA',
    countryCode: 'US',
    cities: ['New York City', 'Boston', 'Philadelphia', 'Newark', 'Jersey City']
  },
  'usa_southeast': {
    country: 'USA',
    countryCode: 'US',
    cities: ['Miami', 'Jacksonville', 'Atlanta', 'Charlotte', 'Orlando', 'Tampa']
  },
  'usa_midwest': {
    country: 'USA',
    countryCode: 'US',
    cities: ['Chicago', 'Detroit', 'Indianapolis', 'Columbus', 'Milwaukee']
  },
  'usa_southwest': {
    country: 'USA',
    countryCode: 'US',
    cities: ['Phoenix (AZ)', 'Houston', 'San Antonio', 'Dallas', 'Austin', 'El Paso']
  },
  'usa_west_coast': {
    country: 'USA',
    countryCode: 'US',
    cities: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Seattle', 'Portland']
  },
  'usa_mountain': {
    country: 'USA',
    countryCode: 'US',
    cities: ['Denver', 'Las Vegas', 'Salt Lake City', 'Albuquerque', 'Boise']
  },
  'usa_central': {
    country: 'USA',
    countryCode: 'US',
    cities: ['Kansas City', 'Oklahoma City', 'Minneapolis', 'Omaha', 'Wichita']
  },

  // UK
  'uk_london': {
    country: 'United Kingdom',
    countryCode: 'GB',
    cities: ['London', 'Westminster', 'Camden', 'Islington', 'Hackney', 'Brixton', 'Croydon', 'Ealing']
  }
};

const NICHES = [
  'barbershop', 'hair salon', 'nail salon', 'beauty salon',
  'lash studio', 'spa', 'gym', 'personal trainer', 'yoga studio', 'pilates studio',
  'restaurant', 'takeaway', 'catering', 'home baker', 'food delivery', 'coffee shop', 'bakery',
  'plumber', 'electrician', 'painter', 'tiler', 'roofer', 'handyman', 'pest control',
  'driving school', 'car wash', 'auto repair', 'panel beater', 'tyre shop',
  'clothing store', 'tailoring', 'alterations', 'boutique',
  'tutoring', 'music lessons', 'dance studio', 'art school',
  'photography', 'videography', 'graphic design',
  'cleaning service', 'laundry service', 'dry cleaner',
  'funeral parlour', 'crèche', 'daycare', 'preschool',
  'lawyer', 'accountant', 'real estate agent', 'dentist', 'physiotherapist'
];

// Niches that are high-potential for web/mobile apps (booking, portals, etc.)
const APP_POTENTIAL_NICHES = [
  'gym', 'spa', 'restaurant', 'beauty salon', 'hair salon', 'tutoring', 'dance studio', 'crèche', 'daycare'
];

async function findLeads(targetGroup = null, onLog = null) {
  const locationIqKey = config.locationIqApiKey;
  
  const log = (msg) => {
    console.log(msg);
    if (onLog) onLog(msg);
  };

  if (!locationIqKey) {
    log('LocationIQ API key is missing. Please add it to your .env file.');
    return;
  }

  // Determine which group to search
  let groupKey = targetGroup;
  const allGroups = Object.keys(REGIONAL_GROUPS);

  if (!groupKey) {
    // Get last searched group from DB to cycle
    try {
      const lastGroupSetting = await db.prepare("SELECT value FROM settings WHERE key = 'last_searched_group'").get();
      const lastIndex = lastGroupSetting ? allGroups.indexOf(lastGroupSetting.value) : -1;
      const nextIndex = (lastIndex + 1) % allGroups.length;
      groupKey = allGroups[nextIndex];
    } catch (e) {
      groupKey = allGroups[0];
    }
  }

  if (!REGIONAL_GROUPS[groupKey]) {
    log(`Group ${groupKey} not found.`);
    return;
  }

  log(`REGION: ${groupKey.replace(/_/g, ' ').toUpperCase()}`);
  const group = REGIONAL_GROUPS[groupKey];
  const cities = group.cities;

  for (const city of cities) {
    for (const niche of NICHES) {
      log(`--- SEARCHING: ${niche.toUpperCase()} in ${city.toUpperCase()} ---`);
      
      try {
        const query = `${niche} ${city} ${group.country}`;
        
        // LocationIQ search with higher limit to find more results
        const params = {
          key: locationIqKey,
          q: query,
          format: 'json',
          addressdetails: 1,
          extratags: 1,
          countrycodes: group.countryCode.toLowerCase(), // Restrict results to specific country
          limit: 50 // Increased limit to find more businesses
        };

        // Add South African bias if searching in SA
        if (group.countryCode === 'ZA') {
          params.viewbox = '16.3,-34.9,32.9,-22.1';
          params.bounded = 1;
        }

        const response = await axios.get('https://us1.locationiq.com/v1/search.php', {
          params,
          headers: {
            'accept-language': group.countryCode === 'ZA' ? 'en-ZA' : 'en-US'
          }
        });

        const results = (response.data || []).map(p => {
          // Normalize LocationIQ data
          const name = p.display_name.split(',')[0];
          const address = p.display_name;
          
          // Improved phone extraction with country code awareness
          let rawPhone = p.extratags?.phone || p.extratags?.['contact:phone'] || p.extratags?.['phone:mobile'] || p.extratags?.['contact:mobile'];
          let formattedPhone = rawPhone || '';
          
          if (rawPhone) {
            // Clean phone number (remove spaces, dashes, etc.)
            let cleaned = rawPhone.replace(/\D/g, '');
            
            // Add country code if missing
            if (group.countryCode === 'ZA') {
              if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = '27' + cleaned.substring(1);
              if (cleaned.length === 9) cleaned = '27' + cleaned;
              if (!cleaned.startsWith('27')) cleaned = '27' + cleaned; // Fallback
              formattedPhone = '+' + cleaned;
            } else if (group.countryCode === 'US') {
              if (cleaned.length === 10) cleaned = '1' + cleaned;
              formattedPhone = '+' + cleaned;
            } else if (group.countryCode === 'GB') {
              if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = '44' + cleaned.substring(1);
              if (cleaned.length === 10) cleaned = '44' + cleaned;
              formattedPhone = '+' + cleaned;
            }
          }

          const email = p.extratags?.email || p.extratags?.['contact:email'];
          const website = p.extratags?.website || p.extratags?.['contact:website'] || p.extratags?.url;
          
          return {
            id: p.place_id,
            name,
            address,
            phone: formattedPhone,
            email,
            website,
            rating: 0,
            reviews: 0,
            status: 'OPERATIONAL'
          };
        });

        log(`Found ${results.length} raw results for ${niche} in ${city}`);

        // Small delay between niches to respect rate limits
        await new Promise(r => setTimeout(r, 1500)); 

        for (const place of results) {
          log(`Checking: ${place.name}...`);
          await processPlace(place, niche, city, log);
          await new Promise(r => setTimeout(r, 50));
        }
      } catch (error) {
        if (error.response && error.response.status === 429) {
          log(`Rate limit hit (429) for ${niche} in ${city}. Waiting 10 seconds...`);
          await new Promise(r => setTimeout(r, 10000)); // 10-second cooldown
        } else if (error.response && error.response.status === 404) {
          log(`No results found for ${niche} in ${city}`);
          await new Promise(r => setTimeout(r, 1000)); // Small delay anyway
        } else {
          log(`Error searching for ${niche} in ${city}: ${error.message}`);
          await new Promise(r => setTimeout(r, 2000)); // Delay on other errors too
        }
      }
    }
  }

  // Update last searched group in settings
  await db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_searched_group', ?)").run(groupKey);
  
  log(`Lead search finished for group ${groupKey}.`);
}

async function processPlace(place, niche, city, log) {
  // Check if duplicate
  const existing = await db.prepare('SELECT id FROM leads WHERE place_id = ?').get(place.id.toString());
  if (existing) {
    // log(`Duplicate: ${place.name}`);
    return;
  }

  // Minimum requirements: Name and AT LEAST ONE contact method
  if (!place.name || (!place.phone && !place.email && !place.website)) {
    log(`Skipping ${place.name || 'Unknown'}: Missing all contact info`);
    return;
  }

  try {
    const leadData = {
      place_id: place.id.toString(),
      business_name: place.name,
      niche,
      city,
      phone: place.phone || '',
      email: place.email || '',
      website: place.website || '',
      address: place.address || '',
      google_rating: 0,
      google_reviews: 0,
      lead_type: 'no_website',
      website_score: null,
      website_issues: '[]',
      date_found: new Date().toISOString().split('T')[0]
    };

    // 1. If it has a website, analyze it
    if (leadData.website) {
      log(`Analyzing website for ${place.name}: ${leadData.website}`);
      const { score, issues, email } = await checkWebsiteQuality(leadData.website);
      leadData.website_score = score;
      leadData.website_issues = JSON.stringify(issues);
      
      // Update email if scraper found one and it was missing
      if (email && !leadData.email) {
        leadData.email = email;
        log(`Scraper found email for ${place.name}: ${email}`);
      }
      
      // High potential for app regardless of quality
      const isHighAppPotential = APP_POTENTIAL_NICHES.some(n => 
        niche.toLowerCase().includes(n) || leadData.business_name.toLowerCase().includes(n)
      );
      
      if (isHighAppPotential) {
        leadData.lead_type = 'needs_app';
      } else if (score < config.websiteScoreThreshold) {
        leadData.lead_type = 'outdated_website';
      } else {
        leadData.lead_type = 'needs_app';
      }
    } else {
      // 2. No website, definitely a lead
      leadData.lead_type = 'no_website';
    }

    // 3. Generate demo page
    log(`Generating preview for ${place.name}...`);
    leadData.demo_page_path = generateLandingPage(leadData);

    // 4. Save to DB
    await db.prepare(`
      INSERT INTO leads (
        place_id, business_name, niche, city, phone, email, website, address, 
        google_rating, google_reviews, lead_type, website_score, website_issues, 
        demo_page_path, date_found
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      leadData.place_id, leadData.business_name, leadData.niche, leadData.city,
      leadData.phone, leadData.email, leadData.website, leadData.address, leadData.google_rating,
      leadData.google_reviews, leadData.lead_type, leadData.website_score,
      leadData.website_issues, leadData.demo_page_path, leadData.date_found
    );

    log(`✅ SUCCESSFULLY ADDED: ${leadData.business_name}`);

  } catch (error) {
    log(`❌ Error adding ${place.name}: ${error.message}`);
    if (error.message.includes('SQLITE')) {
      log(`DATABASE ERROR detail: ${error.message}`);
    }
  }
}

module.exports = { findLeads, REGIONAL_GROUPS };
