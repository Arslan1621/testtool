import type { VercelRequest, VercelResponse } from '@vercel/node';

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
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)' }
    });
    
    return res.status(200).json({ 
      url: cleanUrl, 
      status: response.status, 
      ok: response.ok 
    });
  } catch (err: any) {
    return res.status(200).json({ 
      url: req.body.url, 
      status: 0, 
      ok: false, 
      error: err.message 
    });
  }
}
