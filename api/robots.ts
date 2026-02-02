import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers.host || 'example.com';
  const robots = `User-agent: *
Allow: /
Sitemap: https://${host}/sitemap.xml`;
  
  res.setHeader('Content-Type', 'text/plain');
  return res.status(200).send(robots);
}
