import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClient } from "@/lib/crm/clients";
import {
  getActiveOnboardingForClient,
  getEnabledSteps,
  getOnboardingBundle,
} from "@/lib/onboarding";
import OnboardingWizard from "@/components/portal/OnboardingWizard";
import type { OnboardingStep } from "@/lib/onboarding/types";

export default async function PortalOnboardingPage() {
  const session = await auth();
  if (!session?.user?.clientId || session.user.role !== "client") {
    redirect("/portal/login");
  }

  const clientId = session.user.clientId;
  const client = await getClient(clientId);
  if (!client) redirect("/portal/login");

  const onboarding = await getActiveOnboardingForClient(clientId);
  if (!onboarding) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Onboarding</h1>
        <p className="mt-3 text-sm text-white/50">
          No onboarding is assigned yet. You&apos;ll be notified when it&apos;s ready.
        </p>
      </div>
    );
  }

  if (onboarding.status === "completed") {
    redirect("/portal");
  }

  const bundle = await getOnboardingBundle(onboarding.id);
  if (!bundle) redirect("/portal");

  const enabledSteps = getEnabledSteps(onboarding);
  let currentStep = onboarding.currentStep as OnboardingStep;
  if (!enabledSteps.includes(currentStep)) {
    currentStep = enabledSteps[0];
  }

  return (
      <OnboardingWizard
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
  );
}
