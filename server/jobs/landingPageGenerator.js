const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const config = require('../config');

const NICHE_CONFIGS = {
  'gym': {
    primary: '#dc2626', // Red
    secondary: '#111827', // Black
    hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop', // People gyming
    tagline: 'PUSH YOUR LIMITS. ACHIEVE YOUR GOALS.',
    pricing: [
      { name: 'Basic', price: 'R299', features: ['Gym Access', 'Locker Room', 'Free Weights'] },
      { name: 'Pro', price: 'R499', features: ['All Basic', 'Group Classes', 'Personal Trainer'] },
      { name: 'Elite', price: 'R799', features: ['All Pro', 'Sauna Access', 'Nutrition Plan'] }
    ],
    services: ['Strength Training', 'Cardio Zone', 'HIIT Classes', 'Personal Coaching'],
    aboutImg: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop'
  },
  'barbershop': {
    primary: '#78350f', // Brown/Gold
    secondary: '#1a1a1a', // Black
    hero: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop', // Barber cutting hair
    tagline: 'SHARP LOOKS. CLASSIC VIBES.',
    pricing: [
      { name: 'Classic Cut', price: 'R150', features: ['Haircut', 'Neck Shave', 'Style'] },
      { name: 'Beard Trim', price: 'R100', features: ['Shaping', 'Hot Towel', 'Oil'] },
      { name: 'The Works', price: 'R220', features: ['Cut & Beard', 'Facial', 'Massage'] }
    ],
    services: ['Classic Haircuts', 'Beard Trimming', 'Hot Towel Shave', 'Hair Coloring'],
    aboutImg: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop'
  },
  'garage': {
    primary: '#1d4ed8', // Blue
    secondary: '#111827', // Black
    hero: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200&auto=format&fit=crop', // Cars in garage
    tagline: 'RELIABLE REPAIRS. QUALITY SERVICE.',
    pricing: [
      { name: 'Oil Change', price: 'R450', features: ['Premium Oil', 'Filter', 'Inspection'] },
      { name: 'Diagnostics', price: 'R300', features: ['Full Scan', 'Error Clear', 'Report'] },
      { name: 'Full Service', price: 'R1200', features: ['All Filters', 'Brakes Check', 'Spark Plugs'] }
    ],
    services: ['Vehicle Maintenance', 'Performance Tuning', 'Body Repairs', 'Suspension Repair'],
    aboutImg: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop'
  },
  'restaurant': {
    primary: '#dc2626', // Red
    secondary: '#f59e0b', // Orange/Amber
    hero: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop', // Restaurant/Food
    tagline: 'EXPERIENCE THE FINEST FLAVORS.',
    pricing: [
      { name: 'Lunch Special', price: 'R95', features: ['Main Course', 'Soft Drink', 'Fast Service'] },
      { name: 'Dinner Duo', price: 'R350', features: ['2 Mains', 'Shared Appetizer', 'Dessert'] },
      { name: 'Family Feast', price: 'R550', features: ['Platter for 4', 'Drinks', 'Vibe'] }
    ],
    services: ['Fine Dining', 'Quick Takeaway', 'Event Catering', 'Private Tables'],
    aboutImg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop'
  },
  'spa': {
    primary: '#059669', // Emerald Green
    secondary: '#d1fae5', // Soft Green
    hero: 'https://images.unsplash.com/photo-1544161515-4af6b1d4640b?q=80&w=1200&auto=format&fit=crop', // Spa/Relaxation
    tagline: 'RELAX, REJUVENATE, AND REFRESH.',
    pricing: [
      { name: 'Basic Glow', price: 'R250', features: ['Quick Facial', 'Hand Massage', 'Hydration'] },
      { name: 'Stress Buster', price: 'R450', features: ['Full Body Massage', 'Sauna', 'Tea'] },
      { name: 'Royal Retreat', price: 'R850', features: ['Luxury Package', 'Skin Treatment', 'Lunch'] }
    ],
    services: ['Full Body Massage', 'Skin Treatment', 'Luxury Manicure', 'Sauna & Steam'],
    aboutImg: 'https://images.unsplash.com/photo-1540555700478-4be289fbecee?q=80&w=800&auto=format&fit=crop'
  },
  'default': {
    primary: '#2563eb',
    secondary: '#f8fafc',
    hero: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
    tagline: 'EXCELLENCE IN EVERY DETAIL.',
    pricing: [
      { name: 'Standard', price: 'Call Us', features: ['Quality Service', 'Consultation', 'Support'] },
      { name: 'Premium', price: 'Custom', features: ['Full Package', 'Priority', 'Expert Team'] }
    ],
    services: ['Quality Service', 'Expert Team', 'Customer Focused', '24/7 Support'],
    aboutImg: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop'
  }
};

function generateLandingPage(lead) {
  const slug = slugify(lead.business_name, { lower: true, strict: true });
  const demoDir = path.join(__dirname, '../../public/demos', slug);
  
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }

  // Determine niche based on keywords in business name or niche field
  const name = (lead.business_name || '').toLowerCase();
  const leadNiche = (lead.niche || '').toLowerCase();
  
  let detectedNiche = 'default';
  
  if (name.includes('gym') || name.includes('fitness') || name.includes('crossfit') || leadNiche === 'gym') {
    detectedNiche = 'gym';
  } else if (name.includes('barber') || name.includes('hair') || name.includes('salon') || leadNiche === 'barbershop') {
    detectedNiche = 'barbershop';
  } else if (name.includes('garage') || name.includes('auto') || name.includes('repair') || name.includes('workshop') || leadNiche === 'garage' || leadNiche === 'auto repair') {
    detectedNiche = 'garage';
  } else if (name.includes('restaurant') || name.includes('food') || name.includes('cafe') || name.includes('kitchen') || name.includes('diner') || leadNiche === 'restaurant') {
    detectedNiche = 'restaurant';
  } else if (name.includes('spa') || name.includes('wellness') || leadNiche === 'spa') {
    detectedNiche = 'spa';
  }

  const nicheConfig = NICHE_CONFIGS[detectedNiche] || NICHE_CONFIGS['default'];
  
  const html = `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${lead.business_name} | Professional Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        h1, h2, h3, .font-oswald { font-family: 'Oswald', sans-serif; }
        body { font-family: 'Inter', sans-serif; }
        :root {
            --primary: ${nicheConfig.primary};
            --secondary: ${nicheConfig.secondary};
        }
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
    </style>
</head>
<body class="bg-white text-gray-900 overflow-x-hidden">
    <!-- Demo Banner -->
    <div class="sticky top-0 z-[100] bg-yellow-400 text-black py-2 px-4 text-center font-bold text-sm shadow-md">
        🚀 FREE DEMO for ${lead.business_name} — WhatsApp Tebogo to claim this site → 
        <a href="https://wa.me/${config.myPhone.toString().replace(/\D/g, '')}" class="underline ml-1">Claim Now</a>
    </div>

    <!-- Hero -->
    <header class="relative h-screen flex items-center justify-center text-white overflow-hidden">
        <div class="absolute inset-0 bg-black/60 z-10"></div>
        <img src="${nicheConfig.hero}" alt="${lead.business_name}" class="absolute inset-0 w-full h-full object-cover z-0">
        <div class="relative z-20 text-center px-6 max-w-4xl">
            <h1 class="text-6xl md:text-8xl font-bold mb-6 tracking-tighter uppercase italic">${lead.business_name}</h1>
            <p class="text-xl md:text-3xl mb-10 font-semibold tracking-wide uppercase opacity-90">${nicheConfig.tagline}</p>
            <div class="flex flex-col sm:flex-row gap-6 justify-center">
                <a href="#pricing" class="bg-primary text-white px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:scale-105 transition shadow-xl">View Pricing</a>
                <a href="tel:${lead.phone}" class="bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-gray-100 transition shadow-xl">Call: ${lead.phone}</a>
            </div>
        </div>
    </header>

    <!-- Services -->
    <section id="services" class="py-24 px-6 bg-gray-50">
        <div class="max-w-7xl mx-auto">
            <h2 class="text-5xl font-bold mb-16 text-center uppercase italic underline decoration-primary decoration-8 underline-offset-8">Our Services</h2>
            <div class="grid md:grid-cols-4 gap-8">
                ${nicheConfig.services.map(service => `
                <div class="bg-white p-8 rounded-2xl shadow-lg border-b-4 border-primary hover:-translate-y-2 transition duration-300">
                    <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 uppercase tracking-tight">${service}</h3>
                    <p class="text-gray-600 font-medium leading-relaxed">Top-tier professional ${service.toLowerCase()} in ${lead.city}.</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- About -->
    <section class="py-24 px-6 bg-white">
        <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl h-[500px]">
                <img src="${nicheConfig.aboutImg}" alt="Our Work" class="w-full h-full object-cover">
            </div>
            <div>
                <h2 class="text-5xl font-bold mb-8 uppercase italic tracking-tight">Experience Excellence</h2>
                <p class="text-xl text-gray-600 mb-8 leading-relaxed font-medium">
                    At ${lead.business_name}, we take pride in being the #1 choice for ${detectedNiche} in ${lead.city}. Our team is dedicated to providing premium quality and unmatched customer service.
                </p>
                <div class="space-y-4">
                    <div class="flex items-center gap-4 text-xl font-bold uppercase tracking-tight">
                        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">✓</div>
                        Certified Professionals
                    </div>
                    <div class="flex items-center gap-4 text-xl font-bold uppercase tracking-tight">
                        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">✓</div>
                        Modern Equipment
                    </div>
                    <div class="flex items-center gap-4 text-xl font-bold uppercase tracking-tight">
                        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center">✓</div>
                        100% Satisfaction Guaranteed
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="py-24 px-6 bg-gray-50">
        <div class="max-w-7xl mx-auto">
            <h2 class="text-5xl font-bold mb-16 text-center uppercase italic tracking-tight">Pricing Plans</h2>
            <div class="grid md:grid-cols-3 gap-8">
                ${nicheConfig.pricing.map(plan => `
                <div class="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 hover:border-primary transition duration-300">
                    <h3 class="text-2xl font-bold mb-4 uppercase italic">${plan.name}</h3>
                    <div class="text-5xl font-black mb-8 text-primary font-oswald italic">${plan.price}</div>
                    <ul class="space-y-4 mb-10">
                        ${plan.features.map(f => `<li class="flex items-center gap-3 font-semibold"><span class="text-primary">✦</span> ${f}</li>`).join('')}
                    </ul>
                    <a href="tel:${lead.phone}" class="block text-center bg-gray-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary transition">Book Now</a>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-black text-white py-20 px-6 border-t border-white/5">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div class="text-center md:text-left">
                <h2 class="text-4xl font-bold mb-4 uppercase italic tracking-tighter">${lead.business_name}</h2>
                <p class="text-gray-400 text-lg max-w-md font-medium">Serving the ${lead.city} community with professional ${detectedNiche} services.</p>
            </div>
            <div class="flex flex-col items-center md:items-end">
                <p class="text-sm text-gray-500 mb-4 font-bold uppercase tracking-widest italic opacity-50">Demo by Demitech</p>
                <a href="https://wa.me/${config.myPhone.toString().replace(/\D/g, '')}" class="bg-primary text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider hover:scale-105 transition shadow-xl">WhatsApp Me</a>
            </div>
        </div>
    </footer>
</body>
</html>
  `;

  fs.writeFileSync(path.join(demoDir, 'index.html'), html);
  return `/demos/${slug}/index.html`;
}

module.exports = { generateLandingPage };
