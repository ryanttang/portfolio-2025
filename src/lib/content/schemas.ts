import { z } from "zod";

export const aboutSchema = z.object({
  headline: z.string(),
  body: z.string(),
});

export const projectsSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
      image: z.string(),
    }),
  ),
});

export const designSchema = z.object({
  covers: z.array(z.string()),
  flyers: z.array(z.string()),
});

export const retailSchema = z.object({
  clients: z.array(z.string()),
  personal: z.array(z.string()),
});

export const servicesOverviewSchema = z.object({
  groups: z.array(
    z.object({
      title: z.string(),
      items: z.array(
        z.object({
          label: z.string(),
          price: z.string(),
        }),
      ),
    }),
  ),
});

export const servicesProjectsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      items: z.array(
        z.object({
          project: z.string(),
          range: z.string(),
        }),
      ),
    }),
  ),
});

export const servicesRetainersSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      price: z.string(),
      positioning: z.string(),
    }),
  ),
});

export const servicesTermsSchema = z.object({
  projectPaymentLines: z.array(z.string()),
  projectPaymentNote: z.string(),
  projectTerms: z.array(z.string()),
  retainerTerms: z.array(z.string()),
});

export const contentSchemas = {
  about: aboutSchema,
  projects: projectsSchema,
  design: designSchema,
  retail: retailSchema,
  services_overview: servicesOverviewSchema,
  services_projects: servicesProjectsSchema,
  services_retainers: servicesRetainersSchema,
  services_terms: servicesTermsSchema,
} as const;

export type ContentKey = keyof typeof contentSchemas;
export type AboutContent = z.infer<typeof aboutSchema>;
export type ProjectsContent = z.infer<typeof projectsSchema>;
export type DesignContent = z.infer<typeof designSchema>;
export type RetailContent = z.infer<typeof retailSchema>;
export type ServicesOverviewContent = z.infer<typeof servicesOverviewSchema>;
export type ServicesProjectsContent = z.infer<typeof servicesProjectsSchema>;
export type ServicesRetainersContent = z.infer<typeof servicesRetainersSchema>;
export type ServicesTermsContent = z.infer<typeof servicesTermsSchema>;

export function isContentKey(key: string): key is ContentKey {
  return key in contentSchemas;
}

export function parseContent(key: string, payload: unknown) {
  if (!isContentKey(key)) {
    throw new Error(`Unknown content key: ${key}`);
  }
  return contentSchemas[key].parse(payload);
}
