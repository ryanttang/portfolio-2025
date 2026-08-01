import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contractSignatures, contracts } from "@/db/schema";
import { getClient } from "@/lib/crm/clients";
import { getAppUrl } from "@/lib/env";
import ContractActions from "@/components/admin/ContractActions";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!contract) notFound();
  const client = await getClient(contract.clientId);
  const [sig] = await db
    .select()
    .from(contractSignatures)
    .where(eq(contractSignatures.contractId, id))
    .limit(1);

  const signUrl = `${getAppUrl()}/sign/${contract.token}`;

  return (
    <div>
      <Link href="/admin/contracts" className="text-xs text-white/40 hover:text-white/70">
        ← Contracts
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        {contract.title}
      </h1>
      <p className="mt-1 text-sm text-white/50">
        {client?.name} · <span className="capitalize">{contract.status}</span>
      </p>

      <ContractActions
        id={contract.id}
        status={contract.status}
        signUrl={signUrl}
        signedPdfUrl={sig?.signedPdfUrl || null}
      />

      <pre className="mt-6 max-h-[480px] overflow-y-auto whitespace-pre-wrap border border-white/10 bg-[#141414] p-4 text-sm text-white/80">
        {contract.bodyText}
      </pre>
    </div>
  );
}
