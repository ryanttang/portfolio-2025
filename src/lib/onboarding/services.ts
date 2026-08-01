import { getContent } from "@/lib/content";

export type ServiceOption = {
  id: string;
  label: string;
  group: string;
  price?: string;
};

function slug(parts: string[]) {
  return parts
    .join(":")
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, "-")
    .replace(/-+/g, "-");
}

/** Flatten CMS services content into selectable options for onboarding. */
export async function listAvailableServices(): Promise<ServiceOption[]> {
  const options: ServiceOption[] = [];

  const overview = await getContent<{
    groups?: { title?: string; items?: { label?: string; price?: string }[] }[];
  }>("services_overview");

  for (const group of overview?.groups || []) {
    const groupTitle = group.title || "Services";
    for (const item of group.items || []) {
      if (!item.label) continue;
      options.push({
        id: slug(["overview", groupTitle, item.label]),
        label: item.label,
        group: groupTitle,
        price: item.price,
      });
    }
  }

  const projects = await getContent<{
    sections?: {
      id?: string;
      label?: string;
      items?: { project?: string; range?: string }[];
    }[];
  }>("services_projects");

  for (const section of projects?.sections || []) {
    const groupTitle = section.label || section.id || "Projects";
    for (const item of section.items || []) {
      if (!item.project) continue;
      options.push({
        id: slug(["project", section.id || groupTitle, item.project]),
        label: item.project,
        group: groupTitle,
        price: item.range,
      });
    }
  }

  const retainers = await getContent<{
    items?: { name?: string; price?: string; positioning?: string }[];
  }>("services_retainers");

  for (const item of retainers?.items || []) {
    if (!item.name) continue;
    options.push({
      id: slug(["retainer", item.name]),
      label: item.name,
      group: "Retainers",
      price: item.price,
    });
  }

  // De-dupe by id while preserving order
  const seen = new Set<string>();
  return options.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
}

export function groupServices(options: ServiceOption[]) {
  const map = new Map<string, ServiceOption[]>();
  for (const opt of options) {
    const list = map.get(opt.group) || [];
    list.push(opt);
    map.set(opt.group, list);
  }
  return Array.from(map.entries()).map(([group, items]) => ({ group, items }));
}
