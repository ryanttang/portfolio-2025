"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteClientAction } from "@/app/admin/actions/content";

export default function ClientRowActions({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/crm/${clientId}`}
          className="text-xs text-[#e6c47a] hover:underline"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Delete “${clientName}”? This cannot be undone.`)) return;
            setError(null);
            startTransition(async () => {
              const res = await deleteClientAction(clientId);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              router.refresh();
            });
          }}
          className="text-xs text-red-300 disabled:opacity-50"
        >
          {pending ? "…" : "Delete"}
        </button>
      </div>
      {error && <p className="max-w-[14rem] text-right text-[11px] text-red-300/90">{error}</p>}
    </div>
  );
}
