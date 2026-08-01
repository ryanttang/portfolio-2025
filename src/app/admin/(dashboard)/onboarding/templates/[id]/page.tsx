import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate, listTemplateItems } from "@/lib/onboarding";
import TemplateEditor from "@/components/admin/TemplateEditor";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();
  const items = await listTemplateItems(id);

  return (
    <div>
      <Link
        href="/admin/onboarding/templates"
        className="text-xs text-white/40 hover:text-white/70"
      >
        ← Templates
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        {template.name}
      </h1>
      <TemplateEditor template={template} items={items} />
    </div>
  );
}
