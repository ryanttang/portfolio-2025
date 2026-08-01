import { getContent } from "@/lib/content";
import { getDefaultContent } from "@/lib/content/defaults";
import { helloSchema } from "@/lib/content/schemas";
import HelloEditor from "@/components/admin/HelloEditor";

export default async function AdminHelloPage() {
  const raw = await getContent("hello");
  const parsed = helloSchema.safeParse(raw);
  const content = parsed.success
    ? parsed.data
    : helloSchema.parse(getDefaultContent("hello"));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Hello</h1>
        <p className="mt-1 text-sm text-white/45">
          Edit the business-card QR landing page at /hello.
        </p>
      </div>
      <HelloEditor initial={content} />
    </div>
  );
}
