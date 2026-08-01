"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { ESIGN_CONSENT_DISCLOSURE } from "@/lib/contracts/esign-consent";

type Session = {
  external_id: string;
  title: string;
  body_text: string;
  esign_consent_version?: string;
  signer_name?: string;
  signer_email?: string;
};

export default function AgreementSigningStep({ session }: { session: Session }) {
  const sigPadRef = useRef<SignatureCanvas | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [signatureTab, setSignatureTab] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit =
    consentChecked &&
    status !== "submitting" &&
    (signatureTab === "draw" ? hasDrawn : typedSignature.trim().length >= 2);

  async function handleSign() {
    if (!canSubmit) return;
    setStatus("submitting");
    setErrorMsg("");

    const payload: Record<string, unknown> = {
      external_id: session.external_id,
      consent: true,
      signature_method: signatureTab,
    };

    if (signatureTab === "draw") {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        setErrorMsg("Please draw your signature.");
        setStatus("error");
        return;
      }
      payload.signature_png_base64 = sigPadRef.current.getCanvas().toDataURL("image/png");
    } else {
      payload.typed_signature = typedSignature.trim();
    }

    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.status !== "completed") {
        throw new Error(data.message || "Signing failed");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Signing failed");
    }
  }

  if (status === "done") {
    return (
      <div className="py-16 text-center">
        <p className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[#fdf0d5]">
          Agreement signed
        </p>
        <p className="mt-2 text-sm text-white/60">
          Thank you. Your signed copy has been recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[#fdf0d5]">Ryan Tang</p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
          {session.title}
        </h1>
        {(session.signer_name || session.signer_email) && (
          <p className="mt-1 text-sm text-white/50">
            {session.signer_name}
            {session.signer_email ? ` · ${session.signer_email}` : ""}
          </p>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto border border-white/15 bg-white/5 p-4 text-sm whitespace-pre-wrap text-white/85">
        {session.body_text}
      </div>

      <div className="space-y-3 border border-white/15 bg-white/5 p-4">
        <p className="text-xs whitespace-pre-wrap text-white/70">{ESIGN_CONSENT_DISCLOSURE}</p>
        {session.esign_consent_version && (
          <p className="text-[10px] text-white/40">
            Disclosure version: {session.esign_consent_version}
          </p>
        )}
        <label className="flex items-start gap-2 text-sm text-white/90">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1"
          />
          I agree to sign this agreement electronically.
        </label>
      </div>

      <div className="border border-white/15 bg-white/5 p-4">
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setSignatureTab("draw")}
            className={`px-3 py-1 ${signatureTab === "draw" ? "bg-white/15 text-[#fdf0d5]" : "text-white/50"}`}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => setSignatureTab("type")}
            className={`px-3 py-1 ${signatureTab === "type" ? "bg-white/15 text-[#fdf0d5]" : "text-white/50"}`}
          >
            Type
          </button>
        </div>

        {signatureTab === "draw" ? (
          <div className="mt-3">
            <div className="border border-white/20 bg-white">
              <SignatureCanvas
                ref={sigPadRef}
                penColor="#111"
                canvasProps={{ className: "w-full h-40" }}
                onEnd={() => setHasDrawn(Boolean(sigPadRef.current && !sigPadRef.current.isEmpty()))}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                sigPadRef.current?.clear();
                setHasDrawn(false);
              }}
              className="mt-2 text-xs text-white/50"
            >
              Clear
            </button>
          </div>
        ) : (
          <input
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            placeholder="Type your full name"
            className="mt-3 w-full border border-white/15 bg-black/40 px-3 py-2 text-lg italic outline-none"
          />
        )}
      </div>

      {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSign}
        className="w-full bg-[#fdf0d5] px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
      >
        {status === "submitting" ? "Signing…" : "Sign agreement"}
      </button>
    </div>
  );
}
