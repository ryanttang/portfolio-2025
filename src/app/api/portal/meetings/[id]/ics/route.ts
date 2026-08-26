import { NextResponse } from "next/server";
import { requirePortalActor } from "@/lib/auth";
import { getPortalMeeting } from "@/lib/portal/meetings";
import { buildMeetingIcs } from "@/lib/portal/ics";
import { getOnboardingForClient } from "@/lib/onboarding";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const meeting = await getPortalMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const onboarding = await getOnboardingForClient(actor.clientId, meeting.onboardingId);
  if (!onboarding) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ics = buildMeetingIcs({
    uid: meeting.icsUid,
    title: meeting.title,
    description: meeting.description,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
    location: meeting.location,
    organizerEmail: process.env.RESEND_FROM_EMAIL || process.env.ADMIN_EMAIL,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="meeting-${meeting.id}.ics"`,
    },
  });
}
