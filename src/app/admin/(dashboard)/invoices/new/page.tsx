import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contracts } from "@/db/schema";
import { listClients } from "@/lib/crm/clients";
import InvoiceForm from "@/components/admin/InvoiceForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; contractId?: string }>;
}) {
  const sp = await searchParams;
  const [clients, contractRows] = await Promise.all([
    listClients(),
    db
      .select({
        id: contracts.id,
        clientId: contracts.clientId,
        title: contracts.title,
        amountCents: contracts.amountCents,
        paymentNotes: contracts.paymentNotes,
        status: contracts.status,
      })
      .from(contracts)
      .orderBy(desc(contracts.updatedAt)),
  ]);

  let defaultClientId = sp.clientId;
  if (sp.contractId) {
    const linked = contractRows.find((c) => c.id === sp.contractId);
    if (linked) defaultClientId = linked.clientId;
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">New invoice</h1>
      <p className="mt-1 text-sm text-white/50">
        Optionally link a contract to pull its payment schedule into public notes.
      </p>
      <InvoiceForm
        clients={clients.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        contracts={contractRows}
        defaultClientId={defaultClientId}
        defaultContractId={sp.contractId}
      />
    </div>
  );
}
