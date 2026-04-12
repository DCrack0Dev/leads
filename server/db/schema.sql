CREATE TABLE IF NOT EXISTS leads ( 
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  place_id TEXT UNIQUE NOT NULL, 
  business_name TEXT NOT NULL, 
  niche TEXT, 
  city TEXT, 
  phone TEXT, 
  email TEXT DEFAULT '', 
  website TEXT DEFAULT '', 
  address TEXT, 
  google_rating REAL, 
  google_reviews INTEGER DEFAULT 0, 
  lead_type TEXT DEFAULT 'no_website', 
  website_score INTEGER, 
  website_issues TEXT DEFAULT '[]', 
  status TEXT DEFAULT 'new', 
  outreach_count INTEGER DEFAULT 0, 
  last_contacted TEXT, 
  reply_received INTEGER DEFAULT 0, 
  demo_page_path TEXT DEFAULT '', 
  notes TEXT DEFAULT '', 
  date_found TEXT, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP 
); 

CREATE TABLE IF NOT EXISTS outreach_log ( 
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  lead_id INTEGER REFERENCES leads(id), 
  channel TEXT, 
  subject TEXT, 
  body TEXT, 
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
  status TEXT DEFAULT 'sent' 
); 

CREATE TABLE IF NOT EXISTS settings ( 
  key TEXT PRIMARY KEY, 
  value TEXT 
);
