import type { Listing, Payer, Quote, QuoteLine, Settings } from "./types";
import { formatMoney } from "./format";

/** Devis Ameena.
 * Séjour : le pourcentage s'applique au montant du séjour.
 * Location : un mois de loyer, l'avance, ou le montant encaissé, selon la règle.
 * Un bien géré par Ameena utilise la règle Gestion lorsqu'elle est active.
 * Le payeur, le taux et les gestes commerciaux viennent des réglages.
 */
export function buildQuote(listing: Listing, nights: number, settings: Settings): Quote {
  const rule = pickRule(listing, settings);
  const months = listing.advanceMonths ?? settings.advanceMonths;
  const nightCount = Math.max(1, Math.round(nights) || 1);
  const currency = listing.currency;
  const rent = listing.price;
  const stay = rent * nightCount;
  const advanceGross = rent * months;

  const promos = settings.promos.filter(
    (promo) => promo.active && (promo.mode === "tous" || promo.mode === listing.mode),
  );

  const lines: QuoteLine[] = [];
  let priceDiscount = 0;
  const priceBase = listing.mode === "sejour" ? stay : advanceGross;

  if (listing.mode === "sejour") {
    lines.push({
      label: `${formatMoney(rent, currency)} × ${nightCount} nuit${nightCount > 1 ? "s" : ""}`,
      amount: stay,
    });
  } else {
    lines.push({ label: "Loyer mensuel", amount: rent });
    lines.push({ label: `Avance · ${months} mois`, amount: advanceGross });
  }

  for (const promo of promos.filter((item) => item.target === "prix")) {
    const off = Math.round(priceBase * (promo.discountPercent / 100));
    priceDiscount += off;
    lines.push({ label: promo.label, amount: -off });
  }

  const stayNet = Math.max(0, stay - (listing.mode === "sejour" ? priceDiscount : 0));
  const advanceNet = Math.max(0, advanceGross - (listing.mode === "location" ? priceDiscount : 0));

  const gross = rule ? commissionAmount(rule, listing, stayNet, rent, advanceNet) : 0;
  let commissionOff = 0;

  if (rule) {
    const rate =
      rule.kind === "percent" ? `${trimNumber(rule.value)} %` : formatMoney(rule.value, currency);
    lines.push({
      label: `Commission ${rate} · ${payerLabel(rule.payer)}`,
      amount: gross,
    });
    for (const promo of promos.filter((item) => item.target === "commission")) {
      const off = Math.round(gross * (promo.discountPercent / 100));
      commissionOff += off;
      lines.push({ label: promo.label, amount: -off });
    }
  }

  const commission = Math.max(0, gross - commissionOff);
  const payer: Payer = rule?.payer ?? "proprietaire";
  const ownerRatio =
    payer === "proprietaire" ? 1 : payer === "client" ? 0 : clamp((rule?.ownerShare ?? 50) / 100, 0, 1);
  const ownerPart = Math.round(commission * ownerRatio);
  const clientPart = commission - ownerPart;
  const collected = listing.mode === "sejour" ? stayNet : advanceNet;
  const guestPays = collected + clientPart;
  const ownerReceives = collected - ownerPart;

  return {
    currency,
    subtotal: listing.mode === "sejour" ? stayNet : rent,
    advance: listing.mode === "location" ? advanceNet : null,
    commission,
    payer,
    guestPays,
    ownerReceives,
    platformReceives: commission,
    lines,
    ruleLabel: rule?.label ?? "Aucune commission active",
    warning:
      ownerReceives < 0
        ? "La commission dépasse le montant encaissé. Ajustez le taux ou la base."
        : undefined,
  };
}

function pickRule(listing: Listing, settings: Settings) {
  const rules = settings.rules.filter((rule) => rule.active);
  if (listing.managedByPlatform) {
    const managed = rules.find((rule) => rule.mode === "gestion");
    if (managed) return managed;
  }
  return rules.find((rule) => rule.mode === listing.mode);
}

function commissionAmount(
  rule: Settings["rules"][number],
  listing: Listing,
  stayNet: number,
  rent: number,
  advanceNet: number,
) {
  if (rule.kind === "fixed") return Math.max(0, Math.round(rule.value));
  const pct = rule.value / 100;
  if (listing.mode === "sejour") return Math.round(stayNet * pct);
  if (rule.base === "mois") return Math.round(rent * pct);
  return Math.round(advanceNet * pct);
}

function payerLabel(payer: Payer) {
  if (payer === "client") return "à la charge du client";
  if (payer === "partage") return "partagée";
  return "à la charge du propriétaire";
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
