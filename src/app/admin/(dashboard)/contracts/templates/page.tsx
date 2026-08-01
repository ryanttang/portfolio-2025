import Link from "next/link";
import ContractTemplatesAdmin from "@/components/admin/ContractTemplatesAdmin";
import { listContractTemplates } from "@/lib/contracts/templates";

export default async function ContractTemplatesPage() {
  const templates = await listContractTemplates();

  return (
    <div>
      <Link href="/admin/contracts" className="text-xs text-white/40 hover:text-white/70">
        ← Contracts
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Contract templates
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Standard agreements for projects, retainers, and consulting. New contracts fill these
            with CRM client details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/contracts/terms"
            className="border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:text-[#fdf0d5]"
          >
            Terms
          </Link>
          <Link
            href="/admin/contracts/new"
            className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
          >
            New contract
          </Link>
        </div>
      </div>
      <ContractTemplatesAdmin
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          kind: t.kind,
          titleTemplate: t.titleTemplate,
          bodyTemplate: t.bodyTemplate,
          terms: Array.isArray(t.terms) ? t.terms : [],
          paymentNotes: t.paymentNotes,
        }))}
      />
    </div>
  );
}
