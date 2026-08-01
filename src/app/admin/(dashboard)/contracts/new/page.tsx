import { listClients } from "@/lib/crm/clients";
import ContractForm from "@/components/admin/ContractForm";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const sp = await searchParams;
  const clients = await listClients();

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">New contract</h1>
      <ContractForm
        clients={clients.map((c) => ({ id: c.id, name: c.name, email: c.email }))}
        defaultClientId={sp.clientId}
      />
    </div>
  );
}
