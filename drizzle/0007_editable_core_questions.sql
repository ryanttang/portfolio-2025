ALTER TABLE "onboarding_questions" ADD COLUMN "key" text;
--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_questions_key_uidx" ON "onboarding_questions" USING btree ("onboarding_id","key") WHERE "key" IS NOT NULL;
--> statement-breakpoint
INSERT INTO "onboarding_questions" ("id", "onboarding_id", "sort_order", "label", "help_text", "type", "options", "required", "key")
SELECT gen_random_uuid(), o.id, v.sort, v.label, NULL, v.qtype, '[]'::jsonb, false, v.key
FROM "onboardings" o
CROSS JOIN (
  VALUES
    (0, 'goals', 'Project goals', 'long_text'),
    (1, 'timeline', 'Timeline', 'short_text'),
    (2, 'budget', 'Budget range', 'short_text'),
    (3, 'audience', 'Target audience', 'long_text')
) AS v(sort, key, label, qtype)
WHERE NOT EXISTS (
  SELECT 1 FROM "onboarding_questions" q
  WHERE q.onboarding_id = o.id AND q.key = v.key
);
--> statement-breakpoint
UPDATE "onboarding_answers" a
SET "question_id" = q.id
FROM "onboarding_questions" q
WHERE q.onboarding_id = a.onboarding_id
  AND q.key IS NOT NULL
  AND a.key = q.key
  AND a.question_id IS NULL;
