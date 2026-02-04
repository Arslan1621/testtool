import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRedirects } from './_lib/helpers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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

    return res.status(200).json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
