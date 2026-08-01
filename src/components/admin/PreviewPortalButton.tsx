import { startViewAsClientAction } from "@/app/admin/actions/onboarding";

export default function PreviewPortalButton({
  clientId,
  onboardingId,
  label = "Preview",
  className = "border border-[#e6c47a]/50 px-3 py-1.5 text-xs text-[#e6c47a]",
}: {
  clientId: string;
  onboardingId?: string;
  label?: string;
  className?: string;
}) {
  async function preview() {
    "use server";
    await startViewAsClientAction(
      clientId,
      onboardingId ? { onboardingId } : undefined,
    );
  }

  return (
    <form action={preview}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
