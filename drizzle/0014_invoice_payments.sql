CREATE TABLE IF NOT EXISTS "invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_date" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"pay_token" text NOT NULL,
	"paypal_order_id" text,
	"paid_at" timestamp with time zone,
	"paid_via" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "invoice_payments_pay_token_unique" UNIQUE("pay_token")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_payments_invoice_idx" ON "invoice_payments" USING btree ("invoice_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_payments_pay_token_idx" ON "invoice_payments" USING btree ("pay_token");
