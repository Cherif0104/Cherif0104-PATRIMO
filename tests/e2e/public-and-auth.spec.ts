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
