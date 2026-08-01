import type { ServicesTermsContent } from "@/lib/content/schemas";

export type { ServicesTermsContent };

export type TermsTemplateKind = "project" | "retainer" | "consulting";

/** Build contract payment-notes text from public Services terms payment schedule. */
export function formatProjectPaymentNotes(content: ServicesTermsContent): string {
  const lines = content.projectPaymentLines.map((l) => l.trim()).filter(Boolean);
  const note = content.projectPaymentNote.trim();
  const parts: string[] = [];
  if (lines.length) {
    parts.push(`Payment terms: ${lines.join(", ")}.`);
  }
  if (note) parts.push(note);
  return parts.join("\n").trim();
}

export function termsForKind(
  content: ServicesTermsContent,
  kind: TermsTemplateKind,
): string[] | null {
  if (kind === "project") {
    return content.projectTerms.map((t) => t.trim()).filter(Boolean);
  }
  if (kind === "retainer") {
    return content.retainerTerms.map((t) => t.trim()).filter(Boolean);
  }
  return null;
}

export function paymentNotesForKind(
  content: ServicesTermsContent,
  kind: TermsTemplateKind,
): string | null {
  if (kind === "project") {
    const notes = formatProjectPaymentNotes(content);
    return notes || null;
  }
  return null;
}

/** Map CMS services_terms onto a contract template's terms + paymentNotes. */
export function applyServicesTermsToTemplate(
  kind: TermsTemplateKind,
  content: ServicesTermsContent,
): { terms: string[]; paymentNotes: string | null } | null {
  const terms = termsForKind(content, kind);
  if (!terms) return null;
  return {
    terms,
    paymentNotes: paymentNotesForKind(content, kind),
  };
}
