import { previewPortalAction } from "@/app/admin/actions/onboarding";

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
  return (
    <form action={previewPortalAction}>
      <input type="hidden" name="clientId" value={clientId} />
      {onboardingId ? <input type="hidden" name="onboardingId" value={onboardingId} /> : null}
      {returnPath ? <input type="hidden" name="returnPath" value={returnPath} /> : null}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
