"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addClientNoteAction, updateClientAction } from "@/app/admin/actions/content";

type Client = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  tags: string[];
};

export default function ClientDetail({
  client,
  notes,
  activities,
}: {
  client: Client;
  notes: { id: string; body: string; createdAt: Date }[];
  activities: { id: string; type: string; summary: string; createdAt: Date }[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [tags, setTags] = useState((client.tags || []).join(", "));

  async function save(formData: FormData) {
    formData.set("tags", tags);
    await updateClientAction(client.id, formData);
    router.refresh();
  }

  async function addNote() {
    if (!note.trim()) return;
    await addClientNoteAction(client.id, note.trim());
    setNote("");
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <form action={save} className="space-y-3 border border-white/10 bg-[#141414] p-4">
        <h2 className="text-sm font-semibold">Details</h2>
        <Field name="name" label="Name" defaultValue={client.name} />
        <Field name="email" label="Email" defaultValue={client.email} />
        <Field name="company" label="Company" defaultValue={client.company || ""} />
        <Field name="phone" label="Phone" defaultValue={client.phone || ""} />
        <Field name="address" label="Address" defaultValue={client.address || ""} />
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Status
          <select
            name="status"
            defaultValue={client.status}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="comma, separated, tags"
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#fdf0d5]"
          />
        </label>
        {(client.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Notes
          <textarea
            name="notes"
            defaultValue={client.notes || ""}
            rows={3}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black">
          Save
        </button>
      </form>

      <div className="space-y-6">
        <div className="border border-white/10 bg-[#141414] p-4">
          <h2 className="text-sm font-semibold">Add note</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-2 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addNote}
            className="mt-2 border border-white/20 px-3 py-1.5 text-xs"
          >
            Add note
          </button>
          <ul className="mt-4 space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="border-t border-white/5 pt-2 text-sm text-white/70">
                <p>{n.body}</p>
                <p className="mt-1 text-[10px] text-white/30">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-white/10 bg-[#141414] p-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <ul className="mt-3 space-y-2">
            {activities.length === 0 && (
              <li className="text-sm text-white/40">No activity yet.</li>
            )}
            {activities.map((a) => (
              <li key={a.id} className="text-sm">
                <span className="text-[10px] uppercase tracking-wider text-[#fdf0d5]/80">
                  {a.type}
                </span>
                <p className="text-white/70">{a.summary}</p>
                <p className="text-[10px] text-white/30">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-wider text-white/40">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none focus:border-[#fdf0d5]"
      />
    </label>
  );
}
