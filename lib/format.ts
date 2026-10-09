import type { Currency, Role } from "./types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatMoney(amount: number, currency: Currency) {
  const sign = amount < 0 ? "−" : "";
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(
    Math.abs(Math.round(amount)),
  );
  return currency === "EUR" ? `${sign}${n} €` : `${sign}${n} F CFA`;
}

export function pinPrice(amount: number, currency: Currency) {
  if (currency === "EUR") return `${Math.round(amount)} €`;
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (amount >= 1000) return `${Math.round(amount / 1000)} k`;
  return String(Math.round(amount));
}

export function formatDate(iso: string) {
  const value = iso.length <= 10 ? `${iso}T12:00:00` : iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDaysISO(days: number, from?: string) {
  const d = from ? new Date(`${from}T12:00:00`) : new Date();
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function nightsBetween(from: string, to: string) {
  if (!from || !to) return 0;
  const a = new Date(`${from}T12:00:00`).getTime();
  const b = new Date(`${to}T12:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function roleLabel(role: Role) {
  switch (role) {
    case "voyageur":
      return "Voyageur";
    case "proprietaire":
      return "Aminata Diallo";
    case "agence":
      return "Ndar Immobilier";
    case "admin":
      return "Admin Se Loger au Sénégal";
  }
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const btn =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

export const btnPrimary = `${btn} bg-[#FF385C] text-white shadow-sm hover:bg-[#C13515]`;
export const btnSecondary = `${btn} border border-[#222] bg-white text-[#222] hover:bg-[#f7f7f7]`;
export const btnGhost = `${btn} text-[#222] hover:bg-[#f2f2f2]`;
export const fieldClass =
  "w-full rounded-xl border border-[#dddddd] bg-white px-3 py-2.5 text-sm text-[#222] outline-none transition focus:border-[#FF385C] focus:ring-1 focus:ring-[#FF385C]";
