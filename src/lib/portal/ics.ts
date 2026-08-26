function formatIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildMeetingIcs(opts: {
  uid: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  location?: string | null;
  organizerEmail?: string;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ryan Tang//Client Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(opts.startsAt)}`,
    `DTEND:${formatIcsDate(opts.endsAt)}`,
    `SUMMARY:${escapeIcsText(opts.title)}`,
  ];

  if (opts.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(opts.description)}`);
  }
  if (opts.location) {
    lines.push(`LOCATION:${escapeIcsText(opts.location)}`);
  }
  if (opts.organizerEmail) {
    lines.push(`ORGANIZER;CN=Ryan Tang:mailto:${opts.organizerEmail}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
