import { expect, test } from "@playwright/test";

test("le catalogue public est servi avec les éléments SEO", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Se Loger au Sénégal/);
  await expect(page.locator("body")).toContainText("Se Loger");

  const robots = await page.request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("sitemap");

  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("<urlset");
});

test("les parcours privés redirigent les visiteurs vers la connexion", async ({ page }) => {
  for (const route of ["/compte", "/voyages", "/messages", "/publier", "/gestion", "/admin"]) {
    await page.goto(route);
    await expect(page).toHaveURL((url) => url.pathname === "/connexion" && url.searchParams.get("retour") === route);
  }
  await expect(page.getByRole("heading", { name: "Bienvenue" })).toBeVisible();
});

test("les catalogues serveur gèrent proprement l’état vide", async ({ page }) => {
  await page.goto("/experiences");
  await expect(page.locator("body")).toContainText(/Expériences|expériences/);
  await page.goto("/services");
  await expect(page.locator("body")).toContainText(/Services|services/);
});

test("la recherche accepte une destination saisie et expose les filtres", async ({ page }) => {
  await page.goto("/");
  const search = page.locator('input[placeholder*="Appartement à Dakar"]:visible');
  await expect(search).toBeVisible();
  await search.fill("appartement à Dakar");
  await page.getByRole("button", { name: "Filtres avancés" }).or(page.getByRole("button", { name: "Afficher les filtres" })).click();
  await expect(page.getByText("Budget minimum").or(page.getByPlaceholder("Budget min.")).first()).toBeVisible();
  await page.getByRole("button", { name: "Rechercher" }).first().click();
  await expect(page).toHaveURL(/\/explorer\?/);
  expect(new URL(page.url()).searchParams.get("q")).toBe("appartement à Dakar");
});

test("le manifeste expose les icônes de la nouvelle marque", async ({ page }) => {
  const response = await page.request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.theme_color).toBe("#FF4845");
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ src: "/icon-512.png" })]));
});
