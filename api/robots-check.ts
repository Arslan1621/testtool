import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRobots } from './_lib/helpers.js';

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

    const result = await checkRobots(cleanUrl);
    return res.status(200).json({ url: cleanUrl, ...result });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Failed to check robots.txt", error: err.message });
  }
}
