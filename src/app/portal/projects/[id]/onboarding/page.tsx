import { notFound, redirect } from "next/navigation";
import { requirePortalActor } from "@/lib/auth";
import { getClient } from "@/lib/crm/clients";
import {
  getEnabledSteps,
  getOnboardingBundle,
  getOnboardingForClient,
} from "@/lib/onboarding";
import OnboardingWizard from "@/components/portal/OnboardingWizard";
import type { OnboardingStep } from "@/lib/onboarding/types";
import Link from "next/link";

export default async function ProjectOnboardingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    redirect("/portal/login");
  }

  const { id } = await params;
  const onboarding = await getOnboardingForClient(actor.clientId, id);
  if (!onboarding) notFound();

  if (onboarding.status === "completed") {
    redirect(`/portal/projects/${id}`);
  }

  const client = await getClient(actor.clientId);
  if (!client) redirect("/portal/login");

  const bundle = await getOnboardingBundle(id);
  if (!bundle) notFound();

  const enabledSteps = getEnabledSteps(onboarding);
  let currentStep = onboarding.currentStep as OnboardingStep;
  if (!enabledSteps.includes(currentStep)) {
    currentStep = enabledSteps[0];
  }

  return (
    <div>
      <Link href="/portal" className="text-xs text-white/40 hover:text-white/70">
        ← Projects
      </Link>
      <div className="mt-4">
        <OnboardingWizard
          onboardingId={id}
          onboarding={{
            ...bundle.onboarding,
            currentStep,
            services: bundle.onboarding.services || [],
          }}
          client={client}
          questions={bundle.questions}
          answers={bundle.answers}
          enabledSteps={enabledSteps}
          contract={
            bundle.contract
              ? {
                  title: bundle.contract.title,
                  status: bundle.contract.status,
                  token: bundle.contract.token,
                }
              : null
          }
          invoice={
            bundle.invoice
              ? {
                  invoiceNumber: bundle.invoice.invoiceNumber,
                  status: bundle.invoice.status,
                  payToken: bundle.invoice.payToken,
                  totalCents: bundle.invoice.totalCents,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
