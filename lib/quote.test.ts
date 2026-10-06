import assert from "node:assert/strict";
import test from "node:test";
import { buildQuote } from "./quote";
import type { Listing, Settings } from "./types";

function listing(partial: Partial<Listing>): Listing {
  return {
    id: "bien",
    title: "Bien",
    city: "Dakar",
    country: "Sénégal",
    neighborhood: "Almadies",
    mode: "sejour",
    type: "villa",
    price: 85_000,
    currency: "XOF",
    guests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    surface: 180,
    rating: 4.9,
    reviewsCount: 12,
    images: [],
    lat: 0,
    lng: 0,
    description: "",
    amenities: [],
    hostId: "h",
    managedByPlatform: false,
    reviews: [],
    ...partial,
  };
}

function settings(partial: Partial<Settings> = {}): Settings {
  return {
    advanceMonths: 2,
    rules: [
      {
        id: "sejour",
        label: "Séjour",
        mode: "sejour",
        active: true,
        kind: "percent",
        value: 20,
        payer: "proprietaire",
        ownerShare: 100,
        base: "sejour",
      },
      {
        id: "location",
        label: "Location",
        mode: "location",
        active: true,
        kind: "percent",
        value: 20,
        payer: "proprietaire",
        ownerShare: 100,
        base: "mois",
      },
      {
        id: "gestion",
        label: "Gestion",
        mode: "gestion",
        active: true,
        kind: "percent",
        value: 15,
        payer: "client",
        ownerShare: 0,
        base: "mois",
      },
    ],
    promos: [],
    ads: [],
    ...partial,
  };
}

test("séjour : 20 % à la charge du propriétaire", () => {
  const quote = buildQuote(listing({}), 3, settings());
  assert.equal(quote.subtotal, 255_000);
  assert.equal(quote.commission, 51_000);
  assert.equal(quote.guestPays, 255_000);
  assert.equal(quote.ownerReceives, 204_000);
  assert.equal(quote.platformReceives, 51_000);
});

test("location : avance de 2 mois et 20 % d'un mois", () => {
  const quote = buildQuote(
    listing({ mode: "location", price: 275_000, type: "appartement" }),
    1,
    settings(),
  );
  assert.equal(quote.advance, 550_000);
  assert.equal(quote.commission, 55_000);
  assert.equal(quote.guestPays, 550_000);
  assert.equal(quote.ownerReceives, 495_000);
});

test("la commission peut être mise à la charge du client", () => {
  const base = settings();
  base.rules = base.rules.map((rule) =>
    rule.mode === "sejour" ? { ...rule, payer: "client" } : rule,
  );
  const quote = buildQuote(listing({}), 3, base);
  assert.equal(quote.guestPays, 306_000);
  assert.equal(quote.ownerReceives, 255_000);
});

test("partage 40 / 60", () => {
  const base = settings();
  base.rules = base.rules.map((rule) =>
    rule.mode === "sejour" ? { ...rule, payer: "partage", ownerShare: 40 } : rule,
  );
  const quote = buildQuote(listing({}), 3, base);
  assert.equal(quote.commission, 51_000);
  assert.equal(quote.ownerReceives, 255_000 - 20_400);
  assert.equal(quote.guestPays, 255_000 + 30_600);
});

test("geste commercial sur la commission", () => {
  const quote = buildQuote(listing({}), 3, settings({
    promos: [
      {
        id: "p",
        label: "Geste",
        active: true,
        mode: "sejour",
        discountPercent: 50,
        target: "commission",
        beneficiary: "proprietaire",
      },
    ],
  }));
  assert.equal(quote.commission, 25_500);
  assert.equal(quote.ownerReceives, 255_000 - 25_500);
});

test("un bien géré utilise la règle Gestion", () => {
  const quote = buildQuote(listing({ managedByPlatform: true }), 3, settings());
  assert.equal(quote.ruleLabel, "Gestion");
  assert.equal(quote.commission, 38_250);
  assert.equal(quote.payer, "client");
  assert.equal(quote.guestPays, 255_000 + 38_250);
  assert.match(quote.lines.map((line) => line.label).join(" "), /Gestion/);
  assert.match(quote.lines.map((line) => line.label).join(" "), /client/);
});

test("montant fixe", () => {
  const base = settings();
  base.rules = base.rules.map((rule) =>
    rule.mode === "location" ? { ...rule, kind: "fixed", value: 25_000, payer: "client" } : rule,
  );
  const quote = buildQuote(listing({ mode: "location", price: 200_000 }), 1, base);
  assert.equal(quote.commission, 25_000);
  assert.equal(quote.guestPays, 400_000 + 25_000);
});
