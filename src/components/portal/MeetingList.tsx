export default function MeetingList({
  meetings,
}: {
  meetings: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    location: string | null;
  }[];
}) {
  const upcoming = meetings.filter((m) => m.startsAt.getTime() >= Date.now());

  if (upcoming.length === 0) {
    return <p className="text-sm text-white/40">No upcoming meetings scheduled.</p>;
  }

  return (
    <ul className="space-y-3">
      {upcoming.map((m) => (
        <li key={m.id} className="border border-white/10 bg-[#141414] p-4">
          <p className="font-medium">{m.title}</p>
          <p className="mt-1 text-sm text-white/60">
            {m.startsAt.toLocaleString()} – {m.endsAt.toLocaleTimeString()}
          </p>
          {m.description && <p className="mt-2 text-sm text-white/55">{m.description}</p>}
          {m.location && (
            <p className="mt-1 text-sm text-white/45">
              {m.location.startsWith("http") ? (
                <a href={m.location} target="_blank" rel="noreferrer" className="text-[#fdf0d5] hover:underline">
                  {m.location}
                </a>
              ) : (
                m.location
              )}
            </p>
          )}
          <a
            href={`/api/portal/meetings/${m.id}/ics`}
            className="mt-3 inline-block text-xs font-semibold uppercase tracking-wider text-[#fdf0d5] hover:underline"
          >
            Add to calendar
          </a>
        </li>
      ))}
    </ul>
  );
}
