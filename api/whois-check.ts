import type { VercelRequest, VercelResponse } from '@vercel/node';
import { lookupWhois } from './_lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { domain } = req.body;
    
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ message: "Please provide a domain" });
    }

    let cleanDomain = domain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    cleanDomain = cleanDomain.split('/')[0];
    cleanDomain = cleanDomain.replace(/^www\./, '');

    const whoisData = await lookupWhois(cleanDomain);
    
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

    return res.status(200).json({ 
      domain: cleanDomain, 
      data: whoisData,
      rawText: rawLines.filter(line => line !== undefined).join('\n')
    });
  } catch (err: any) {
    console.error('WHOIS Error:', err);
    return res.status(500).json({ 
      domain: req.body.domain,
      error: err.message || "Failed to lookup WHOIS information"
    });
  }
}
