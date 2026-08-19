ALTER TABLE "question_template_items" ADD COLUMN "sensitive" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "onboarding_questions" ADD COLUMN "sensitive" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "onboarding_questions"
SET "sensitive" = true
WHERE label ILIKE '%login%'
   OR label ILIKE '%password%'
   OR label ILIKE '%credential%'
   OR label ILIKE '%secret%';
