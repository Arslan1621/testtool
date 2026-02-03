import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRecentDomains } from './_lib/storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const domains = await getRecentDomains(50000);
    const host = req.headers.host || 'example.com';
    const baseUrl = `https://${host}`;
    
    const staticPages = [
      { path: '/', changefreq: 'daily', priority: '1.0' },
      { path: '/redirect-checker', changefreq: 'weekly', priority: '0.9' },
      { path: '/security-checker', changefreq: 'weekly', priority: '0.9' },
      { path: '/robots-txt', changefreq: 'weekly', priority: '0.9' },
      { path: '/broken-links', changefreq: 'weekly', priority: '0.9' },
      { path: '/whois-checker', changefreq: 'weekly', priority: '0.9' },
      { path: '/about', changefreq: 'monthly', priority: '0.7' },
      { path: '/blog', changefreq: 'weekly', priority: '0.8' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    ];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    domains.forEach(d => {
      xml += `
  <url>
    <loc>${baseUrl}/${d.domain}</loc>
    <lastmod>${d.lastScannedAt ? new Date(d.lastScannedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    return res.status(500).send('Error generating sitemap');
  }
}
