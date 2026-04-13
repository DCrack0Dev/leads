const SibApiV3Sdk = require('sib-api-v3-sdk');
const db = require('../db/database');
const config = require('../config');

// Configure Brevo SDK
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = config.brevoApiKey;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

async function sendOutreachEmail(leadId) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead || !lead.email) return;

  const demoUrl = `${config.baseUrl}${lead.demo_page_path}`;
  const myName = 'Tebogo Chakapedi';
  const myBusiness = 'DemiTech Web Services';
  const myPhone = config.myPhone;
  const myWebsite = config.myWebsite;

  const websiteIssues = JSON.parse(lead.website_issues || '[]');
  let issueExplanation = '';

  if (websiteIssues.length > 0) {
    const issueMap = {
      'no_ssl': '<strong>Your site is marked as "Not Secure"</strong> in browsers. This makes visitors feel unsafe and often leads to them leaving immediately, fearing their data might be stolen.',
      'slow_load': '<strong>Your website takes too long to load.</strong> In today\'s world, most people leave if a site takes more than 3 seconds to show up. You are likely losing half your potential customers before they even see what you offer.',
      'thin_content': '<strong>There is very little information on your site.</strong> Google prioritizes helpful, detailed websites, and customers need to see more than just a name to trust a business. It makes your business look less established than it really is.',
      'not_mobile_friendly': '<strong>Your site isn\'t mobile-friendly.</strong> Since most people search on their phones, a site that doesn\'t fit their screen is almost impossible to use, driving them straight to your competitors.'
    };

    const explainedIssues = websiteIssues
      .filter(issue => issueMap[issue])
      .map(issue => `<li>${issueMap[issue]}</li>`)
      .join('');

    if (explainedIssues) {
      issueExplanation = `
        <p>I took a close look at your current site and noticed a few things that are likely hurting your business more than you realize:</p>
        <ul style="color: #4b5563;">
          ${explainedIssues}
        </ul>
        <p>These aren't just technical details — they are actively pushing potential customers away and making it harder for you to show up on Google.</p>
      `;
    }
  }

  const context = {
    business_name: lead.business_name,
    owner_name: lead.owner_name || 'there',
    city: lead.city || 'your area',
    my_name: myName,
    my_business: myBusiness,
    my_phone: myPhone,
    my_website: myWebsite,
    demo_url: demoUrl,
    issue_explanation: issueExplanation
  };

  const { subject, body } = getTemplate(lead.lead_type, context);

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = body;
  sendSmtpEmail.sender = { name: myBusiness, email: config.fromEmail };
  sendSmtpEmail.to = [{ email: lead.email, name: lead.business_name }];
  sendSmtpEmail.bcc = [{ email: config.forwardingInbox, name: 'Lead Monitoring' }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    // Log outreach
    db.prepare(`
      INSERT INTO outreach_log (lead_id, channel, subject, body, status)
      VALUES (?, 'email', ?, ?, 'sent')
    `).run(lead.id, subject, body);

    // Update lead status
    db.prepare(`
      UPDATE leads SET status = 'emailed', email_sent = 1, outreach_count = outreach_count + 1, last_contacted = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(lead.id);

    console.log(`Email sent to ${lead.business_name}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${lead.business_name}:`, error.message);
    if (error.response && error.response.body) {
      console.error('Brevo Error Body:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

function getTemplate(leadType, ctx) {
  if (leadType === 'needs_app') {
    return {
      subject: `Tried Calling — Had an Idea for ${ctx.business_name}`,
      body: `
        <p>Hi ${ctx.owner_name},</p>
        <p>I tried calling ${ctx.business_name} earlier today but couldn't get through — I hope this email finds you well.</p>
        
        <p>I'll get straight to it: I was researching businesses in ${ctx.city} and ${ctx.business_name} stood out to me as exactly the kind of business that could do really well with its own mobile app.</p>

        ${ctx.issue_explanation ? ctx.issue_explanation : ''}

        <p>I know "mobile app" can sound like something only big companies have — but that's changing fast. Customers today want to book, browse, order, or contact businesses straight from their phone without searching around. The businesses that make it that easy are the ones getting repeat customers and referrals. The ones that don't are slowly losing ground without even realising it.</p>
        <p>The window to get ahead of your local competitors on this is still open — but it won't be for long.</p>
        <p>At ${ctx.my_business} we build mobile apps for small and medium businesses that are actually affordable — no big agency pricing, no unnecessary features, just a clean app your customers will use.</p>
        <p>What's included:</p>
        <ul>
          <li>Works on both iPhone and Android</li>
          <li>Branded to look and feel like your business</li>
          <li>Built with what you need — bookings, menus, loyalty, contact, and more</li>
          <li>Ongoing support so you're never left figuring it out alone</li>
        </ul>
        <p>I'd love to put together a free concept for ${ctx.business_name} — something visual you can look at and say yes or no to. No commitment at all.</p>
        <p>If the timing's not right, no hard feelings — but if this has been on your mind, let's talk before your competitors get there first.</p>
        <p>Reply here or reach me on ${ctx.my_phone}.</p>
        <p>Best,<br>
        ${ctx.my_name}<br>
        ${ctx.my_business}<br>
        ${ctx.my_phone}<br>
        ${ctx.my_website}</p>
      `
    };
  } else {
    // WEBSITE (no_website AND outdated_website/needs_website)
    return {
      subject: `Tried Calling — Quick Opportunity for ${ctx.business_name}`,
      body: `
        <p>Hi ${ctx.owner_name},</p>
        <p>I tried reaching ${ctx.business_name} by phone earlier but couldn't get through, so I figured I'd drop you a quick email instead.</p>
        
        ${ctx.issue_explanation ? ctx.issue_explanation : `
        <p>I'll be straight with you — I was looking at businesses in ${ctx.city} and noticed that ${ctx.business_name} doesn't have a strong online presence yet. That might not feel urgent right now, but here's the reality: your competitors who do have websites are showing up when your customers search on Google. Those are customers who could be walking through your door instead.</p>
        `}

        <p>The good news is this is a very fixable problem, and the businesses that move on it now are the ones who pull ahead while others wait.</p>
        <p>At ${ctx.my_business} we build clean, professional websites for businesses like yours — designed to show up on Google and turn visitors into paying customers. Most of our clients are live within 7 days.</p>
        <p>What you get:</p>
        <ul>
          <li>A professional website that works on any device</li>
          <li>Built to rank on Google so new customers find you first</li>
          <li>Design that builds trust and makes your business look the part</li>
          <li>Fast turnaround with zero technical headaches for you</li>
        </ul>
        <p>I'd love to put together a free mockup for ${ctx.business_name} — just so you can see what's possible. No cost, no obligation, no pressure.</p>
        <p>If I don't hear back in the next few days I'll assume the timing isn't right, and that's completely fine. But if there's even a small part of you that's been thinking about this, now is a good time to have a quick conversation.</p>
        <p>Reply here or WhatsApp/call me on ${ctx.my_phone}.</p>
        <p>Best,<br>
        ${ctx.my_name}<br>
        ${ctx.my_business}<br>
        ${ctx.my_phone}<br>
        ${ctx.my_website}</p>
      `
    };
  }
}

function generateWhatsAppMessage(lead) {
  const demoUrl = `${config.baseUrl}${lead.demo_page_path}`;
  const owner = lead.owner_name || 'there';
  const myWebsite = config.myWebsite;

  if (lead.lead_type === 'needs_app') {
    return `Hi ${owner}, tried calling ${lead.business_name} earlier. Your business stands out for a mobile app — it's the best way to keep customers from moving to competitors. I built a free concept for you: ${demoUrl}. I'm Tebogo from DemiTech. No pressure, just wanted to show you. Interested? ${myWebsite}`;
  } else {
    // WEBSITE (no_website AND outdated_website)
    return `Hi ${owner}, tried calling ${lead.business_name} earlier but couldn't get through. I noticed you're missing out on Google traffic while competitors move ahead. I built a free demo for you to see what's possible: ${demoUrl}. I'm Tebogo from DemiTech — no cost to look. Interested? ${myWebsite}`;
  }
}

module.exports = { sendOutreachEmail, generateWhatsAppMessage };
