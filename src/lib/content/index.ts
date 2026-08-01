import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteContent, siteSettings } from "@/db/schema";
import { getDefaultContent, getDefaultSetting } from "./defaults";

export async function getContent<T = unknown>(key: string): Promise<T> {
  try {
    const [row] = await db
      .select()
      .from(siteContent)
      .where(eq(siteContent.key, key))
      .limit(1);
    if (row) return row.payload as T;
  } catch {
    // DB unavailable — fall back
  }
  return getDefaultContent(key) as T;
}

export async function setContent(key: string, payload: unknown) {
  await db
    .insert(siteContent)
    .values({ key, payload, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteContent.key,
      set: { payload, updatedAt: new Date() },
    });
}

export async function getSetting<T = unknown>(key: string): Promise<T> {
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    if (row) return row.value as T;
  } catch {
    // fall through
  }
  return getDefaultSetting(key) as T;
}

export async function setSetting(key: string, value: unknown) {
  await db
    .insert(siteSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function listContentKeys() {
  try {
    return await db.select({ key: siteContent.key, updatedAt: siteContent.updatedAt }).from(siteContent);
  } catch {
    return Object.keys(await import("./defaults").then((m) => m.defaultContent)).map((key) => ({
      key,
      updatedAt: null as Date | null,
    }));
  }
}
