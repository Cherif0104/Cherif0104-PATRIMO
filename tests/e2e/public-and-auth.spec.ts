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
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain("<urlset");
  expect(sitemapXml).toContain("/services");
  expect(sitemapXml).toContain("/telecharger");
});

test("les parcours privés redirigent les visiteurs vers la connexion", async ({ page }) => {
  for (const route of ["/compte", "/favoris", "/voyages", "/messages", "/publier", "/portefeuille", "/gestion", "/gestion/contrats", "/gestion/crm", "/admin"]) {
    await page.goto(route);
    await expect(page).toHaveURL((url) => url.pathname === "/connexion" && url.searchParams.get("retour") === route);
  }
  await expect(page.getByRole("heading", { name: "Bienvenue" })).toBeVisible();
});

test("l’inscription sépare recherche de logement et propriétaire", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByRole("button", { name: "inscription" }).click();
  await expect(page.getByText("Trouver un logement", { exact: true })).toBeVisible();
  await expect(page.getByText("Publier mon bien", { exact: true })).toBeVisible();
  await expect(page.getByText("Proposer un service", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/un seul bien actif/)).toBeVisible();
  await expect(page.getByText(/agence ERP\/CRM/i)).toHaveCount(0);
});

test("les anciens catalogues hors périmètre reviennent à l’accueil", async ({ page }) => {
  for (const route of ["/partenaires", "/boutiques", "/experiences"]) {
    await page.goto(route);
    await expect(page).toHaveURL((url) => url.pathname === "/");
  }
});

test("la navigation publique masque les données privées", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('nav[aria-label="Navigation principale"] a[href="/favoris"]')).toHaveCount(0);
  await expect(page.locator('nav[aria-label="Navigation principale"] a[href="/messages"]')).toHaveCount(0);
  await expect(page.locator('nav[aria-label="Navigation principale"] a[href="/services"]')).toHaveCount(1);
  await expect(page.locator('nav[aria-label="Navigation principale"] a[href="/publier"]')).toHaveCount(1);
  await expect(page.locator('nav[aria-label="Navigation principale"] a[href="/telecharger"]')).toHaveCount(0);
});

test("le centre de téléchargement explique chaque plateforme", async ({ page }) => {
  await page.goto("/telecharger");
  await expect(page.getByRole("heading", { name: /Votre immobilier sénégalais/ })).toBeVisible();
  for (const platform of ["Android", "iPhone & iPad", "Windows", "macOS & Linux"]) {
    await expect(page.getByRole("heading", { name: platform })).toBeVisible();
  }
});

test("l’annuaire immobilier propose recherche, filtres et WhatsApp", async ({ page }) => {
  await page.goto("/services");
  await expect(page.getByRole("heading", { name: /Trouvez le bon professionnel/ })).toBeVisible();
  await expect(page.getByPlaceholder("Plombier, géomètre, nettoyage…")).toBeVisible();
  await expect(page.getByPlaceholder("Ville ou quartier")).toHaveCount(0);
  await page.getByRole("button", { name: "Afficher les filtres" }).click();
  await expect(page.getByPlaceholder("Ville ou quartier")).toBeVisible();
  await page.getByRole("link", { name: /Sunu Plan Topographie/ }).first().click();
  await expect(page).toHaveURL(/\/services\/topographie-sunu-plan/);
  await expect(page.getByRole("link", { name: /Contacter sur WhatsApp/ })).toHaveAttribute("href", /wa\.me\/221788324069/);
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

test("la navigation desktop n’active qu’un seul marché", async ({ page }) => {
  await page.goto("/explorer?marche=location");
  await expect(page.locator('header a[href="/explorer?marche=location"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('header a[href="/"]')).not.toHaveAttribute("aria-current", "page");

  await page.goto("/explorer?marche=vente");
  await expect(page.locator('header a[href="/explorer?marche=vente"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('header a[href="/explorer?marche=location"]')).not.toHaveAttribute("aria-current", "page");
});

test("les catégories ouvrent directement un catalogue minimaliste", async ({ page }) => {
  await page.goto("/explorer?categorie=terrain");
  await expect(page.getByRole("heading", { name: "Terrains & champs" })).toBeVisible();
  await expect(page.getByText(/^\d+ biens?$/)).toBeVisible();
  await expect(page.getByText("Démonstration").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Afficher les filtres" })).toBeVisible();
  await expect(page.getByPlaceholder("Budget minimum")).toHaveCount(0);

  await page.getByRole("link", { name: /Terrain · Lac Rose/ }).first().click();
  await expect(page).toHaveURL(/\/logements\/lac-rose-terrain/);
  await expect(page.getByRole("link", { name: /Demander des informations à Se Loger au Sénégal/ })).toHaveAttribute("href", /wa\.me\/221788324069/);
});

test("le manifeste expose les icônes de la nouvelle marque", async ({ page }) => {
  const response = await page.request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.theme_color).toBe("#FF4845");
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ src: "/icon-512.png" })]));
});

test("le parcours agence passe par le contact contrôlé", async ({ page }) => {
  await page.goto("/agences");
  await expect(page.getByRole("heading", { name: /Votre agence, vérifiée/ })).toBeVisible();
  const whatsapp = page.getByRole("link", { name: /WhatsApp : \+221 78 832 40 69/ });
  await expect(whatsapp).toHaveAttribute("href", /wa\.me\/221788324069/);
});
