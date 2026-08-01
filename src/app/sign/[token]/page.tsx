import { getSessionByToken } from "@/lib/contracts/sign";
import AgreementSigningStep from "@/components/signing/AgreementSigningStep";

export default async function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getSessionByToken(token);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white/70">
        Contract not found.
      </div>
    );
  }

  if (result.error === "void") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white/70">
        This contract has been voided.
      </div>
    );
  }

  if (result.error === "already_signed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-4 text-center">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[#fdf0d5]">
            Already signed
          </p>
          <p className="mt-2 text-sm text-white/60">This agreement has already been completed.</p>
        </div>
      </div>
    );
  }

  if (!result.session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white/70">
        Unable to start signing session.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#f2efe8]">
      <AgreementSigningStep session={result.session} />
    </div>
  );
}
