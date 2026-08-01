import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  payload: jsonb("payload").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  pathOrUrl: text("path_or_url").notNull(),
  alt: text("alt"),
  section: text("section"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    company: text("company"),
    email: text("email").notNull(),
    phone: text("phone"),
    address: text("address"),
    status: text("status").notNull().default("lead"), // lead | active | past | archived
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("clients_email_idx").on(t.email), index("clients_status_idx").on(t.status)],
);

export const clientNotes = pgTable("client_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientActivities = pgTable(
  "client_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // note | email | contract | invoice | status
    summary: text("summary").notNull(),
    refId: text("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("client_activities_client_idx").on(t.clientId)],
);

export const emailThreads = pgTable("email_threads", {
  id: uuid("id").defaultRandom().primaryKey(),
  subject: text("subject").notNull().default("(no subject)"),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  participants: jsonb("participants").$type<string[]>().notNull().default([]),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailMessages = pgTable(
  "email_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => emailThreads.id, { onDelete: "cascade" }),
    direction: text("direction").notNull(), // inbound | outbound
    fromEmail: text("from_email").notNull(),
    toEmails: jsonb("to_emails").$type<string[]>().notNull().default([]),
    ccEmails: jsonb("cc_emails").$type<string[]>().notNull().default([]),
    subject: text("subject").notNull().default(""),
    textBody: text("text_body"),
    htmlBody: text("html_body"),
    resendId: text("resend_id"),
    messageId: text("message_id"),
    inReplyTo: text("in_reply_to"),
    status: text("status").notNull().default("queued"), // queued | sent | delivered | failed | received
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("email_messages_thread_idx").on(t.threadId),
    index("email_messages_message_id_idx").on(t.messageId),
  ],
);

export const emailAttachments = pgTable("email_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => emailMessages.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  contentType: text("content_type"),
  size: integer("size"),
  storageUrl: text("storage_url").notNull(),
});

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    bodyText: text("body_text").notNull().default(""),
    status: text("status").notNull().default("draft"), // draft | sent | signed | void
    token: text("token").notNull().unique(),
    amountCents: integer("amount_cents"),
    notes: text("notes"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("contracts_status_idx").on(t.status)],
);

export const contractSignatures = pgTable(
  "contract_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull().unique(),
    status: text("status").notNull().default("pending"), // pending | completed
    signerName: text("signer_name"),
    signerEmail: text("signer_email"),
    signatureMethod: text("signature_method"), // draw | type
    esignConsentVersion: text("esign_consent_version"),
    esignConsentedAt: timestamp("esign_consented_at", { withTimezone: true }),
    pdfSha256: text("pdf_sha256"),
    signedPdfUrl: text("signed_pdf_url"),
    auditJson: jsonb("audit_json"),
    signerIp: text("signer_ip"),
    signerUserAgent: text("signer_user_agent"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("contract_signatures_external_id_uidx").on(t.externalId)],
);

export const invoiceCounters = pgTable("invoice_counters", {
  year: integer("year").primaryKey(),
  counter: integer("counter").notNull().default(0),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceNumber: text("invoice_number").notNull().unique(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
    status: text("status").notNull().default("draft"), // draft | saved | sent | paid | void
    issueDate: timestamp("issue_date", { withTimezone: true }).defaultNow().notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    currency: text("currency").notNull().default("USD"),
    sellerLegalName: text("seller_legal_name"),
    sellerAddress: text("seller_address"),
    sellerTaxId: text("seller_tax_id"),
    sellerPaymentInstructions: text("seller_payment_instructions"),
    sellerFooterNote: text("seller_footer_note"),
    clientName: text("client_name"),
    clientCompany: text("client_company"),
    clientEmail: text("client_email"),
    clientPhone: text("client_phone"),
    clientAddress: text("client_address"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    notesPublic: text("notes_public"),
    notesInternal: text("notes_internal"),
    paypalOrderId: text("paypal_order_id"),
    paypalEnabled: boolean("paypal_enabled").notNull().default(false),
    payToken: text("pay_token").notNull().unique(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("invoices_status_idx").on(t.status)],
);

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  isTaxable: boolean("is_taxable").notNull().default(false),
});

export const pageEvents = pgTable(
  "page_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("page_events_created_idx").on(t.createdAt),
    index("page_events_path_idx").on(t.path),
  ],
);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientAccounts = pgTable(
  "client_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" })
      .unique(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    passwordSetAt: timestamp("password_set_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("client_accounts_email_idx").on(t.email)],
);

export const portalInvites = pgTable(
  "portal_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("portal_invites_client_idx").on(t.clientId),
    uniqueIndex("portal_invites_token_uidx").on(t.token),
  ],
);

export const onboardings = pgTable(
  "onboardings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("draft"), // draft | sent | in_progress | completed | cancelled
    projectName: text("project_name").notNull().default(""),
    welcomeMessage: text("welcome_message").notNull().default(
      "Welcome! Let's get your project set up. This short flow collects what I need to kick things off.",
    ),
    /** Selected service offerings for this onboarding (from CMS catalog). */
    services: jsonb("services")
      .$type<{ id: string; label: string; group: string; price?: string }[]>()
      .notNull()
      .default([]),
    contractEnabled: boolean("contract_enabled").notNull().default(false),
    contractId: uuid("contract_id").references(() => contracts.id, { onDelete: "set null" }),
    depositEnabled: boolean("deposit_enabled").notNull().default(false),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    currentStep: text("current_step").notNull().default("welcome"), // welcome | info | questionnaire | contract | deposit | handoff
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("onboardings_client_idx").on(t.clientId),
    index("onboardings_status_idx").on(t.status),
  ],
);

export const questionTemplates = pgTable("question_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const questionTemplateItems = pgTable(
  "question_template_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => questionTemplates.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    label: text("label").notNull(),
    helpText: text("help_text"),
    type: text("type").notNull().default("short_text"), // short_text | long_text | single_select | multi_select | boolean
    options: jsonb("options").$type<string[]>().notNull().default([]),
    required: boolean("required").notNull().default(true),
  },
  (t) => [index("question_template_items_template_idx").on(t.templateId)],
);

export const onboardingQuestions = pgTable(
  "onboarding_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    onboardingId: uuid("onboarding_id")
      .notNull()
      .references(() => onboardings.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    label: text("label").notNull(),
    helpText: text("help_text"),
    type: text("type").notNull().default("short_text"),
    options: jsonb("options").$type<string[]>().notNull().default([]),
    required: boolean("required").notNull().default(true),
  },
  (t) => [index("onboarding_questions_onboarding_idx").on(t.onboardingId)],
);

export const onboardingAnswers = pgTable(
  "onboarding_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    onboardingId: uuid("onboarding_id")
      .notNull()
      .references(() => onboardings.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").references(() => onboardingQuestions.id, {
      onDelete: "cascade",
    }),
    key: text("key"), // fixed core keys: goals | timeline | budget | audience
    value: jsonb("value").notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("onboarding_answers_onboarding_idx").on(t.onboardingId),
    uniqueIndex("onboarding_answers_question_uidx").on(t.onboardingId, t.questionId),
    uniqueIndex("onboarding_answers_key_uidx").on(t.onboardingId, t.key),
  ],
);

export const portalUpdates = pgTable(
  "portal_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    createdByAdminId: uuid("created_by_admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("portal_updates_client_idx").on(t.clientId)],
);

export const portalMilestones = pgTable(
  "portal_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("upcoming"), // upcoming | in_progress | done
    sortOrder: integer("sort_order").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("portal_milestones_client_idx").on(t.clientId)],
);
