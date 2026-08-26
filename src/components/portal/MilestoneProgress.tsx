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

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm text-white/60">
          {done} of {milestones.length} complete
        </p>
        <p className="text-sm font-medium text-[#fdf0d5]">{pct}%</p>
      </div>
      <div className="h-1.5 w-full bg-white/10">
        <div className="h-full bg-[#fdf0d5]/80 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-4 space-y-3">
        {milestones.map((m) => (
          <li key={m.id} className="border-l-2 border-[#fdf0d5]/60 pl-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-medium">{m.title}</p>
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                {m.status.replace("_", " ")}
              </span>
              {m.dueAt && (
                <span className="text-[10px] text-white/30">
                  Due {m.dueAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
