CREATE TABLE "client_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"password_set_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_accounts_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "client_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "onboarding_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"question_id" uuid,
	"key" text,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"onboarding_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"help_text" text,
	"type" text DEFAULT 'short_text' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboardings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"project_name" text DEFAULT '' NOT NULL,
	"welcome_message" text DEFAULT 'Welcome! Let''s get your project set up. This short flow collects what I need to kick things off.' NOT NULL,
	"contract_enabled" boolean DEFAULT false NOT NULL,
	"contract_id" uuid,
	"deposit_enabled" boolean DEFAULT false NOT NULL,
	"invoice_id" uuid,
	"current_step" text DEFAULT 'welcome' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "portal_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"help_text" text,
	"type" text DEFAULT 'short_text' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_accounts" ADD CONSTRAINT "client_accounts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_answers" ADD CONSTRAINT "onboarding_answers_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_answers" ADD CONSTRAINT "onboarding_answers_question_id_onboarding_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."onboarding_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_questions" ADD CONSTRAINT "onboarding_questions_onboarding_id_onboardings_id_fk" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboardings" ADD CONSTRAINT "onboardings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboardings" ADD CONSTRAINT "onboardings_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboardings" ADD CONSTRAINT "onboardings_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invites" ADD CONSTRAINT "portal_invites_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_milestones" ADD CONSTRAINT "portal_milestones_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_updates" ADD CONSTRAINT "portal_updates_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_updates" ADD CONSTRAINT "portal_updates_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_template_items" ADD CONSTRAINT "question_template_items_template_id_question_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."question_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_accounts_email_idx" ON "client_accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "onboarding_answers_onboarding_idx" ON "onboarding_answers" USING btree ("onboarding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_answers_question_uidx" ON "onboarding_answers" USING btree ("onboarding_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_answers_key_uidx" ON "onboarding_answers" USING btree ("onboarding_id","key");--> statement-breakpoint
CREATE INDEX "onboarding_questions_onboarding_idx" ON "onboarding_questions" USING btree ("onboarding_id");--> statement-breakpoint
CREATE INDEX "onboardings_client_idx" ON "onboardings" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "onboardings_status_idx" ON "onboardings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portal_invites_client_idx" ON "portal_invites" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "portal_invites_token_uidx" ON "portal_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "portal_milestones_client_idx" ON "portal_milestones" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "portal_updates_client_idx" ON "portal_updates" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "question_template_items_template_idx" ON "question_template_items" USING btree ("template_id");