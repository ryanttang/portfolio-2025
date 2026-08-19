import { notFound, redirect } from "next/navigation";
import { requirePortalActor } from "@/lib/auth";
import { getClient } from "@/lib/crm/clients";
import {
  getEnabledSteps,
  getOnboardingBundle,
  getOnboardingForClient,
  portalProjectPath,
} from "@/lib/onboarding";
import OnboardingWizard from "@/components/portal/OnboardingWizard";
import type { OnboardingStep } from "@/lib/onboarding/types";
import Link from "next/link";

export default async function ProjectOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    redirect("/portal/login");
  }

  const { slug } = await params;
  const onboarding = await getOnboardingForClient(actor.clientId, slug);
  if (!onboarding) notFound();

  if (slug !== onboarding.slug) {
    redirect(portalProjectPath(onboarding, "onboarding"));
  }

  if (onboarding.status === "completed") {
    redirect(portalProjectPath(onboarding));
  }

  const client = await getClient(actor.clientId);
  if (!client) redirect("/portal/login");

  const bundle = await getOnboardingBundle(onboarding.id);
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
          onboardingId={onboarding.id}
          projectSlug={onboarding.slug}
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
