const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export function slugifyName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function onboardingSlugBase(projectName: string) {
  return slugifyName(projectName) || "project";
}

/** Pre-migration slug format: `{project-name}-{client-name}`. */
export function legacyOnboardingSlug(projectName: string, clientName: string) {
  return slugifyName(`${projectName || "project"}-${clientName || "client"}`) || "project";
}

export function matchesLegacyOnboardingSlug(
  slug: string,
  projectName: string,
  clientName: string,
) {
  const base = legacyOnboardingSlug(projectName, clientName);
  if (slug === base) return true;
  if (!slug.startsWith(`${base}-`)) return false;
  return /^\d+$/.test(slug.slice(base.length + 1));
}

export function portalProjectPath(
  onboarding: { slug: string },
  page?: "onboarding",
) {
  const base = `/portal/projects/${onboarding.slug}`;
  return page === "onboarding" ? `${base}/onboarding` : base;
}
