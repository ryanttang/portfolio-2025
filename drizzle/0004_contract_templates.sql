CREATE TABLE "contract_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"kind" text DEFAULT 'project' NOT NULL,
	"title_template" text DEFAULT '' NOT NULL,
	"body_template" text DEFAULT '' NOT NULL,
	"terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payment_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "contract_templates_slug_idx" ON "contract_templates" USING btree ("slug");
