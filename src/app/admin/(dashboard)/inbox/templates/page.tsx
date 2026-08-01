import Link from "next/link";
import { listEmailTemplates } from "@/lib/email/templates";
import TemplatesAdmin from "@/components/admin/email/TemplatesAdmin";

export default async function InboxTemplatesPage() {
  const templates = await listEmailTemplates();

  return (
    <div>
      <Link href="/admin/inbox" className="text-xs text-white/40 hover:text-white/70">
        ← Inbox
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        Email templates
      </h1>
      <p className="mt-1 text-sm text-white/50">
        Presets ship ready to use. Duplicate a preset or create a custom template with merge
        fields like {"{{first_name}}"}. Edit the shared header and signature in{" "}
        <Link href="/admin/settings" className="text-[#e6c47a] hover:underline">
          Settings
        </Link>
        .
      </p>
      <TemplatesAdmin templates={templates} />
    </div>
  );
}
