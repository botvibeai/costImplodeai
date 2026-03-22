import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');
const DOMAIN = 'https://costimplodeai.com';

const languages = [
  'en', 'hi', 'bn', 'te', 'ta', 'mr', 'kn', 'gu', 'zh', 'ar', 
  'es', 'pt', 'fr', 'ru', 'ja', 'de', 'id', 'ko', 'tr', 'vi'
];

async function generateSEO() {
  console.log("Starting Directory-Based SEO Generation...");
  const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');
  let sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Root URL Priority
  sitemapXML += `  <url>\n    <loc>${DOMAIN}/</loc>\n    <priority>1.0</priority>\n  </url>\n`;

  for (const lang of languages) {
    if (lang === 'en') continue; // English is handled by the root
    
    const langDir = path.join(DIST_DIR, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir);
    }
    
    // Convert base paths so CSS/JS load correctly from subdirectories
    // Replace "/assets/" with "/assets/" absolute assuming cloudflare handles absolute correctly since Vite builds it absolute (e.g. src="/assets/...").
    fs.writeFileSync(path.join(langDir, 'index.html'), htmlContent);
    
    // Add to sitemap
    sitemapXML += `  <url>\n    <loc>${DOMAIN}/${lang}/</loc>\n    <priority>0.8</priority>\n  </url>\n`;
    console.log(`Generated SEO Directory: /${lang}/`);
  }

  sitemapXML += `</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXML);
  console.log("sitemap.xml successfully generated.");
}

generateSEO().catch(console.error);
