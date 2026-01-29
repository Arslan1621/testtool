
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { load } from "cheerio";
import { URL } from "url";
import OpenAI from "openai";
import whois from "whois-json";
// @ts-ignore
import * as rdap from "node-rdap";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// --- Scanning Helpers ---

async function lookupWhois(domain: string) {
  try {
    const whoisData = await whois(domain);
    const rawResponse = JSON.stringify(whoisData).toLowerCase();
    if (rawResponse.includes("rate limit exceeded") || Object.keys(whoisData).length <= 1) {
      throw new Error("WHOIS rate limit or empty response");
    }
    return whoisData;
  } catch (err) {
    console.log(`WHOIS failed for ${domain}, trying RDAP fallback...`);
    try {
      const result = await rdap.domain(domain);
      if (!result) return {};
      const registrar = result.entities?.find((e: any) => e.roles?.includes("registrar"));
      const registrant = result.entities?.find((e: any) => e.roles?.includes("registrant"));
      const events = result.events || [];
      const registrationEvent = events.find((e: any) => e.eventAction === "registration");
      const expirationEvent = events.find((e: any) => e.eventAction === "expiration");
      const lastChangedEvent = events.find((e: any) => e.eventAction === "last changed");
      return {
        domainName: result.ldhName,
        registrar: registrar?.vcardArray?.[1]?.find((a: any) => a[0] === "fn")?.[3],
        creationDate: registrationEvent?.eventDate,
        expirationDate: expirationEvent?.eventDate,
        updatedDate: lastChangedEvent?.eventDate,
        status: result.status?.[0],
        nameServer: result.nameservers?.map((ns: any) => ns.ldhName),
        registrantName: registrant?.vcardArray?.[1]?.find((a: any) => a[0] === "fn")?.[3],
        registrantOrganization: registrant?.vcardArray?.[1]?.find((a: any) => a[0] === "org")?.[3],
      };
    } catch (rdapErr) {
      console.error("RDAP Lookup Error:", rdapErr);
      return {};
    }
  }
}

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

  // GET /robots.txt
  app.get('/robots.txt', (_req, res) => {
    const robots = `User-agent: *
Allow: /
Sitemap: https://${_req.get('host')}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robots);
  });

  // GET /sitemap.xml
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const domains = await storage.getRecentDomains(50000); // Get more for sitemap
      const baseUrl = `https://${_req.get('host')}`;
      
      // Static pages with their priorities and change frequencies
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

      // Add static pages
      staticPages.forEach(page => {
        xml += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      });

      // Add dynamic domain report pages
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
      console.error('Sitemap error:', err);
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

  // POST /api/security-check (standalone security header checking)
  app.post('/api/security-check', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "Please provide a URL" });
      }

      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const headers = await checkSecurityHeaders(cleanUrl);
      res.json({ url: cleanUrl, headers });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to check security headers", error: err.message });
    }
  });

  // POST /api/robots-check (standalone robots.txt validation)
  app.post('/api/robots-check', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "Please provide a URL" });
      }

      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }

      const result = await checkRobots(cleanUrl);
      res.json({ url: cleanUrl, ...result });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to check robots.txt", error: err.message });
    }
  });

  // POST /api/link-check (single link check)
  app.post('/api/link-check', async (req, res) => {
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
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)' }
      });
      
      res.json({ 
        url: cleanUrl, 
        status: response.status, 
        ok: response.ok 
      });
    } catch (err: any) {
      res.json({ 
        url: req.body.url, 
        status: 0, 
        ok: false, 
        error: err.message 
      });
    }
  });

  // POST /api/website-link-check (scan website for broken links)
  app.post('/api/website-link-check', async (req, res) => {
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
        return res.json({ 
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
          } catch (e) { /* ignore invalid urls */ }
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

      res.json({
        url: cleanUrl,
        totalLinks: links.size,
        checkedLinks: linksToCheck.length,
        brokenLinks,
        workingLinks
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Failed to scan website", error: err.message });
    }
  });

  // POST /api/whois-check (WHOIS domain lookup)
  app.post('/api/whois-check', async (req, res) => {
    try {
      const { domain } = req.body;
      
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ message: "Please provide a domain" });
      }

      let cleanDomain = domain.trim().toLowerCase();
      
      // Remove protocol if present
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
      // Remove trailing slashes and paths
      cleanDomain = cleanDomain.split('/')[0];
      // Remove www. prefix if present
      cleanDomain = cleanDomain.replace(/^www\./, '');

      const whoisData = await lookupWhois(cleanDomain);
      
      // Build a formatted raw text output similar to the example
      const rawLines: string[] = [`WHOIS Information for ${cleanDomain}`];
      
      const formatField = (label: string, value: any) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach(v => rawLines.push(`${label.padEnd(33, ' ')}${v}`));
        } else {
          rawLines.push(`${label.padEnd(33, ' ')}${String(value)}`);
        }
      };

      formatField('Domain Name:', whoisData.domainName);
      formatField('Registrar ID:', whoisData.registrarIanaId || whoisData.registrarId);
      formatField('Registrar Name:', whoisData.registrar || whoisData.registrarName);
      formatField('Status:', whoisData.domainStatus || whoisData.status);
      formatField('Creation Date:', whoisData.creationDate || whoisData.createdDate);
      formatField('Updated Date:', whoisData.updatedDate);
      formatField('Expiration Date:', whoisData.registryExpiryDate || whoisData.expirationDate);
      rawLines.push('');
      formatField('Registrant Name:', whoisData.registrantName);
      formatField('Registrant Organization:', whoisData.registrantOrganization);
      formatField('Registrant Email:', whoisData.registrantEmail);
      formatField('Registrant Country:', whoisData.registrantCountry);
      rawLines.push('');
      formatField('Tech Name:', whoisData.techName);
      formatField('Tech Organization:', whoisData.techOrganization);
      formatField('Tech Email:', whoisData.techEmail);
      rawLines.push('');
      formatField('Admin Name:', whoisData.adminName);
      formatField('Admin Organization:', whoisData.adminOrganization);
      formatField('Admin Email:', whoisData.adminEmail);
      rawLines.push('');
      formatField('Name Server:', whoisData.nameServer);
      formatField('DNSSEC:', whoisData.dnssec);

      res.json({ 
        domain: cleanDomain, 
        data: whoisData,
        rawText: rawLines.filter(line => line !== undefined).join('\n')
      });
    } catch (err: any) {
      console.error('WHOIS Error:', err);
      res.status(500).json({ 
        domain: req.body.domain,
        error: err.message || "Failed to lookup WHOIS information"
      });
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

      if (input.tools.includes('whois')) {
        try {
          const whoisData = await lookupWhois(domainName);
          updateData.whoisData = { domain: domainName, data: whoisData };
        } catch (err: any) {
          updateData.whoisData = { domain: domainName, error: err.message };
        }
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
