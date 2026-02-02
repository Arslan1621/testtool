import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { upsertDomain } from './_lib/storage';
import { checkRedirects, checkSecurityHeaders, checkRobots, checkBrokenLinks, checkAiSummary, lookupWhois } from './_lib/helpers';

const scanInputSchema = z.object({
  url: z.string().min(1),
  tools: z.array(z.enum(["redirect", "broken_links", "security", "robots", "ai", "whois"])).min(1),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const input = scanInputSchema.parse(req.body);
    let url = input.url;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    const domainName = new URL(url).hostname;
    const updateData: any = { domain: domainName };
    
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
    
    const saved = await upsertDomain(updateData);
    return res.status(200).json(saved);
    
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error during scan" });
  }
}
