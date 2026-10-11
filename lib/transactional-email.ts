export type EmailOutboxRow = {
  id: string;
  kind:
    | "booking_guest_created"
    | "booking_owner_created"
    | "organization_invitation"
    | "verification_decision"
    | "contract_update";
  recipient: string;
  subject: string;
  payload: Record<string, unknown>;
  attempts: number;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAmount(value: unknown, currency: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency: String(currency || "XOF"),
    maximumFractionDigits: 0,
  }).format(amount);
}

function content(row: EmailOutboxRow, appUrl: string) {
  const payload = row.payload;
  if (row.kind === "booking_guest_created") {
    return {
      heading: "Demande transmise",
      text: `Votre demande pour ${escapeHtml(payload.listing_title)} a bien été enregistrée.`,
      details: `${escapeHtml(payload.start_date)} → ${escapeHtml(payload.end_date)} · ${escapeHtml(formatAmount(payload.total, payload.currency))}`,
      action: { label: "Suivre ma demande", href: `${appUrl}/voyages` },
    };
  }
  if (row.kind === "booking_owner_created") {
    return {
      heading: "Nouvelle demande",
      text: `${escapeHtml(payload.guest_name)} souhaite réserver ${escapeHtml(payload.listing_title)}.`,
      details: `${escapeHtml(payload.start_date)} → ${escapeHtml(payload.end_date)}`,
      action: { label: "Examiner la demande", href: `${appUrl}/gestion/reservations` },
    };
  }
  if (row.kind === "organization_invitation") {
    return {
      heading: "Vous êtes invité",
      text: `Rejoignez ${escapeHtml(payload.organization_name || "votre organisation")} sur Se Loger au Sénégal.`,
      details: "Cette invitation est personnelle et limitée dans le temps.",
      action: { label: "Accepter l’invitation", href: `${appUrl}/invitation/${encodeURIComponent(String(payload.token || ""))}` },
    };
  }
  if (row.kind === "verification_decision") {
    const approved = payload.status === "approved";
    return {
      heading: approved ? "Profil vérifié" : "Vérification à compléter",
      text: approved
        ? "Votre profil est maintenant autorisé à publier un bien."
        : "Votre demande n’a pas pu être validée. Consultez votre compte pour compléter votre dossier.",
      details: "",
      action: { label: approved ? "Publier mon bien" : "Consulter mon profil", href: `${appUrl}/${approved ? "publier" : "compte#certification"}` },
    };
  }
  return {
    heading: "Votre contrat a été mis à jour",
    text: `${escapeHtml(payload.title)} · statut ${escapeHtml(payload.status)}`,
    details: "",
    action: { label: "Consulter mes dossiers", href: `${appUrl}/voyages` },
  };
}

export function renderTransactionalEmail(row: EmailOutboxRow, appUrl: string) {
  const message = content(row, appUrl.replace(/\/$/, ""));
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f7f7f7;font-family:Arial,sans-serif;color:#182A39">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px">
      <div style="background:#fff;border:1px solid #e8e8e8;border-radius:20px;padding:32px">
        <p style="margin:0 0 24px;color:#C13515;font-weight:700">Se Loger au Sénégal</p>
        <h1 style="margin:0 0 16px;font-size:26px">${message.heading}</h1>
        <p style="margin:0 0 10px;line-height:1.6">${message.text}</p>
        ${message.details ? `<p style="margin:0 0 24px;color:#6a6a6a">${message.details}</p>` : ""}
        <a href="${escapeHtml(message.action.href)}" style="display:inline-block;margin-top:12px;border-radius:999px;background:#182A39;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">${message.action.label}</a>
      </div>
      <p style="margin:16px 8px 0;color:#777;font-size:12px;line-height:1.5">Message automatique lié à votre activité sur Se Loger au Sénégal.</p>
    </div>
  </body>
</html>`;
}
