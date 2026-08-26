import type { ProjectAttentionSummary } from "@/lib/portal/types";

export default function AttentionBanner({
  summary,
  messagesEnabled = false,
}: {
  summary: ProjectAttentionSummary;
  messagesEnabled?: boolean;
}) {
  const items: { label: string; href: string }[] = [];

  if (summary.pendingTasks > 0) {
    items.push({
      label: `${summary.pendingTasks} action item${summary.pendingTasks === 1 ? "" : "s"} need${summary.pendingTasks === 1 ? "s" : ""} you`,
      href: "#tasks",
    });
  }
  if (messagesEnabled && summary.unreadMessages > 0) {
    items.push({
      label: `${summary.unreadMessages} unread message${summary.unreadMessages === 1 ? "" : "s"}`,
      href: "#messages",
    });
  }
  if (summary.upcomingMeetings > 0) {
    items.push({
      label: `${summary.upcomingMeetings} upcoming meeting${summary.upcomingMeetings === 1 ? "" : "s"}`,
      href: "#meetings",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-sm border border-[#fdf0d5]/30 bg-[#fdf0d5]/8 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#fdf0d5]">
        Needs your attention
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="inline-block rounded-sm border border-[#fdf0d5]/20 bg-[#fdf0d5]/10 px-3 py-1.5 text-sm text-white/85 transition hover:border-[#fdf0d5]/40 hover:text-white"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
