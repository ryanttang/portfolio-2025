import Link from "next/link";
import { listClients } from "@/lib/crm/clients";
import CrmCreateForm from "@/components/admin/CrmCreateForm";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const [clients, allClients] = await Promise.all([
    listClients({ status: sp.status, q: sp.q, tag: sp.tag }),
    listClients(),
  ]);
  const allTags = Array.from(
    new Set(allClients.flatMap((c) => (Array.isArray(c.tags) ? c.tags : []))),
  ).sort();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">CRM</h1>
          <p className="mt-1 text-sm text-white/50">Clients, leads, and activity.</p>
        </div>
        <form className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Search…"
            className="border border-white/15 bg-black/40 px-3 py-1.5 text-sm outline-none focus:border-[#e6c47a]"
          />
          <select
            name="status"
            defaultValue={sp.status || ""}
            className="border border-white/15 bg-black/40 px-2 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="archived">Archived</option>
          </select>
          <select
            name="tag"
            defaultValue={sp.tag || ""}
            className="border border-white/15 bg-black/40 px-2 py-1.5 text-sm"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <button type="submit" className="border border-white/20 px-3 py-1.5 text-sm">
            Filter
          </button>
        </form>
      </div>

      <CrmCreateForm />

      <div className="mt-6 border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-[#141414] text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Company</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-white/40">
                  No clients yet.
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/admin/crm/${c.id}`} className="text-[#e6c47a] hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white/70">{c.email}</td>
                <td className="px-4 py-3 capitalize text-white/60">{c.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(c.tags || []).map((tag) => (
                      <Link
                        key={tag}
                        href={`/admin/crm?tag=${encodeURIComponent(tag)}`}
                        className="border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/50 hover:border-[#e6c47a]/40 hover:text-[#e6c47a]"
                      >
                        {tag}
                      </Link>
                    ))}
                    {(c.tags || []).length === 0 && (
                      <span className="text-white/30">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/50">{c.company || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
