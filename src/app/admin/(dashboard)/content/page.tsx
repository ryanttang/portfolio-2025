import { getContent } from "@/lib/content";
import ContentManager from "@/components/admin/ContentEditor";
import type { ContentKey } from "@/lib/content/schemas";

const SECTIONS: { key: ContentKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "projects", label: "Projects" },
  { key: "design", label: "Design" },
  { key: "retail", label: "Retail" },
  { key: "services_overview", label: "Services overview" },
  { key: "services_projects", label: "Services projects" },
  { key: "services_retainers", label: "Services retainers" },
];

export default async function ContentPage() {
  const entries = await Promise.all(
    SECTIONS.map(async (s) => ({
      ...s,
      payload: await getContent(s.key),
    })),
  );

  return <ContentManager entries={entries} />;
}
