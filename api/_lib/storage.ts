import { domains, type InsertDomain } from "../../shared/schema.js";
import { db } from "./db.js";
import { eq, desc } from "drizzle-orm";
export async function getDomain(domainName: string) {
  const [result] = await db
    .select()
    .from(domains)
    .where(eq(domains.domain, domainName));
  return result;
}

export async function getRecentDomains(limit = 10) {
  return db
    .select()
    .from(domains)
    .orderBy(desc(domains.lastScannedAt))
    .limit(limit);
}

export async function upsertDomain(insertDomain: InsertDomain) {
  const [result] = await db
    .insert(domains)
    .values(insertDomain)
    .onConflictDoUpdate({
      target: domains.domain,
      set: {
        redirectData: insertDomain.redirectData,
        brokenLinksData: insertDomain.brokenLinksData,
        securityData: insertDomain.securityData,
        robotsData: insertDomain.robotsData,
        aiData: insertDomain.aiData,
        whoisData: insertDomain.whoisData,
        lastScannedAt: new Date(),
      }
    })
    .returning();
  return result;
}
