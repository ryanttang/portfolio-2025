import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contractTemplates } from "@/db/schema";
import { buildContractDraft } from "@/lib/contracts/merge";

export { buildContractDraft };

export type ContractTemplateKind = "project" | "retainer" | "consulting";

export type ContractTemplateRow = typeof contractTemplates.$inferSelect;

const PROJECT_BODY = `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of {{date}} by and between:

Provider: {{seller_name}}
{{seller_address}}

Client: {{name}}
{{company}}
{{email}}
{{address}}
{{phone}}

1. Scope of Work
The Provider will perform professional design, development, and/or marketing services as mutually agreed for the Client. The specific deliverables, timeline, and milestones will be confirmed in writing (including email) prior to kickoff.

2. Fees
Total project fee: {{amount}}
Unless otherwise agreed in writing, invoices are due according to the payment schedule below.

3. Payment & Terms
{{terms}}

4. Intellectual Property
Upon full payment, the Client receives ownership of final deliverables created specifically for the Client under this Agreement. The Provider retains the right to display non-confidential work in portfolios and marketing materials.

5. Limitation of Liability
The Provider's total liability under this Agreement shall not exceed the fees paid by the Client for the services giving rise to the claim.

6. Entire Agreement
This Agreement constitutes the entire understanding between the parties and supersedes prior proposals or discussions relating to its subject matter.

Agreed:

Provider: _______________________________    Date: ____________

Client: _________________________________    Date: ____________
{{name}}`;

const RETAINER_BODY = `RETAINER AGREEMENT

This Retainer Agreement ("Agreement") is entered into as of {{date}} by and between:

Provider: {{seller_name}}
{{seller_address}}

Client: {{name}}
{{company}}
{{email}}
{{address}}
{{phone}}

1. Services
The Provider will make available ongoing strategy, consulting, and/or execution support as described in the selected retainer package and any written scope updates.

2. Fees
Monthly retainer fee: {{amount}}
Fees are billed according to the terms below.

3. Terms
{{terms}}

4. Intellectual Property
Materials created specifically for the Client under this retainer transfer to the Client upon payment for the period in which they were delivered. The Provider may reuse general methodologies and non-confidential examples.

5. Entire Agreement
This Agreement constitutes the entire understanding between the parties regarding the retainer relationship.

Agreed:

Provider: _______________________________    Date: ____________

Client: _________________________________    Date: ____________
{{name}}`;

const CONSULTING_BODY = `CONSULTING AGREEMENT

This Consulting Agreement ("Agreement") is entered into as of {{date}} by and between:

Provider: {{seller_name}}
{{seller_address}}

Client: {{name}}
{{company}}
{{email}}
{{address}}
{{phone}}

1. Engagement
The Provider will deliver a focused consulting engagement covering strategy review, recommendations, and follow-up as outlined below.

2. Fees
Engagement fee: {{amount}}
Payment is due as agreed prior to or at the start of the engagement unless otherwise stated in writing.

3. Scope & Terms
{{terms}}

4. Confidentiality
Each party agrees to keep confidential information received from the other party confidential, except where disclosure is required by law or already public.

5. Entire Agreement
This Agreement constitutes the entire understanding between the parties for this consulting engagement.

Agreed:

Provider: _______________________________    Date: ____________

Client: _________________________________    Date: ____________
{{name}}`;

export const DEFAULT_CONTRACT_TEMPLATES: {
  name: string;
  slug: string;
  kind: ContractTemplateKind;
  titleTemplate: string;
  bodyTemplate: string;
  terms: string[];
  paymentNotes: string | null;
}[] = [
  {
    name: "Project Agreement",
    slug: "project",
    kind: "project",
    titleTemplate: "Service Agreement — {{company}}",
    bodyTemplate: PROJECT_BODY,
    terms: [
      "Two revision rounds included; additional revisions billed separately",
      "Client delays may shift the delivery timeline",
      "Out-of-scope requests require a change order",
      "Rush projects carry a 25–50% premium",
    ],
    paymentNotes:
      "Projects under ~$10k: 50% to begin, 25% after design approval, 25% before launch.\nSmaller projects: 50% / 50%.",
  },
  {
    name: "Retainer Agreement",
    slug: "retainer",
    kind: "retainer",
    titleTemplate: "Retainer Agreement — {{company}}",
    bodyTemplate: RETAINER_BODY,
    terms: [
      "Paid at the beginning of each month",
      "Three-month initial commitment",
      "Defined monthly capacity",
      "Unused capacity expires",
      "Additional work billed at $150/hour or quoted separately",
      "30-day cancellation notice after the initial term",
    ],
    paymentNotes: null,
  },
  {
    name: "Consulting Agreement",
    slug: "consulting",
    kind: "consulting",
    titleTemplate: "Consulting Agreement — {{company}}",
    bodyTemplate: CONSULTING_BODY,
    terms: [
      "Up to six hours of consulting",
      "Marketing and digital ecosystem review",
      "Prioritized recommendations",
      "Pre-session questionnaire",
      "30-day action roadmap",
      "One follow-up call",
    ],
    paymentNotes: null,
  },
];

export async function listContractTemplates() {
  await ensureContractTemplates();
  return db
    .select()
    .from(contractTemplates)
    .orderBy(asc(contractTemplates.name));
}

export async function getContractTemplate(id: string) {
  const [row] = await db
    .select()
    .from(contractTemplates)
    .where(eq(contractTemplates.id, id))
    .limit(1);
  return row || null;
}

export async function ensureContractTemplates() {
  const existing = await db.select({ id: contractTemplates.id }).from(contractTemplates).limit(1);
  if (existing.length) return;
  for (const preset of DEFAULT_CONTRACT_TEMPLATES) {
    await db.insert(contractTemplates).values({
      name: preset.name,
      slug: preset.slug,
      kind: preset.kind,
      titleTemplate: preset.titleTemplate,
      bodyTemplate: preset.bodyTemplate,
      terms: preset.terms,
      paymentNotes: preset.paymentNotes,
    });
  }
}

export async function updateContractTemplate(
  id: string,
  data: Partial<{
    name: string;
    titleTemplate: string;
    bodyTemplate: string;
    terms: string[];
    paymentNotes: string | null;
    kind: ContractTemplateKind;
  }>,
) {
  const [row] = await db
    .update(contractTemplates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(contractTemplates.id, id))
    .returning();
  return row || null;
}

