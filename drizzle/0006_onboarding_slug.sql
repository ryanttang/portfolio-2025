ALTER TABLE "onboardings" ADD COLUMN "slug" text;
--> statement-breakpoint
WITH base AS (
  SELECT
    o.id,
    trim(both '-' from regexp_replace(
      lower(
        concat(
          coalesce(nullif(o.project_name, ''), 'project'),
          '-',
          coalesce(nullif(c.name, ''), 'client')
        )
      ),
      '[^a-z0-9]+',
      '-',
      'g'
    )) AS base_slug
  FROM "onboardings" o
  INNER JOIN "clients" c ON c.id = o.client_id
),
numbered AS (
  SELECT
    id,
    CASE
      WHEN base_slug IS NULL OR base_slug = '' THEN 'project'
      ELSE base_slug
    END AS base_slug,
    row_number() OVER (
      PARTITION BY
        CASE
          WHEN base_slug IS NULL OR base_slug = '' THEN 'project'
          ELSE base_slug
        END
      ORDER BY id
    ) AS n
  FROM base
)
UPDATE "onboardings" o
SET "slug" = CASE
  WHEN n.n = 1 THEN n.base_slug
  ELSE n.base_slug || '-' || n.n::text
END
FROM numbered n
WHERE o.id = n.id;
--> statement-breakpoint
UPDATE "onboardings"
SET "slug" = 'project-' || substr(id::text, 1, 8)
WHERE "slug" IS NULL OR "slug" = '';
--> statement-breakpoint
ALTER TABLE "onboardings" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "onboardings_slug_uidx" ON "onboardings" USING btree ("slug");
