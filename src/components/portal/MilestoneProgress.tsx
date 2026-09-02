const STATUS_STYLES: Record<
  string,
  { border: string; badge: string; label: string }
> = {
  upcoming: {
    border: "border-white/20",
    badge: "text-white/45",
    label: "Upcoming",
  },
  in_progress: {
    border: "border-[#fdf0d5]/70",
    badge: "text-[#fdf0d5]",
    label: "In progress",
  },
  done: {
    border: "border-emerald-400/60",
    badge: "text-emerald-400/90",
    label: "Done",
  },
};

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? STATUS_STYLES.upcoming;
}

export default function MilestoneProgress({
  milestones,
}: {
  milestones: {
    id: string;
    title: string;
    status: string;
    dueAt: Date | null;
  }[];
}) {
  if (milestones.length === 0) {
    return (
      <p className="text-sm text-white/40">Milestones will appear here as the project moves.</p>
    );
  }

  const done = milestones.filter((m) => m.status === "done").length;
  const pct = Math.round((done / milestones.length) * 100);
  const complete = pct === 100;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm text-white/60">
          {done} of {milestones.length} complete
        </p>
        <p className={`text-sm font-medium ${complete ? "text-emerald-400" : "text-[#fdf0d5]"}`}>
          {pct}%
        </p>
      </div>
      <div className="h-1.5 w-full bg-white/10">
        <div
          className={`h-full transition-all ${complete ? "bg-emerald-400/80" : "bg-[#fdf0d5]/80"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-3">
        {milestones.map((m) => {
          const style = statusStyle(m.status);
          const isActive = m.status === "in_progress";
          const isDone = m.status === "done";

          return (
            <li key={m.id} className={`border-l-2 pl-4 ${style.border}`}>
              <div className="flex flex-wrap items-baseline gap-2">
                <p
                  className={`font-medium ${
                    isDone ? "text-white/55" : isActive ? "text-white" : "text-white/80"
                  }`}
                >
                  {m.title}
                </p>
                <span className={`text-[10px] uppercase tracking-wider ${style.badge}`}>
                  {style.label}
                </span>
                {m.dueAt && (
                  <span className="text-[10px] text-white/30">
                    Due {m.dueAt.toLocaleDateString()}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
