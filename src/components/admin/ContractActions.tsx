"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendContractAction, voidContractAction } from "@/app/admin/actions/contracts";

export default function ContractActions({
  id,
  status,
  signUrl,
  signedPdfUrl,
}: {
  id: string;
  status: string;
  signUrl: string;
  signedPdfUrl: string | null;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function send() {
    setMsg("Sending…");
    const result = await sendContractAction(id);
    setMsg(result.error || "Invite sent.");
    router.refresh();
  }

  async function voidC() {
    if (!confirm("Void this contract?")) return;
    await voidContractAction(id);
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {status !== "signed" && status !== "void" && (
        <button
          type="button"
          onClick={send}
          className="bg-[#e6c47a] px-3 py-1.5 text-xs font-semibold text-black"
        >
          Send for signature
        </button>
      )}
      {status !== "void" && status !== "signed" && (
        <button type="button" onClick={voidC} className="border border-white/20 px-3 py-1.5 text-xs">
          Void
        </button>
      )}
      <a
        href={signUrl}
        target="_blank"
        rel="noreferrer"
        className="border border-white/20 px-3 py-1.5 text-xs"
      >
        Open sign link
      </a>
      {signedPdfUrl && (
        <a
          href={signedPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="border border-white/20 px-3 py-1.5 text-xs text-[#e6c47a]"
        >
          Download signed PDF
        </a>
      )}
      {msg && <span className="text-xs text-white/50">{msg}</span>}
    </div>
  );
}
