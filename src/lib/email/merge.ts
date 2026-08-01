export type MergeContext = {
  name?: string | null;
  company?: string | null;
  email?: string | null;
  first_name?: string | null;
};

const TOKEN_RE = /\{\{\s*(name|company|email|first_name)\s*\}\}/gi;

export function firstNameFrom(fullName?: string | null): string {
  if (!fullName?.trim()) return "";
  return fullName.trim().split(/\s+/)[0] || "";
}

export function buildMergeContext(client?: {
  name?: string | null;
  company?: string | null;
  email?: string | null;
} | null): MergeContext {
  return {
    name: client?.name || "",
    company: client?.company || "",
    email: client?.email || "",
    first_name: firstNameFrom(client?.name),
  };
}

export function applyMergeFields(input: string, ctx: MergeContext): string {
  return input.replace(TOKEN_RE, (_match, key: string) => {
    const k = key.toLowerCase() as keyof MergeContext;
    return ctx[k] ?? "";
  });
}

export const MERGE_FIELD_OPTIONS = [
  { token: "{{name}}", label: "Name" },
  { token: "{{first_name}}", label: "First name" },
  { token: "{{company}}", label: "Company" },
  { token: "{{email}}", label: "Email" },
] as const;
