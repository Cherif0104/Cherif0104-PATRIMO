import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createServerSupabaseClient } from "@/lib/supabase-server-client";
import type { PropertyContract } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContractWithListing = PropertyContract & {
  listing: {
    title: string;
    city: string;
    neighborhood: string;
  } | null;
};

function safe(value: unknown) {
  return String(value ?? "")
    .replaceAll("’", "'")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("→", "a")
    .replace(/[^\x20-\x7EÀ-ÿ]/g, "");
}

function money(value: number | null, currency: string) {
  if (!value) return "Non renseigne";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return new Response("Service indisponible", { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return new Response("Non autorisé", { status: 401 });

  const { id } = await context.params;
  const { data, error } = await supabase
    .from("property_contracts")
    .select("*, listing:marketplace_listings(title, city, neighborhood)")
    .eq("id", id)
    .single();
  if (error || !data) return new Response("Document introuvable", { status: 404 });
  const contract = data as ContractWithListing;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.09, 0.16, 0.22);
  const muted = rgb(0.36, 0.36, 0.36);
  let y = 785;

  page.drawText("SE LOGER AU SENEGAL", { x: 48, y, size: 12, font: bold, color: rgb(0.76, 0.21, 0.08) });
  y -= 48;
  page.drawText(safe(contract.title), { x: 48, y, size: 22, font: bold, color: dark });
  y -= 28;
  page.drawText("Fiche contractuelle", { x: 48, y, size: 11, font: regular, color: muted });
  y -= 40;

  const rows = [
    ["Bien", contract.listing?.title || contract.listing_id],
    ["Adresse", contract.listing ? `${contract.listing.neighborhood}, ${contract.listing.city}` : "Non renseignee"],
    ["Type", contract.contract_kind],
    ["Statut", contract.status],
    ["Debut", contract.start_date || "Non renseigne"],
    ["Fin", contract.end_date || "Non renseigne"],
    ["Montant", money(contract.monthly_amount, contract.currency)],
    ["Envoye le", contract.sent_at || "Non envoye"],
    ["Accepte le", contract.tenant_accepted_at || "Non accepte"],
    ["Reference", contract.id],
  ];
  for (const [label, value] of rows) {
    page.drawText(safe(label), { x: 48, y, size: 10, font: bold, color: dark });
    page.drawText(safe(value), { x: 180, y, size: 10, font: regular, color: dark });
    y -= 24;
  }

  y -= 30;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1, color: rgb(0.88, 0.88, 0.88) });
  y -= 28;
  const disclaimer = [
    "Ce document est une fiche de synthese generee depuis les donnees de la plateforme.",
    "Il ne remplace pas les clauses contractuelles et annexes validees par les parties.",
    "L'acceptation electronique, lorsqu'elle existe, est horodatee dans le registre de la plateforme.",
  ];
  for (const line of disclaimer) {
    page.drawText(safe(line), { x: 48, y, size: 9, font: regular, color: muted });
    y -= 16;
  }

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="contrat-${id.slice(0, 8)}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
