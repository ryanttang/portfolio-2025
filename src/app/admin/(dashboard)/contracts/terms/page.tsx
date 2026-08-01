import Link from "next/link";
import { getContent } from "@/lib/content";
import { servicesTermsSchema, type ServicesTermsContent } from "@/lib/content/schemas";
import ServicesTermsEditor from "@/components/admin/ServicesTermsEditor";

export default async function ContractTermsPage() {
  const raw = await getContent("services_terms");
  const terms = servicesTermsSchema.parse(
    raw ?? {
      projectPaymentLines: [],
      projectPaymentNote: "",
      projectTerms: [],
      retainerTerms: [],
    },
  ) as ServicesTermsContent;

  return (
    <div>
      <Link href="/admin/contracts" className="text-xs text-white/40 hover:text-white/70">
        ← Contracts
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Terms</h1>
          <p className="mt-1 text-sm text-white/50">
            Shared payment schedule and term bullets for the public Services page and contract
            templates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/contracts/templates"
            className="border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:text-[#fdf0d5]"
          >
            Templates
          </Link>
          <Link
            href="/admin/contracts/new"
            className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
          >
            New contract
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <ServicesTermsEditor initial={terms} showHubLinks={false} />
      </div>
    </div>
  );
}
