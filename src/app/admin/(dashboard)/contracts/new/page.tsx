import Link from "next/link";
import { listClients } from "@/lib/crm/clients";
import { listContractTemplates } from "@/lib/contracts/templates";
import { getSetting } from "@/lib/content";
import ContractForm from "@/components/admin/ContractForm";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const sp = await searchParams;
  const [clients, templates, invoice] = await Promise.all([
    listClients(),
    listContractTemplates(),
    getSetting("invoice") as Promise<{
      sellerLegalName?: string;
      sellerAddress?: string;
    }>,
  ]);

  return (
    <div>
      <Link href="/admin/contracts" className="text-xs text-white/40 hover:text-white/70">
        ← Contracts
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">New contract</h1>
          <p className="mt-1 text-sm text-white/50">
            Choose a template, pick a client, then edit terms for this agreement.
          </p>
        </div>
        <Link
          href="/admin/contracts/templates"
          className="text-xs text-[#e6c47a] hover:underline"
        >
          Edit templates
        </Link>
      </div>
      <ContractForm
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company,
          address: c.address,
          phone: c.phone,
        }))}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          kind: t.kind,
          titleTemplate: t.titleTemplate,
          bodyTemplate: t.bodyTemplate,
          terms: Array.isArray(t.terms) ? t.terms : [],
          paymentNotes: t.paymentNotes,
        }))}
        seller={{
          sellerLegalName: invoice?.sellerLegalName || null,
          sellerAddress: invoice?.sellerAddress || null,
        }}
        defaultClientId={sp.clientId}
      />
    </div>
  );
}
