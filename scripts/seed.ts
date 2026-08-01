import { config } from "dotenv";
config({ path: ".env.local" });
config();

async function main() {
  const { hash } = await import("bcryptjs");
  const { eq } = await import("drizzle-orm");
  const { db, client } = await import("../src/db");
  const { admins, siteContent, siteSettings } = await import("../src/db/schema");
  const { defaultContent, defaultSettings } = await import("../src/lib/content/defaults");
  const { seedEmailPresets } = await import("../src/lib/email/templates");

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

  await seedEmailPresets();
  console.log("Seeded email templates");

  await client.end({ timeout: 5 });
}

main().catch(async (err) => {
  console.error(err);
  try {
    const { client } = await import("../src/db");
    await client.end({ timeout: 5 });
  } catch {
    /* ignore */
  }
  process.exit(1);
});
