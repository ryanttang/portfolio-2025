import { config } from "dotenv";
import { createHash } from "crypto";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import postgres from "postgres";

config({ path: ".env.local" });
config();

function migrationHash(filename: string) {
  return createHash("sha256")
    .update(readFileSync(`drizzle/${filename}`, "utf8"))
    .digest("hex");
}

async function migrationRecorded(sql: postgres.Sql, hash: string) {
  const [row] = await sql`
    select id from drizzle.__drizzle_migrations where hash = ${hash} limit 1
  `;
  return Boolean(row);
}

async function recordMigration(
  sql: postgres.Sql,
  filename: string,
  createdAt: number,
) {
  const hash = migrationHash(filename);
  if (await migrationRecorded(sql, hash)) return;
  await sql`
    insert into drizzle.__drizzle_migrations (hash, created_at)
    values (${hash}, ${createdAt})
  `;
  console.log(`Recorded migration ${filename}`);
}

async function portalHubSchemaPresent(sql: postgres.Sql) {
  const [row] = await sql`
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'portal_files'
    limit 1
  `;
  return Boolean(row);
}

async function columnPresent(
  sql: postgres.Sql,
  tableName: string,
  columnName: string,
) {
  const [row] = await sql`
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = ${tableName}
      and column_name = ${columnName}
    limit 1
  `;
  return Boolean(row);
}

async function tablePresent(sql: postgres.Sql, tableName: string) {
  const [row] = await sql`
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = ${tableName}
    limit 1
  `;
  return Boolean(row);
}

async function messagesEnabledPresent(sql: postgres.Sql) {
  return columnPresent(sql, "onboardings", "messages_enabled");
}

async function projectInfoPresent(sql: postgres.Sql) {
  return columnPresent(sql, "onboardings", "project_url");
}

async function invoicePaymentsPresent(sql: postgres.Sql) {
  const [row] = await sql`
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'invoice_payments'
    limit 1
  `;
  return Boolean(row);
}

async function ensureInvoicePayments(sql: postgres.Sql) {
  if (await invoicePaymentsPresent(sql)) return;

  console.log("Creating invoice_payments table");
  await sql`
    create table if not exists invoice_payments (
      id uuid primary key default gen_random_uuid() not null,
      invoice_id uuid not null references invoices(id) on delete cascade,
      sort_order integer default 0 not null,
      label text not null,
      amount_cents integer not null,
      due_date timestamp with time zone,
      status text default 'pending' not null,
      pay_token text not null unique,
      paypal_order_id text,
      paid_at timestamp with time zone,
      paid_via text,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null
    )
  `;
  await sql`
    create index if not exists invoice_payments_invoice_idx on invoice_payments (invoice_id)
  `;
  await sql`
    create index if not exists invoice_payments_pay_token_idx on invoice_payments (pay_token)
  `;
  await recordMigration(sql, "0014_invoice_payments.sql", 1787728500000);
}

async function ensureMilestoneCompletedAt(sql: postgres.Sql) {
  const hadColumn = await columnPresent(sql, "portal_milestones", "completed_at");
  if (!hadColumn) {
    console.log("Adding portal_milestones.completed_at");
    await sql`
      alter table portal_milestones
      add column if not exists completed_at timestamp with time zone
    `;
    await recordMigration(sql, "0015_milestone_completed_at.sql", 1787728600000);
  }

  const backfilled = await sql`
    update portal_milestones
    set completed_at = updated_at
    where status = 'done' and completed_at is null
    returning id
  `;
  if (backfilled.length) {
    console.log(`Backfilled completed_at on ${backfilled.length} done milestone(s)`);
  }
}

async function ensureProjectInfo(sql: postgres.Sql) {
  if (await projectInfoPresent(sql)) return;

  console.log("Adding onboardings project info columns");
  await sql`
    alter table onboardings
    add column if not exists project_url text
  `;
  await sql`
    alter table onboardings
    add column if not exists client_login_url text
  `;
  await sql`
    alter table onboardings
    add column if not exists client_username text
  `;
  await sql`
    alter table onboardings
    add column if not exists client_password_enc jsonb
  `;
  await recordMigration(sql, "0012_project_info.sql", 1787728300000);
}

async function ensureMessagesEnabled(sql: postgres.Sql) {
  if (await messagesEnabledPresent(sql)) return;

  console.log("Adding onboardings.messages_enabled");
  await sql`
    alter table onboardings
    add column if not exists messages_enabled boolean default false not null
  `;

  if (await tablePresent(sql, "portal_message_threads")) {
    await sql`
      update onboardings o
      set messages_enabled = true
      where exists (
        select 1 from portal_message_threads t where t.onboarding_id = o.id
      )
    `;
  }

  await recordMigration(sql, "0011_messages_enabled.sql", 1787728200000);
}

async function ensureSchema(sql: postgres.Sql) {
  if (await portalHubSchemaPresent(sql)) {
    const hash = migrationHash("0009_watery_blonde_phantom.sql");
    if (!(await migrationRecorded(sql, hash))) {
      console.log("Portal hub schema present without migration 0009; reconciling");
      await recordMigration(sql, "0009_watery_blonde_phantom.sql", 1787727777872);
    }
  }

  await ensureMessagesEnabled(sql);
  await ensureProjectInfo(sql);
  await ensureInvoicePayments(sql);
  await ensureMilestoneCompletedAt(sql);
}

async function verifySchema(sql: postgres.Sql) {
  const required: { table: string; column?: string }[] = [
    { table: "onboardings", column: "messages_enabled" },
    { table: "onboardings", column: "project_url" },
    { table: "onboardings", column: "client_login_url" },
    { table: "onboardings", column: "client_username" },
    { table: "onboardings", column: "client_password_enc" },
    { table: "portal_milestones", column: "completed_at" },
  ];

  const missing: string[] = [];
  for (const item of required) {
    if (item.column && !(await columnPresent(sql, item.table, item.column))) {
      missing.push(`${item.table}.${item.column}`);
    }
  }
  if (!(await invoicePaymentsPresent(sql))) {
    missing.push("invoice_payments");
  }

  if (missing.length) {
    throw new Error(`Database schema is missing required objects: ${missing.join(", ")}`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL not set; skipping migrations");
    return;
  }

  const sql = postgres(url, { max: 1 });
  try {
    await ensureSchema(sql);
    execSync("drizzle-kit migrate", { stdio: "inherit" });
    await ensureSchema(sql);
    await verifySchema(sql);
    console.log("Schema verified");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
