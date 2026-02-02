import type { VercelRequest, VercelResponse } from '@vercel/node';
import { load } from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ message: "Please provide a URL" });
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const response = await fetch(cleanUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)' }
    });
    
    if (!response.ok) {
      return res.status(200).json({ 
        url: cleanUrl, 
        error: `Main page returned ${response.status}`,
        totalLinks: 0,
        checkedLinks: 0,
        brokenLinks: [],
        workingLinks: []
      });
    }
    
    const html = await response.text();
    const $ = load(html);
    const links: Map<string, string> = new Map();
    
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().substring(0, 50);
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const absolute = new URL(href, cleanUrl).toString();
          if (!links.has(absolute)) {
            links.set(absolute, text);
          }
        } catch (e) {}
      }
    });

    const brokenLinks: any[] = [];
    const workingLinks: any[] = [];
    const linksToCheck = Array.from(links.entries());

    await Promise.all(
      linksToCheck.map(async ([linkUrl, anchorText]) => {
        try {
          const linkResponse = await fetch(linkUrl, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)' }
          });
          
          const result = {
            url: linkUrl,
            status: linkResponse.status,
            ok: linkResponse.ok,
            anchorText: anchorText || undefined
          };
          
          if (linkResponse.ok) {
            workingLinks.push(result);
          } else {
            brokenLinks.push(result);
          }
        } catch (err: any) {
          brokenLinks.push({
            url: linkUrl,
            status: 0,
            ok: false,
            anchorText: anchorText || undefined,
            error: err.message
          });
        }
      })
    );

    return res.status(200).json({
      url: cleanUrl,
      totalLinks: links.size,
      checkedLinks: linksToCheck.length,
      brokenLinks,
      workingLinks
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Failed to scan website", error: err.message });
  }
}
