import { db } from "@/db";
import { auditLog } from "@/db/schema";

export async function logAudit(
  action: string,
  entity: string,
  entityId?: string | null,
  payload?: unknown,
) {
  try {
    await db.insert(auditLog).values({
      action,
      entity,
      entityId: entityId || null,
      payload: payload ?? null,
    });
  } catch (err) {
    console.error("[audit]", err);
  }
}
