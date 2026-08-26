ALTER TABLE "onboardings" ADD COLUMN "messages_enabled" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "onboardings" o
SET "messages_enabled" = true
WHERE EXISTS (
  SELECT 1
  FROM "portal_message_threads" t
  WHERE t.onboarding_id = o.id
);
