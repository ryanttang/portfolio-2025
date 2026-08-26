export type PortalTaskType = "general" | "approval" | "review" | "upload";
export type PortalTaskStatus = "pending" | "completed" | "cancelled";

export type PortalTimelineEventType =
  | "update"
  | "milestone"
  | "task"
  | "meeting"
  | "file"
  | "message";

export type PortalTimelineEvent = {
  id: string;
  type: PortalTimelineEventType;
  title: string;
  body?: string | null;
  at: Date;
  meta?: Record<string, unknown>;
};

export type ProjectAttentionSummary = {
  pendingTasks: number;
  unreadMessages: number;
  upcomingMeetings: number;
  unreadNotifications: number;
};

export const DEFAULT_HUB_WELCOME_MESSAGE =
  "Your project hub is where you'll track progress, complete action items, view updates, message me, download deliverables, and add meetings to your calendar — all in one place.";
