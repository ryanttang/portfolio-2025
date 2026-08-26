"use client";

import { useEffect, useState } from "react";
import { getContractSigningSessionAction } from "@/app/portal/actions/onboarding";
import AgreementSigningStep from "@/components/signing/AgreementSigningStep";

type SigningSession = {
  external_id: string;
  title: string;
  body_text: string;
  esign_consent_version?: string;
  signer_name?: string;
  signer_email?: string;
};

export default function ContractSignModal({
  token,
  open,
  onClose,
  onSigned,
}: {
  token: string;
  open: boolean;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [session, setSession] = useState<SigningSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSession(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSession(null);

    getContractSigningSessionAction(token).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.error) {
        if (result.error === "already_signed") {
          onSigned();
        }
        setError(result.message);
        return;
      }
      if (result.session) {
        setSession(result.session);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, token]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#fdf0d5]/30 bg-[#141414] p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm text-white/40 hover:text-white/70"
          aria-label="Close"
        >
          Close
        </button>

        {loading && <p className="py-12 text-center text-sm text-white/50">Loading agreement…</p>}

        {error && (
          <div className="py-8 text-center">
            <p className="text-sm text-white/70">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 text-sm text-[#fdf0d5] hover:underline"
            >
              Close
            </button>
          </div>
        )}

        {session && (
          <AgreementSigningStep
            session={session}
            embedded
            onComplete={() => {
              onSigned();
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}
