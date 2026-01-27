
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { load } from "cheerio";
import { URL } from "url";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// --- Scanning Helpers ---

// 1. Redirect Checker
async function checkRedirects(startUrl: string) {
  const hops: any[] = [];
  let currentUrl = startUrl;
  let count = 0;
  const maxRedirects = 10;

  try {
    while (count < maxRedirects) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // Don't follow automatically, we want to trace
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEO-Tool/1.0)' }
      });

      hops.push({
        url: currentUrl,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        
        // Handle relative URLs
        currentUrl = new URL(location, currentUrl).toString();
        count++;
      } else {
        break;
      }
    }
  } catch (err: any) {
    hops.push({ url: currentUrl, status: 0, error: err.message });
  }
  return hops;
}

// 2. Security Headers
async function checkSecurityHeaders(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const headers = response.headers;
    const results = [];
    
    const checks = [
      { key: 'strict-transport-security', name: 'HSTS' },
      { key: 'content-security-policy', name: 'CSP' },
      { key: 'x-frame-options', name: 'X-Frame-Options' },
      { key: 'x-content-type-options', name: 'X-Content-Type-Options' },
      { key: 'referrer-policy', name: 'Referrer-Policy' },
      { key: 'permissions-policy', name: 'Permissions-Policy' }
    ];

    for (const check of checks) {
      const value = headers.get(check.key);
      results.push({
        header: check.name,
        value: value || null,
        status: value ? 'present' : 'missing'
      });
    }
    return results;
  } catch (err: any) {
    return [{ header: 'Error', status: 'error', description: err.message }];
  }
}

// 3. Robots.txt
async function checkRobots(baseUrl: string) {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(robotsUrl);
    const content = await response.text();
    const isValid = response.status === 200;
    
    return {
      content: isValid ? content : null,
      isValid,
      status: response.status,
      issues: isValid ? [] : [`Returned status ${response.status}`]
    };
  } catch (err: any) {
    return { content: null, isValid: false, issues: [err.message] };
  }
}

// 4. Broken Links (Simplified)
async function checkBrokenLinks(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return { error: `Main page returned ${response.status}` };
    
    const html = await response.text();
    const $ = load(html);
    const links: Set<string> = new Set();
    
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
        try {
          const absolute = new URL(href, url).toString();
          links.add(absolute);
        } catch (e) { /* ignore invalid urls */ }
      }
    });

    const results = [];
    // Limit to first 20 links for speed in this demo
    const linksToCheck = Array.from(links).slice(0, 20); 

    for (const link of linksToCheck) {
      try {
        const res = await fetch(link, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        results.push({
          url: link,
          status: res.status,
          isBroken: res.status >= 400
        });
      } catch (e: any) {
        results.push({ url: link, status: 0, isBroken: true, error: e.message });
      }
    }
    return results;
  } catch (err: any) {
    return { error: err.message };
  }
}

// 5. AI Summary
async function checkAiSummary(url: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO and web analysis expert. Analyze the given website URL. Provide a JSON response with the following fields: 'summary' (brief description of what the website is), 'services' (list of services or products provided), 'locations' (list of locations where services are provided, if applicable), 'seoTitle' (a recommended SEO title for a report page about this site), 'seoDescription' (a recommended meta description), 'seoKeywords' (list of keywords)."
        },
        {
          role: "user",
          content: `Analyze this website: ${url}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from OpenAI");
    return JSON.parse(content);
  } catch (err: any) {
    console.error("AI Summary Error:", err);
    return { error: "Failed to generate AI summary", details: err.message };
  }
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET /api/domains
  app.get(api.domains.list.path, async (_req, res) => {
    const list = await storage.getRecentDomains();
    res.json(list);
  });

  // GET /sitemap.xml
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const domains = await storage.getRecentDomains(1000); // Get all/many
      const baseUrl = `https://${_req.get('host')}`;
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

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

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // GET /api/domains/:domain
  app.get(api.domains.get.path, async (req, res) => {
    const domain = req.params.domain;
    const data = await storage.getDomain(domain);
    if (!data) return res.status(404).json({ message: "Domain report not found" });
    res.json(data);
  });

  // POST /api/redirect-check (bulk redirect checking)
  app.post('/api/redirect-check', async (req, res) => {
    try {
      const { urls } = req.body;
      
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ message: "Please provide an array of URLs" });
      }

      if (urls.length > 50) {
        return res.status(400).json({ message: "Maximum 50 URLs allowed per request" });
      }

      const results = await Promise.all(
        urls.map(async (url: string) => {
          try {
            let cleanUrl = url.trim();
            if (!cleanUrl.startsWith('http')) {
              cleanUrl = 'https://' + cleanUrl;
            }
            const hops = await checkRedirects(cleanUrl);
            return { url: cleanUrl, hops };
          } catch (err: any) {
            return { url, hops: [], error: err.message };
          }
        })
      );

      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/scan
  app.post(api.domains.scan.path, async (req, res) => {
    try {
      const input = api.domains.scan.input.parse(req.body);
      let url = input.url;
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      
      const domainName = new URL(url).hostname;
      
      // Prepare update object
      const updateData: any = { domain: domainName };
      
      // Run selected tools
      
      if (input.tools.includes('redirect')) {
        updateData.redirectData = await checkRedirects(url);
      }
      
      if (input.tools.includes('security')) {
        updateData.securityData = await checkSecurityHeaders(url);
      }
      
      if (input.tools.includes('robots')) {
        updateData.robotsData = await checkRobots(url);
      }
      
      if (input.tools.includes('broken_links')) {
        updateData.brokenLinksData = await checkBrokenLinks(url);
      }

      if (input.tools.includes('ai')) {
        updateData.aiData = await checkAiSummary(url);
      }
      
      // Upsert
      const saved = await storage.upsertDomain(updateData);
      
      res.json(saved);
      
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Internal server error during scan" });
      }
    }
  });

  return httpServer;
}
