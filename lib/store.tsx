"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { createInitial, hostById, hostIdForRole } from "./seed";
import { loadRemoteState, saveRemoteState, supabase } from "./supabase";
import type {
  Ad,
  AppState,
  Client,
  Expense,
  Incident,
  Inspection,
  Invoice,
  Listing,
  Notification,
  Promo,
  Reservation,
  Role,
} from "./types";
import { uid } from "./format";

const KEY = "ameena-os-v1";

type Action =
  | { type: "hydrate"; payload: AppState }
  | { type: "reset" }
  | { type: "set-role"; role: Role }
  | { type: "toggle-save"; id: string }
  | { type: "add-listing"; listing: Listing }
  | { type: "add-reservation"; reservation: Reservation }
  | { type: "set-reservation-status"; id: string; status: Reservation["status"] }
  | { type: "add-expense"; expense: Expense }
  | { type: "pay-invoice"; id: string }
  | { type: "add-incident"; incident: Incident }
  | { type: "set-incident-status"; id: string; status: Incident["status"] }
  | { type: "add-inspection"; inspection: Inspection }
  | { type: "mark-read" }
  | { type: "patch-settings"; settings: AppState["settings"] }
  | { type: "storage-error" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return hydrate(action.payload);
    case "reset":
      return createInitial();
    case "set-role":
      return { ...state, role: action.role };
    case "toggle-save": {
      const saved = state.saved.includes(action.id)
        ? state.saved.filter((id) => id !== action.id)
        : [...state.saved, action.id];
      return { ...state, saved };
    }
    case "add-listing":
      return { ...state, listings: [action.listing, ...state.listings] };
    case "add-reservation":
      return {
        ...state,
        reservations: [action.reservation, ...state.reservations],
        notifications: [noticeForReservation(action.reservation, state), ...state.notifications],
      };
    case "set-reservation-status": {
      const current = state.reservations.find((item) => item.id === action.id);
      if (!current) return state;
      const reservations = state.reservations.map((item) =>
        item.id === action.id ? { ...item, status: action.status } : item,
      );
      if (action.status !== "confirmee" || current.status === "confirmee") {
        return { ...state, reservations };
      }
      const invoices = invoicesForReservation(current, state);
      const clients = upsertClient(state, current);
      return {
        ...state,
        reservations,
        invoices: [...invoices, ...state.invoices],
        clients,
        notifications: [
          {
            id: uid("note"),
            title: "Réservation confirmée",
            body: `${current.guestName} · dossier et factures créés.`,
            createdAt: new Date().toISOString(),
            read: false,
            href: "/gestion/reservations",
            audience: audienceForListing(state, current.listingId),
            listingId: current.listingId,
          },
          ...state.notifications,
        ],
      };
    }
    case "add-expense":
      return { ...state, expenses: [action.expense, ...state.expenses] };
    case "pay-invoice": {
      const invoice = state.invoices.find((item) => item.id === action.id);
      if (!invoice || invoice.status === "payee") return state;
      return {
        ...state,
        invoices: state.invoices.map((item) =>
          item.id === action.id ? { ...item, status: "payee" } : item,
        ),
        clients: state.clients.map((client) => {
          if (client.name !== invoice.clientName || client.currency !== invoice.currency) return client;
          return { ...client, balance: Math.max(0, client.balance - invoice.amount) };
        }),
      };
    }
    case "add-incident": {
      const notes = notesForIncident(action.incident, state);
      return {
        ...state,
        incidents: [action.incident, ...state.incidents],
        notifications: [...notes, ...state.notifications],
      };
    }
    case "set-incident-status":
      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.id ? { ...incident, status: action.status } : incident,
        ),
      };
    case "add-inspection":
      return { ...state, inspections: [action.inspection, ...state.inspections] };
    case "mark-read":
      return {
        ...state,
        notifications: state.notifications.map((note) =>
          visibleNotification(state, note) ? { ...note, read: true } : note,
        ),
      };
    case "patch-settings":
      return { ...state, settings: action.settings };
    default:
      return state;
  }
}

function hydrate(saved: Partial<AppState> | null): AppState {
  const base = createInitial();
  if (!saved || typeof saved !== "object") return base;
  const settings = saved.settings;
  return {
    ...base,
    ...saved,
    listings: Array.isArray(saved.listings) ? saved.listings : base.listings,
    reservations: Array.isArray(saved.reservations) ? saved.reservations : base.reservations,
    invoices: Array.isArray(saved.invoices) ? saved.invoices : base.invoices,
    expenses: Array.isArray(saved.expenses) ? saved.expenses : base.expenses,
    clients: Array.isArray(saved.clients) ? saved.clients : base.clients,
    incidents: Array.isArray(saved.incidents) ? saved.incidents : base.incidents,
    inspections: Array.isArray(saved.inspections) ? saved.inspections : base.inspections,
    notifications: Array.isArray(saved.notifications) ? saved.notifications : base.notifications,
    saved: Array.isArray(saved.saved) ? saved.saved : base.saved,
    settings: {
      ...base.settings,
      ...settings,
      advanceMonths: settings?.advanceMonths || base.settings.advanceMonths,
      rules: Array.isArray(settings?.rules) ? settings.rules : base.settings.rules,
      promos: Array.isArray(settings?.promos) ? settings.promos : base.settings.promos,
      ads: Array.isArray(settings?.ads) ? settings.ads : base.settings.ads,
    },
  };
}

function audienceForListing(state: AppState, listingId: string): Notification["audience"] {
  const listing = state.listings.find((item) => item.id === listingId);
  const host = listing ? hostById(listing.hostId) : undefined;
  if (host?.kind === "agence") return "agence";
  return "proprietaire";
}

function noticeForReservation(reservation: Reservation, state: AppState): Notification {
  return {
    id: uid("note"),
    title: "Nouvelle demande",
    body: `${reservation.guestName} demande ${reservation.mode === "sejour" ? "un séjour" : "une location"}.`,
    createdAt: new Date().toISOString(),
    read: false,
    href: "/gestion/reservations",
    audience: audienceForListing(state, reservation.listingId),
    listingId: reservation.listingId,
  };
}

function invoicesForReservation(reservation: Reservation, state: AppState): Invoice[] {
  const listing = state.listings.find((item) => item.id === reservation.listingId);
  const today = new Date().toISOString().slice(0, 10);
  const invoices: Invoice[] = [
    {
      id: uid("fac"),
      listingId: reservation.listingId,
      clientName: reservation.guestName,
      label: reservation.mode === "sejour" ? "Séjour" : "Avance locative",
      amount: reservation.guestPays,
      currency: reservation.currency,
      status: "due",
      date: today,
      kind: reservation.mode === "sejour" ? "sejour" : "loyer",
    },
  ];
  if (reservation.commission > 0) {
    invoices.push({
      id: uid("fac"),
      listingId: reservation.listingId,
      clientName: listing ? hostById(listing.hostId)?.name ?? "Propriétaire" : "Propriétaire",
      label: "Commission Ameena",
      amount: reservation.commission,
      currency: reservation.currency,
      status: "due",
      date: today,
      kind: "commission",
    });
  }
  return invoices;
}

function upsertClient(state: AppState, reservation: Reservation): Client[] {
  const existing = state.clients.find(
    (client) => client.name === reservation.guestName && client.listingId === reservation.listingId,
  );
  if (existing) return state.clients;
  return [
    {
      id: uid("cli"),
      name: reservation.guestName,
      email: "",
      phone: "",
      listingId: reservation.listingId,
      kind: reservation.mode === "sejour" ? "voyageur" : "locataire",
      since: new Date().toISOString().slice(0, 10),
      balance: reservation.guestPays,
      currency: reservation.currency,
    },
    ...state.clients,
  ];
}

function notesForIncident(incident: Incident, state: AppState): Notification[] {
  const listing = state.listings.find((item) => item.id === incident.listingId);
  const audience = audienceForListing(state, incident.listingId);
  const photoCount = incident.photos.length;
  const body = `${incident.title}. ${photoCount} photo${photoCount > 1 ? "s" : ""} jointe${photoCount > 1 ? "s" : ""}. ${incident.notifiedName} est notifié.`;
  const notes: Notification[] = [
    {
      id: uid("note"),
      title: `Incident · ${listing?.neighborhood ?? "Bien"}`,
      body,
      createdAt: incident.createdAt,
      read: false,
      href: `/gestion/incidents/${incident.id}`,
      audience,
      listingId: incident.listingId,
    },
  ];
  if (listing?.managedByPlatform) {
    notes.push({
      id: uid("note"),
      title: "Bien géré · incident",
      body,
      createdAt: incident.createdAt,
      read: false,
      href: `/gestion/incidents/${incident.id}`,
      audience: "admin",
      listingId: incident.listingId,
    });
  }
  return notes;
}

export function visibleNotification(state: AppState, note: Notification) {
  if (state.role === "voyageur") return false;
  if (state.role === "admin") return true;
  if (note.audience !== state.role && note.audience !== "all") return false;
  if (!note.listingId) return true;
  const listing = state.listings.find((item) => item.id === note.listingId);
  if (!listing) return false;
  return listing.hostId === hostIdForRole(state.role);
}

type Store = {
  state: AppState;
  ready: boolean;
  storageWarning: string | null;
  dispatch: (action: Action) => void;
};

const Ctx = createContext<Store | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitial);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (supabase) {
        try {
          const remote = await loadRemoteState();
          if (cancel) return;
          if (remote) dispatch({ type: "hydrate", payload: remote });
        } catch {
          if (!cancel) {
            setStorageWarning("Supabase est injoignable. Les données affichées restent celles de cet appareil.");
          }
        }
      }
      if (!supabase) {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          try {
            dispatch({ type: "hydrate", payload: JSON.parse(raw) as AppState });
          } catch {
            setStorageWarning("Les données locales étaient illisibles. La démonstration repart des exemples.");
          }
        }
      }
      if (!cancel) setReady(true);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      setStorageWarning("Le navigateur n'a plus assez de place pour les photos. Retirez une image ou réinitialisez la démo.");
    }
    if (!supabase) return;
    const timer = window.setTimeout(() => {
      saveRemoteState(state).catch(() => {
        setStorageWarning("L'enregistrement Supabase a échoué. La copie locale est conservée.");
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [state, ready]);

  const value = useMemo(
    () => ({ state, ready, storageWarning, dispatch }),
    [state, ready, storageWarning],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAmeena() {
  const store = useContext(Ctx);
  if (!store) throw new Error("Ameena store absent");
  return store;
}

export function useScope() {
  const { state } = useAmeena();
  const listings =
    state.role === "admin"
      ? state.listings
      : state.role === "voyageur"
        ? []
        : state.listings.filter((listing) => listing.hostId === hostIdForRole(state.role));
  const ids = new Set(listings.map((listing) => listing.id));
  const inScope = <T extends { listingId: string }>(rows: T[]) =>
    state.role === "admin" ? rows : rows.filter((row) => ids.has(row.listingId));
  return {
    listings,
    reservations: inScope(state.reservations),
    invoices: inScope(state.invoices),
    expenses: inScope(state.expenses),
    clients: inScope(state.clients),
    incidents: inScope(state.incidents),
    inspections: inScope(state.inspections),
    notifications: state.notifications.filter((note) => visibleNotification(state, note)),
  };
}

export function patchAd(ads: Ad[], id: string, partial: Partial<Ad>) {
  return ads.map((ad) => (ad.id === id ? { ...ad, ...partial } : ad));
}

export function patchPromo(promos: Promo[], id: string, partial: Partial<Promo>) {
  return promos.map((promo) => (promo.id === id ? { ...promo, ...partial } : promo));
}
