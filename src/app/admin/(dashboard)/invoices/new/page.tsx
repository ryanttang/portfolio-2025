import { listClients } from "@/lib/crm/clients";
import InvoiceForm from "@/components/admin/InvoiceForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const sp = await searchParams;
  const clients = await listClients();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">New invoice</h1>
      <InvoiceForm
        clients={clients.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        defaultClientId={sp.clientId}
      />
    </div>
  );
}
