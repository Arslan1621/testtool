
import { domains, type InsertDomain } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getDomain(domain: string): Promise<typeof domains.$inferSelect | undefined>;
  getRecentDomains(limit?: number): Promise<typeof domains.$inferSelect[]>;
  upsertDomain(domain: InsertDomain): Promise<typeof domains.$inferSelect>;
}

export class DatabaseStorage implements IStorage {
  async getDomain(domainName: string): Promise<typeof domains.$inferSelect | undefined> {
    const [result] = await db
      .select()
      .from(domains)
      .where(eq(domains.domain, domainName));
    return result;
  }

  async getRecentDomains(limit = 10): Promise<typeof domains.$inferSelect[]> {
    return db
      .select()
      .from(domains)
      .orderBy(desc(domains.lastScannedAt))
      .limit(limit);
  }

  async upsertDomain(insertDomain: InsertDomain): Promise<typeof domains.$inferSelect> {
    // Try to update if exists, otherwise insert
    // Note: On conflict is Postgres specific, but Drizzle supports it nicely
    // If we simply want to "save scan", we can check existence first or use ON CONFLICT
    
    // We want to merge data if partial updates are allowed, but here a scan usually replaces old data for that tool?
    // Let's assume a scan might update only specific fields. 
    // However, Drizzle's `insert(...).onConflictDoUpdate` is cleanest.
    
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
            lastScannedAt: new Date(),
        }
      })
      .returning();
      
    return result;
  }
}

export const storage = new DatabaseStorage();
