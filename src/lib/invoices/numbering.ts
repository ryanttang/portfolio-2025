import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { invoiceCounters } from "@/db/schema";

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  await db
    .insert(invoiceCounters)
    .values({ year, counter: 0 })
    .onConflictDoNothing();

  const [row] = await db
    .update(invoiceCounters)
    .set({ counter: sql`${invoiceCounters.counter} + 1` })
    .where(eq(invoiceCounters.year, year))
    .returning();

  const n = String(row.counter).padStart(5, "0");
  return `INV-${year}-${n}`;
}
