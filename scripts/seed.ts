import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, client } from "../src/db";
import { admins, siteContent, siteSettings } from "../src/db/schema";
import { defaultContent, defaultSettings } from "../src/lib/content/defaults";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@ryantang.site").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "changeme";
  const passwordHash =
    process.env.ADMIN_PASSWORD_HASH || (await hash(password, 12));

  const [existing] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
  if (!existing) {
    await db.insert(admins).values({ email, passwordHash });
    console.log(`Seeded admin: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      });
  }
  console.log("Seeded site settings");

  for (const [key, payload] of Object.entries(defaultContent)) {
    await db
      .insert(siteContent)
      .values({ key, payload })
      .onConflictDoNothing();
  }
  console.log("Seeded site content (skipped existing keys)");

  await client.end({ timeout: 5 });
}

main().catch(async (err) => {
  console.error(err);
  await client.end({ timeout: 5 });
  process.exit(1);
});
