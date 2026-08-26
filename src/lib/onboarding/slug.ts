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

export function portalProjectPath(
  onboarding: { slug: string },
  page?: "onboarding",
) {
  const base = `/portal/projects/${onboarding.slug}`;
  return page === "onboarding" ? `${base}/onboarding` : base;
}
