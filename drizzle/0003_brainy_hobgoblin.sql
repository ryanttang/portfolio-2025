ALTER TABLE "portal_invites" ADD COLUMN "onboarding_id" uuid;--> statement-breakpoint
ALTER TABLE "portal_milestones" ADD COLUMN "onboarding_id" uuid;--> statement-breakpoint
ALTER TABLE "portal_updates" ADD COLUMN "onboarding_id" uuid;--> statement-breakpoint
UPDATE "portal_updates" u
SET "onboarding_id" = (
  SELECT o.id FROM "onboardings" o
  WHERE o.client_id = u.client_id AND o.status <> 'cancelled'
  ORDER BY o.updated_at DESC
  LIMIT 1
);--> statement-breakpoint
UPDATE "portal_milestones" m
SET "onboarding_id" = (
  SELECT o.id FROM "onboardings" o
  WHERE o.client_id = m.client_id AND o.status <> 'cancelled'
  ORDER BY o.updated_at DESC
  LIMIT 1
);--> statement-breakpoint
DELETE FROM "portal_updates" WHERE "onboarding_id" IS NULL;--> statement-breakpoint
DELETE FROM "portal_milestones" WHERE "onboarding_id" IS NULL;--> statement-breakpoint
ALTER TABLE "portal_milestones" ALTER COLUMN "onboarding_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_updates" ALTER COLUMN "onboarding_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_invites" ADD CONSTRAINT "portal_invites_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_milestones" ADD CONSTRAINT "portal_milestones_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_updates" ADD CONSTRAINT "portal_updates_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portal_invites_onboarding_idx" ON "portal_invites" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "portal_milestones_onboarding_idx" ON "portal_milestones" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "portal_updates_onboarding_idx" ON "portal_updates" USING btree ("onboarding_id");
