WITH base AS (
  SELECT
    o.id,
    left(
      trim(both '-' from regexp_replace(
        lower(coalesce(nullif(o.project_name, ''), 'project')),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      48
    ) AS base_slug
  FROM "onboardings" o
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
