const puppeteer = require('puppeteer');

async function checkWebsiteQuality(url) {
  if (!url) return { score: 0, issues: ['no_website'] };

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Use a real browser User-Agent to avoid being blocked
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const startTime = Date.now();
    
    // Try navigating with a more relaxed waitUntil
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded', // Faster and more reliable than networkidle2
        timeout: 20000
      });
    } catch (e) {
      // If domcontentloaded fails, try once more with a different strategy or just proceed
      console.warn(`Initial navigation for ${url} failed: ${e.message}. Retrying...`);
      await page.goto(url, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    }
    
    const loadTime = Date.now() - startTime;

    let score = 0;
    const issues = [];

    // 1. SSL (HTTPS) - +10
    if (url.startsWith('https')) {
      score += 10;
    } else {
      issues.push('no_ssl');
    }

    // 2. Page loads under 5 seconds - +15
    if (loadTime < 5000) {
      score += 15;
    } else {
      issues.push('slow_load');
    }

    // 3. Mobile responsive (viewport meta) - +20
    const hasViewport = await page.evaluate(() => {
      return !!document.querySelector('meta[name="viewport"]');
    });
    if (hasViewport) {
      score += 20;
    } else {
      issues.push('not_mobile_friendly');
    }

    // 4. Contact info visible & Email Extraction
    const extractionResult = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      
      const emails = bodyText.match(emailRegex) || [];
      const phones = bodyText.match(phoneRegex) || [];
      
      // Also check mailto: links
      const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
        .filter(a => a && typeof a.href === 'string')
        .map(a => a.href.replace('mailto:', '').split('?')[0]);
      
      const allEmails = [...emails, ...mailtoLinks];
      
      // Clean up extracted emails (remove duplicates, common false positives)
      const uniqueEmails = [...new Set(allEmails.filter(e => !['sentry-sdk', 'example.com'].some(p => e.includes(p))))];
      
      return {
        hasContactInfo: uniqueEmails.length > 0 || phones.length > 0,
        email: uniqueEmails[0] || null
      };
    });

    let foundEmail = extractionResult.email;

    // Try finding email on Contact or About page if not found on homepage
    if (!foundEmail) {
      try {
        const contactPageUrl = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a && typeof a.href === 'string');
          const contactLink = links.find(a => 
            (a.innerText && /contact|about|touch|reach|reach-us|contact-us/i.test(a.innerText)) || 
            (a.href && /contact|about/i.test(a.href))
          );
          return contactLink ? contactLink.href : null;
        });

        if (contactPageUrl && contactPageUrl !== url) {
          await page.goto(contactPageUrl, { waitUntil: 'networkidle2', timeout: 10000 });
          const contactEmail = await page.evaluate(() => {
            const bodyText = document.body.innerText;
            const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
            const emails = bodyText.match(emailRegex) || [];
            return emails.length > 0 ? emails[0] : null;
          });
          if (contactEmail) foundEmail = contactEmail;
        }
      } catch (e) {
        // Ignore errors on secondary page navigation
      }
    }

    if (extractionResult.hasContactInfo) {
      score += 10;
    } else {
      issues.push('no_contact_info');
    }

    // ... continue with other checks
    // 5. Copyright year 2020 or newer - +10
    const hasModernCopyright = await page.evaluate(() => {
      const yearMatch = document.body.innerText.match(/©\s*(202[0-9]|203[0-9])/);
      return !!yearMatch;
    });
    if (hasModernCopyright) {
      score += 10;
    } else {
      issues.push('outdated_copyright');
    }

    // 6. No Flash - +10
    const hasFlash = await page.evaluate(() => {
      return !!document.querySelector('object, embed');
    });
    if (!hasFlash) {
      score += 10;
    } else {
      issues.push('flash_detected');
    }

    // 7. Word count > 300 - +10
    const wordCount = await page.evaluate(() => {
      return document.body.innerText.split(/\s+/).length;
    });
    if (wordCount > 300) {
      score += 10;
    } else {
      issues.push('thin_content');
    }

    // 8. Social media links - +5
    const hasSocialLinks = await page.evaluate(() => {
      const socialPatterns = ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com'];
      const links = Array.from(document.querySelectorAll('a'))
        .filter(a => a && typeof a.href === 'string')
        .map(a => a.href.toLowerCase());
      return socialPatterns.some(pattern => links.some(link => link.includes(pattern)));
    });
    if (hasSocialLinks) {
      score += 10;
    } else {
      issues.push('no_social_links');
    }

    await browser.close();
    return { score, issues, email: foundEmail };

  } catch (error) {
    if (browser) await browser.close();
    console.error(`Error checking website ${url}:`, error.message);
    
    let errorType = 'connection_error';
    if (error.message.includes('Timeout')) errorType = 'timeout';
    if (error.message.includes('ERR_NAME_NOT_RESOLVED')) errorType = 'invalid_domain';
    if (error.message.includes('ERR_CONNECTION_REFUSED')) errorType = 'connection_refused';
    
    return { score: 0, issues: [errorType], email: null };
  }
}

module.exports = { checkWebsiteQuality };
