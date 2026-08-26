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

async function messagesEnabledPresent(sql: postgres.Sql) {
  const [row] = await sql`
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'onboardings'
      and column_name = 'messages_enabled'
    limit 1
  `;
  return Boolean(row);
}

async function projectInfoPresent(sql: postgres.Sql) {
  const [row] = await sql`
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'onboardings'
      and column_name = 'project_url'
    limit 1
  `;
  return Boolean(row);
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
  await sql`
    update onboardings o
    set messages_enabled = true
    where exists (
      select 1 from portal_message_threads t where t.onboarding_id = o.id
    )
  `;
  await recordMigration(sql, "0011_messages_enabled.sql", 1787728200000);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL not set; skipping migrations");
    return;
  }

  const sql = postgres(url, { max: 1 });
  try {
    if (await portalHubSchemaPresent(sql)) {
      const hash = migrationHash("0009_watery_blonde_phantom.sql");
      if (!(await migrationRecorded(sql, hash))) {
        console.log("Portal hub schema present without migration 0009; reconciling");
        await recordMigration(sql, "0009_watery_blonde_phantom.sql", 1787727777872);
      }
    }

    await ensureMessagesEnabled(sql);
    await ensureProjectInfo(sql);

    execSync("drizzle-kit migrate", { stdio: "inherit" });
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
