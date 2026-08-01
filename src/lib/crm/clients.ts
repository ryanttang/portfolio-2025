import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { clientActivities, clientNotes, clients } from "@/db/schema";
import { logAudit } from "@/lib/audit";

export type ClientStatus = "lead" | "active" | "past" | "archived";

export async function listClients(opts?: { status?: string; q?: string; tag?: string }) {
  const conditions = [];
  if (opts?.status) conditions.push(eq(clients.status, opts.status));
  if (opts?.q) {
    const q = `%${opts.q}%`;
    conditions.push(
      or(ilike(clients.name, q), ilike(clients.email, q), ilike(clients.company, q)),
    );
  }
  if (opts?.tag) {
    conditions.push(sql`${clients.tags} @> ${JSON.stringify([opts.tag])}::jsonb`);
  }
  const where = conditions.length ? and(...conditions) : undefined;
  return db
    .select()
    .from(clients)
    .where(where)
    .orderBy(desc(clients.updatedAt));
}

export async function getClient(id: string) {
  const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return row || null;
}

export async function findClientByEmail(email: string) {
  const [row] = await db
    .select()
    .from(clients)
    .where(eq(clients.email, email.toLowerCase()))
    .limit(1);
  return row || null;
}

export async function createClient(data: {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  address?: string | null;
  status?: ClientStatus;
  tags?: string[];
  notes?: string | null;
}) {
  const [row] = await db
    .insert(clients)
    .values({
      name: data.name,
      email: data.email.toLowerCase(),
      company: data.company || null,
      phone: data.phone || null,
      address: data.address || null,
      status: data.status || "lead",
      tags: data.tags || [],
      notes: data.notes || null,
    })
    .returning();
  await logAudit("create", "client", row.id, { email: row.email });
  await addActivity(row.id, "status", `Client created as ${row.status}`);
  return row;
}

export async function updateClient(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    address: string | null;
    status: ClientStatus;
    tags: string[];
    notes: string | null;
  }>,
) {
  const [row] = await db
    .update(clients)
    .set({
      ...data,
      email: data.email ? data.email.toLowerCase() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id))
    .returning();
  if (row) await logAudit("update", "client", id, data);
  return row || null;
}

export async function addNote(clientId: string, body: string) {
  const [note] = await db
    .insert(clientNotes)
    .values({ clientId, body })
    .returning();
  await addActivity(clientId, "note", body.slice(0, 120));
  return note;
}

export async function listNotes(clientId: string) {
  return db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, clientId))
    .orderBy(desc(clientNotes.createdAt));
}

export async function addActivity(
  clientId: string,
  type: string,
  summary: string,
  refId?: string,
) {
  const [row] = await db
    .insert(clientActivities)
    .values({ clientId, type, summary, refId: refId || null })
    .returning();
  return row;
}

export async function listActivities(clientId: string) {
  return db
    .select()
    .from(clientActivities)
    .where(eq(clientActivities.clientId, clientId))
    .orderBy(desc(clientActivities.createdAt))
    .limit(50);
}

export async function ensureClientFromEmail(fromEmail: string, nameHint?: string) {
  const existing = await findClientByEmail(fromEmail);
  if (existing) return existing;
  const name = nameHint || fromEmail.split("@")[0] || fromEmail;
  return createClient({
    name,
    email: fromEmail,
    status: "lead",
  });
}

export async function clientStats() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      leads: sql<number>`count(*) filter (where ${clients.status} = 'lead')::int`,
    })
    .from(clients);
  return row;
}
