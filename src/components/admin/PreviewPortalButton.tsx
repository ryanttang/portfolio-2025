import { startViewAsClientAction } from "@/app/admin/actions/onboarding";

export default function PreviewPortalButton({
  clientId,
  onboardingId,
  returnPath,
  label = "Preview",
  className = "border border-[#fdf0d5]/50 px-3 py-1.5 text-xs text-[#fdf0d5]",
}: {
  clientId: string;
  onboardingId?: string;
  returnPath?: string;
  label?: string;
  className?: string;
}) {
  async function preview() {
    "use server";
    await startViewAsClientAction(clientId, {
      ...(onboardingId ? { onboardingId } : {}),
      ...(returnPath ? { returnPath } : {}),
    });
  }

  return (
    <form action={preview}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
