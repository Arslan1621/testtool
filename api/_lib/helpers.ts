import { load } from "cheerio";
import OpenAI from "openai";
import whois from "whois-json";
// @ts-ignore
import * as rdap from "node-rdap";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function lookupWhois(domain: string) {
  try {
    const whoisData = await whois(domain);
    const rawResponse = JSON.stringify(whoisData).toLowerCase();
    if (rawResponse.includes("rate limit exceeded") || 
        rawResponse.includes("retired") || 
        rawResponse.includes("use our rdap service") ||
        Object.keys(whoisData).length <= 1) {
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

export async function checkRedirects(startUrl: string) {
  const hops: any[] = [];
  let currentUrl = startUrl;
  let count = 0;
  const maxRedirects = 10;

  try {
    while (count < maxRedirects) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
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

export async function checkSecurityHeaders(url: string) {
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

export async function checkRobots(baseUrl: string) {
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

export async function checkBrokenLinks(url: string) {
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
        } catch (e) {}
      }
    });

    const results = [];
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

export async function checkAiSummary(url: string) {
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
