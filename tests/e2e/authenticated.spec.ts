import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string, password: string, returnTo: string) {
  await page.goto(`/connexion?retour=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("le compte voyageur ouvre ses dossiers privés", async ({ page }) => {
  test.skip(
    !process.env.E2E_TRAVELER_EMAIL || !process.env.E2E_TRAVELER_PASSWORD,
    "Compte voyageur E2E non configuré",
  );
  await login(
    page,
    process.env.E2E_TRAVELER_EMAIL!,
    process.env.E2E_TRAVELER_PASSWORD!,
    "/voyages",
  );
  await expect(page).toHaveURL(/\/voyages$/);
  await expect(page.getByRole("heading", { name: "Mes dossiers" })).toBeVisible();
});

test("le propriétaire vérifié accède à sa publication", async ({ page }) => {
  test.skip(
    !process.env.E2E_OWNER_EMAIL || !process.env.E2E_OWNER_PASSWORD,
    "Compte propriétaire E2E non configuré",
  );
  await login(
    page,
    process.env.E2E_OWNER_EMAIL!,
    process.env.E2E_OWNER_PASSWORD!,
    "/publier",
  );
  await expect(page).toHaveURL(/\/(publier|gestion\/biens)$/);
  await expect(
    page.getByRole("heading", { name: /Mettre un bien en ligne|Votre bien est déjà enregistré/ }),
  ).toBeVisible();
});

test("le rôle administrateur ouvre la modération", async ({ page }) => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Compte administrateur E2E non configuré",
  );
  await login(
    page,
    process.env.E2E_ADMIN_EMAIL!,
    process.env.E2E_ADMIN_PASSWORD!,
    "/admin",
  );
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Administration", { exact: true }).first()).toBeVisible();
});
