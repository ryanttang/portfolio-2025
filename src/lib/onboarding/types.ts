export const ONBOARDING_STEPS = [
  "welcome",
  "info",
  "questionnaire",
  "contract",
  "deposit",
  "handoff",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STATUSES = [
  "draft",
  "sent",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "single_select",
  "multi_select",
  "boolean",
  "file",
  "login",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short text",
  long_text: "Long text",
  single_select: "Single select",
  multi_select: "Multi select",
  boolean: "Yes / no",
  file: "File upload",
  login: "Login info",
};

export function questionIsSecret(q: { type: string; sensitive?: boolean | null }) {
  return q.type === "login" || Boolean(q.sensitive);
}

export type LoginCredential = {
  label: string;
  username: string;
  password: string;
};

export type LoginAnswerValue = {
  entries: LoginCredential[];
};

function asCredential(value: unknown): LoginCredential | null {
  if (!value || typeof value !== "object") return null;
  const e = value as { label?: unknown; username?: unknown; password?: unknown };
  return {
    label: String(e.label || "").trim(),
    username: String(e.username || ""),
    password: String(e.password || ""),
  };
}

export function isLoginAnswerValue(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { entries?: unknown; username?: unknown; password?: unknown };
  return Array.isArray(v.entries) || "username" in v || "password" in v;
}

export function normalizeLoginAnswer(value: unknown): LoginCredential[] {
  if (!value || typeof value !== "object") return [];
  const v = value as { entries?: unknown; label?: unknown; username?: unknown; password?: unknown };
  if (Array.isArray(v.entries)) {
    return v.entries.map(asCredential).filter((e): e is LoginCredential => Boolean(e));
  }
  if ("username" in v || "password" in v) {
    const entry = asCredential(v);
    return entry ? [entry] : [];
  }
  return [];
}

export function loginAnswerIsEmpty(value: unknown) {
  return normalizeLoginAnswer(value).every(
    (e) => !e.username.trim() && !e.password && !e.label,
  );
}

export function mergeLoginAnswers(incoming: unknown, previous: unknown): LoginAnswerValue {
  const next = normalizeLoginAnswer(incoming);
  const prev = normalizeLoginAnswer(previous);
  const merged = next.map((entry, i) => ({
    label: entry.label || prev[i]?.label || "",
    username: entry.username.trim() || prev[i]?.username || "",
    password: entry.password || prev[i]?.password || "",
  }));
  const filled = merged.filter((e) => e.username.trim() || e.password || e.label);
  return { entries: filled.length > 0 ? filled : prev };
}

export function emptyLoginCredential(): LoginCredential {
  return { label: "", username: "", password: "" };
}

export const CORE_ANSWER_KEYS = ["goals", "timeline", "budget", "audience"] as const;

export type CoreAnswerKey = (typeof CORE_ANSWER_KEYS)[number];

export const CORE_QUESTION_LABELS: Record<CoreAnswerKey, string> = {
  goals: "Project goals",
  timeline: "Timeline",
  budget: "Budget range",
  audience: "Target audience",
};

/** Optional starter questions — not added unless an admin inserts them. */
export const CORE_STARTER_QUESTIONS: {
  key: CoreAnswerKey;
  label: string;
  type: QuestionType;
  required: boolean;
}[] = [
  { key: "goals", label: CORE_QUESTION_LABELS.goals, type: "long_text", required: false },
  { key: "timeline", label: CORE_QUESTION_LABELS.timeline, type: "short_text", required: false },
  { key: "budget", label: CORE_QUESTION_LABELS.budget, type: "short_text", required: false },
  { key: "audience", label: CORE_QUESTION_LABELS.audience, type: "long_text", required: false },
];

export const MILESTONE_STATUSES = ["upcoming", "in_progress", "done"] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export type QuestionInput = {
  label: string;
  helpText?: string | null;
  type: QuestionType;
  options?: string[];
  required?: boolean;
  key?: CoreAnswerKey | null;
  sensitive?: boolean;
};
