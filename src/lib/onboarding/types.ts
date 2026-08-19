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
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

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
