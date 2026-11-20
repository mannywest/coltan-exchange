// Route templates are plain strings so they can cross from server to client components.
// Next app uses real paths; the hosted preview uses hash routes.
export type Routes = {
  lots: string;
  lot: string;
  check: string;
  deal: string;
  review: string;
  sell: string;
  onboarding: string;
  registry: string;
};

export const nextRoutes: Routes = {
  lots: "/",
  lot: "/lots/{slug}",
  check: "/lots/{slug}/check",
  deal: "/lots/{slug}/deal",
  review: "/review",
  sell: "/sell",
  onboarding: "/onboarding",
  registry: "/registry",
};

export const hashRoutes: Routes = {
  lots: "#all-lots",
  lot: "#{slug}",
  check: "#check-{slug}",
  deal: "#deal-{slug}",
  review: "#review",
  sell: "#sell",
  onboarding: "#onboarding",
  registry: "#registry",
};

export function href(template: string, slug: string): string {
  return template.replace("{slug}", slug);
}
