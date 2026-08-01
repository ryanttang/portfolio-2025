"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClientAction } from "@/app/admin/actions/content";

export default function CrmCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    setError("");
    try {
      const result = await createClientAction(formData);
      if (result.id) {
        setOpen(false);
        router.push(`/admin/crm/${result.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black"
        >
          New client
        </button>
      ) : (
        <form action={onSubmit} className="border border-white/10 bg-[#141414] p-4 space-y-3 max-w-lg">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="name" label="Name" required />
            <Field name="email" label="Email" type="email" required />
            <Field name="company" label="Company" />
            <Field name="phone" label="Phone" />
          </div>
          <label className="block text-xs uppercase tracking-wider text-white/40">
            Status
            <select name="status" defaultValue="lead" className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm">
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="past">Past</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-wider text-white/40">
            Notes
            <textarea name="notes" rows={2} className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm" />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black">
              Create
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-white/50">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs uppercase tracking-wider text-white/40">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#e6c47a]"
      />
    </label>
  );
}
