// Route templates are plain strings so they can cross from server to client components.
// Next app uses real paths; the hosted preview uses hash routes.
export type Routes = { lots: string; lot: string; check: string; review: string };

export const nextRoutes: Routes = {
  lots: "/",
  lot: "/lots/{slug}",
  check: "/lots/{slug}/check",
  review: "/review",
};

export const hashRoutes: Routes = {
  lots: "#all-lots",
  lot: "#{slug}",
  check: "#check-{slug}",
  review: "#review",
};

export function href(template: string, slug: string): string {
  return template.replace("{slug}", slug);
}
