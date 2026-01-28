
import { z } from 'zod';
import { insertDomainSchema, domains } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  serverError: z.object({
    message: z.string(),
  }),
};

export const api = {
  domains: {
    // Get aggregated report for a domain
    get: {
      method: 'GET' as const,
      path: '/api/domains/:domain',
      responses: {
        200: z.custom<typeof domains.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // List recently scanned domains
    list: {
      method: 'GET' as const,
      path: '/api/domains',
      responses: {
        200: z.array(z.custom<typeof domains.$inferSelect>()),
      },
    },
    // Run a scan (create or update domain data)
    scan: {
      method: 'POST' as const,
      path: '/api/scan',
      input: z.object({
        url: z.string().min(1),
        tools: z.array(z.enum(["redirect", "broken_links", "security", "robots", "ai", "whois"])).min(1),
      }),
      responses: {
        200: z.custom<typeof domains.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.serverError,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ScanInput = z.infer<typeof api.domains.scan.input>;
