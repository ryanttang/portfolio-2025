import type { ProjectAttentionSummary } from "@/lib/portal/types";

export default function AttentionBanner({
  summary,
}: {
  summary: ProjectAttentionSummary;
}) {
  const items: { label: string; href: string }[] = [];

  if (summary.pendingTasks > 0) {
    items.push({
      label: `${summary.pendingTasks} action item${summary.pendingTasks === 1 ? "" : "s"} need${summary.pendingTasks === 1 ? "s" : ""} you`,
      href: "#tasks",
    });
  }
  if (summary.unreadMessages > 0) {
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
    <div className="border border-[#fdf0d5]/30 bg-[#fdf0d5]/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#fdf0d5]">
        Needs your attention
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href} className="text-sm text-white/80 hover:text-white hover:underline">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
