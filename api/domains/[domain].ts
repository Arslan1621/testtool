import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDomain } from '../_lib/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domain } = req.query;
  
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ message: 'Domain parameter is required' });
  }

  try {
    const data = await getDomain(domain);
    if (!data) {
      return res.status(404).json({ message: 'Domain report not found' });
    }
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Error fetching domain:', err);
    return res.status(500).json({ message: err.message });
  }
}
