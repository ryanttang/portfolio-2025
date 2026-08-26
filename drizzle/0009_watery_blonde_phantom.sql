CREATE TABLE "portal_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"blob_url" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"uploaded_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"timezone" text DEFAULT 'America/Los_Angeles' NOT NULL,
	"location" text,
	"ics_uid" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_message_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_message_threads_onboarding_id_unique" UNIQUE("onboarding_id")
);
--> statement-breakpoint
CREATE TABLE "portal_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_type" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"created_by_admin_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"onboarding_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"ref_type" text,
	"ref_id" text,
	"read_at" timestamp with time zone,
	"emailed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "portal_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"link_url" text,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "payment_notes" text;--> statement-breakpoint
ALTER TABLE "onboarding_questions" ADD COLUMN "key" text;--> statement-breakpoint
ALTER TABLE "onboarding_questions" ADD COLUMN "sensitive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "onboardings" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "onboardings" ADD COLUMN "hub_welcome_message" text;--> statement-breakpoint
ALTER TABLE "onboardings" ADD COLUMN "hub_welcome_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "question_template_items" ADD COLUMN "sensitive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_files" ADD CONSTRAINT "portal_files_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_files" ADD CONSTRAINT "portal_files_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_files" ADD CONSTRAINT "portal_files_uploaded_by_admin_id_admins_id_fk" FOREIGN KEY ("uploaded_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_meetings" ADD CONSTRAINT "portal_meetings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_meetings" ADD CONSTRAINT "portal_meetings_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_message_threads" ADD CONSTRAINT "portal_message_threads_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_message_threads" ADD CONSTRAINT "portal_message_threads_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_thread_id_portal_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."portal_message_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_messages" ADD CONSTRAINT "portal_messages_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_notifications" ADD CONSTRAINT "portal_notifications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_notifications" ADD CONSTRAINT "portal_notifications_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_password_resets" ADD CONSTRAINT "portal_password_resets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_tasks" ADD CONSTRAINT "portal_tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_tasks" ADD CONSTRAINT "portal_tasks_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "portal_files_client_idx" ON "portal_files" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_files_onboarding_idx" ON "portal_files" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "portal_meetings_client_idx" ON "portal_meetings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_meetings_onboarding_idx" ON "portal_meetings" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "portal_message_threads_client_idx" ON "portal_message_threads" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_messages_thread_idx" ON "portal_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "portal_notifications_client_idx" ON "portal_notifications" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_notifications_onboarding_idx" ON "portal_notifications" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "portal_password_resets_client_idx" ON "portal_password_resets" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "portal_password_resets_token_uidx" ON "portal_password_resets" USING btree ("token");--> statement-breakpoint
CREATE INDEX "portal_tasks_client_idx" ON "portal_tasks" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_tasks_onboarding_idx" ON "portal_tasks" USING btree ("onboarding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_questions_key_uidx" ON "onboarding_questions" USING btree ("onboarding_id","key") WHERE "onboarding_questions"."key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "onboardings_slug_uidx" ON "onboardings" USING btree ("slug");