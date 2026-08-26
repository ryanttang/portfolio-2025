ALTER TABLE "onboardings" ADD COLUMN IF NOT EXISTS "project_url" text;
--> statement-breakpoint
ALTER TABLE "onboardings" ADD COLUMN IF NOT EXISTS "client_login_url" text;
--> statement-breakpoint
ALTER TABLE "onboardings" ADD COLUMN IF NOT EXISTS "client_username" text;
--> statement-breakpoint
ALTER TABLE "onboardings" ADD COLUMN IF NOT EXISTS "client_password_enc" jsonb;
