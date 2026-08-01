import { redirect } from "next/navigation";
import { requirePortalActor } from "@/lib/auth";
import { getActiveOnboardingForClient } from "@/lib/onboarding";

/** Legacy route — send clients to the right project onboarding or list. */
export default async function LegacyOnboardingRedirect() {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    redirect("/portal/login");
  }
  const active = await getActiveOnboardingForClient(actor.clientId);
  if (active && active.status !== "completed") {
    redirect(`/portal/projects/${active.id}/onboarding`);
  }
  if (active?.status === "completed") {
    redirect(`/portal/projects/${active.id}`);
  }
  redirect("/portal");
}
