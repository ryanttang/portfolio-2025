import { redirect } from "next/navigation";
import { requirePortalActor } from "@/lib/auth";
import { getActiveOnboardingForClient, portalProjectPath } from "@/lib/onboarding";

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
    redirect(portalProjectPath(active, "onboarding"));
  }
  if (active?.status === "completed") {
    redirect(portalProjectPath(active));
  }
  redirect("/portal");
}
