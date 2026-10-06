import type {
  ExpenseCategory,
  IncidentCategory,
  IncidentStatus,
  InvoiceStatus,
  Mode,
  PropertyType,
  ReservationStatus,
  RoomState,
} from "./types";

export const MODE_LABEL: Record<Mode, string> = {
  sejour: "Séjour",
  location: "Location",
};

export const TYPE_LABEL: Record<PropertyType, string> = {
  villa: "Villa",
  appartement: "Appartement",
  maison: "Maison",
  riad: "Riad",
  studio: "Studio",
  ecolodge: "Écolodge",
};

export const ROOM_LABEL: Record<RoomState, string> = {
  neuf: "Neuf",
  bon: "Bon état",
  use: "Usé",
  degrade: "Dégradé",
};

export const INCIDENT_LABEL: Record<IncidentCategory, string> = {
  panne: "Panne",
  sinistre: "Sinistre",
  probleme: "Problème",
  autre: "Autre",
};

export const INCIDENT_STATUS: Record<IncidentStatus, string> = {
  nouveau: "Nouveau",
  "pris-en-charge": "Pris en charge",
  resolu: "Résolu",
};

export const RESERVATION_STATUS: Record<ReservationStatus, string> = {
  demande: "Demande",
  confirmee: "Confirmée",
  "en-cours": "En cours",
  terminee: "Terminée",
};

export const INVOICE_STATUS: Record<InvoiceStatus, string> = {
  payee: "Payée",
  due: "À encaisser",
  retard: "En retard",
};

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  reparation: "Réparation",
  taxe: "Taxe",
  syndic: "Syndic",
  menage: "Ménage",
  autre: "Autre",
};

export const PLACEMENT_LABEL = {
  "accueil-bandeau": "Accueil · bandeau",
  "accueil-rangee": "Accueil · entre les logements",
  explorer: "Explorer",
  fiche: "Fiche logement",
  gestion: "Espace gestion",
  boutique: "Boutique partenaire",
} as const;

export const DEFAULT_ROOMS = ["Séjour", "Cuisine", "Chambre", "Salle d'eau", "Extérieur"];
