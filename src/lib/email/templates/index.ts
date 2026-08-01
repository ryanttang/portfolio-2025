import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { EMAIL_PRESETS } from "@/lib/email/presets";

export async function listEmailTemplates() {
  return db.select().from(emailTemplates).orderBy(desc(emailTemplates.isPreset), emailTemplates.name);
}

export async function getEmailTemplate(id: string) {
  const [row] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1);
  return row || null;
}

export async function getEmailTemplateBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.slug, slug))
    .limit(1);
  return row || null;
}

export async function createEmailTemplate(data: {
  name: string;
  slug: string;
  category?: string;
  subject: string;
  bodyHtml: string;
  isPreset?: boolean;
}) {
  const [row] = await db
    .insert(emailTemplates)
    .values({
      name: data.name,
      slug: data.slug,
      category: data.category || "general",
      subject: data.subject,
      bodyHtml: data.bodyHtml,
      isPreset: data.isPreset ?? false,
    })
    .returning();
  return row;
}

export async function updateEmailTemplate(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    category: string;
    subject: string;
    bodyHtml: string;
  }>,
) {
  const existing = await getEmailTemplate(id);
  if (!existing) return null;
  if (existing.isPreset) {
    throw new Error("Preset templates are read-only. Duplicate to customize.");
  }
  const [row] = await db
    .update(emailTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id))
    .returning();
  return row || null;
}

export async function deleteEmailTemplate(id: string) {
  const existing = await getEmailTemplate(id);
  if (!existing) return false;
  if (existing.isPreset) {
    throw new Error("Cannot delete preset templates");
  }
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  return true;
}

export async function duplicateEmailTemplate(id: string) {
  const existing = await getEmailTemplate(id);
  if (!existing) return null;
  const baseSlug = `${existing.slug}-copy`;
  let slug = baseSlug;
  let n = 1;
  while (await getEmailTemplateBySlug(slug)) {
    slug = `${baseSlug}-${n++}`;
  }
  return createEmailTemplate({
    name: `${existing.name} (copy)`,
    slug,
    category: existing.category,
    subject: existing.subject,
    bodyHtml: existing.bodyHtml,
    isPreset: false,
  });
}

export async function seedEmailPresets() {
  for (const preset of EMAIL_PRESETS) {
    const existing = await getEmailTemplateBySlug(preset.slug);
    if (existing) {
      if (existing.isPreset) {
        await db
          .update(emailTemplates)
          .set({
            name: preset.name,
            category: preset.category,
            subject: preset.subject,
            bodyHtml: preset.bodyHtml,
            updatedAt: new Date(),
          })
          .where(eq(emailTemplates.id, existing.id));
      }
      continue;
    }
    await createEmailTemplate({ ...preset, isPreset: true });
  }
}
