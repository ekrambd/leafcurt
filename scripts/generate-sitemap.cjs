const fs = require('fs');
const path = require('path');

// Safely load environment variables
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });
} catch (e) {
  ['.env.local', '.env'].forEach(file => {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        content.split('\n').forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = match[2] || '';
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = value.trim();
          }
        });
      }
    } catch (err) {}
  });
}

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '';
const baseUrl = (process.env.VITE_STORE_URL || process.env.STORE_URL || 'https://store.com').replace(/\/+$/, '');

function slugify(value) {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\u0980-\u09ffa-zA-Z0-9\s-]+/g, '') // Keep Bengali, English letters, digits, spaces, and hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function generateSitemap() {
  console.log(`Generating sitemap...`);
  const urls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily' },
    { loc: `${baseUrl}/about`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/contact`, priority: '0.8', changefreq: 'monthly' },
    { loc: `${baseUrl}/quiz`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/checkout`, priority: '0.7', changefreq: 'weekly' }
  ];

  // Default store catalog products for offline/Firestore-free builds
  const defaultProducts = [
    { id: 'product_001', title: 'Daily Balancing Facial Cleanser', slug: 'daily-balancing-facial-cleanser' },
    { id: 'product_002', title: 'Hydrating Botanical Essence Toner', slug: 'hydrating-botanical-essence-toner' },
    { id: 'product_003', title: 'Intensive Restorative Barrier Cream', slug: 'intensive-restorative-barrier-cream' },
    { id: 'product_004', title: 'Ultra Moisture Deep Treatment Mask', slug: 'ultra-moisture-deep-treatment-mask' }
  ];

  defaultProducts.forEach(prod => {
    const slug = slugify(prod.slug || prod.title || prod.id);
    urls.push({
      loc: `${baseUrl}/product/${encodeURIComponent(slug)}/${encodeURIComponent(prod.id)}/`,
      priority: '0.8',
      changefreq: 'weekly'
    });
  });

  // Optional online fetch only if Firestore project is explicitly configured and reachable
  if (process.env.ENABLE_FIRESTORE_SITEMAP === 'true' && projectId) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/ecom_products?pageSize=1000`;
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        if (data.documents) {
          data.documents.forEach(doc => {
            const fields = doc.fields || {};
            const id = doc.name.split('/').pop();
            const title = fields.title ? fields.title.stringValue : '';
            const slugField = fields.slug ? fields.slug.stringValue : '';
            const slug = slugify(slugField || title || id);
            const loc = `${baseUrl}/product/${encodeURIComponent(slug)}/${encodeURIComponent(id)}/`;
            if (slug && id && !urls.some(u => u.loc === loc)) {
              urls.push({ loc, priority: '0.8', changefreq: 'weekly' });
            }
          });
        }
      }
    } catch {
      // offline/disabled fallback already populated
    }
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  console.log('Sitemap generated successfully!');
}

generateSitemap();
