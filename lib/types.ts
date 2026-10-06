export type Mode = "sejour" | "location";
export type Role = "voyageur" | "proprietaire" | "agence" | "admin";
export type Currency = "XOF" | "EUR";
export type Payer = "proprietaire" | "client" | "partage";
export type CommissionBase = "sejour" | "mois" | "avance" | "encaisse";
export type PropertyType = "villa" | "appartement" | "maison" | "riad" | "studio" | "ecolodge";

export type Listing = {
  id: string;
  title: string;
  city: string;
  country: string;
  neighborhood: string;
  mode: Mode;
  type: PropertyType;
  price: number;
  currency: Currency;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  surface: number;
  rating: number;
  reviewsCount: number;
  images: string[];
  lat: number;
  lng: number;
  description: string;
  amenities: string[];
  hostId: string;
  managedByPlatform: boolean;
  advanceMonths?: number;
  reviews: Review[];
};

export type Review = {
  id: string;
  name: string;
  date: string;
  text: string;
  rating: number;
};

export type Host = {
  id: string;
  name: string;
  kind: "proprietaire" | "agence";
  city: string;
  since: number;
  response: string;
};

export type CommissionRule = {
  id: string;
  label: string;
  mode: Mode | "gestion";
  active: boolean;
  kind: "percent" | "fixed";
  value: number;
  payer: Payer;
  ownerShare: number;
  base: CommissionBase;
};

export type Promo = {
  id: string;
  label: string;
  active: boolean;
  mode: Mode | "tous";
  discountPercent: number;
  target: "commission" | "prix";
  beneficiary: "proprietaire" | "client" | "les-deux";
};

export type AdPlacement =
  | "accueil-bandeau"
  | "accueil-rangee"
  | "explorer"
  | "fiche"
  | "gestion"
  | "boutique";

export type Ad = {
  id: string;
  placement: AdPlacement;
  partner: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  active: boolean;
  offer?: string;
};

export type Settings = {
  advanceMonths: number;
  rules: CommissionRule[];
  promos: Promo[];
  ads: Ad[];
};

export type ReservationStatus = "demande" | "confirmee" | "en-cours" | "terminee";

export type Reservation = {
  id: string;
  listingId: string;
  guestName: string;
  mode: Mode;
  from: string;
  to: string;
  status: ReservationStatus;
  subtotal: number;
  commission: number;
  guestPays: number;
  currency: Currency;
};

export type InvoiceStatus = "payee" | "due" | "retard";
export type InvoiceKind = "loyer" | "sejour" | "commission" | "charges";

export type Invoice = {
  id: string;
  listingId: string;
  clientName: string;
  label: string;
  amount: number;
  currency: Currency;
  status: InvoiceStatus;
  date: string;
  kind: InvoiceKind;
};

export type ExpenseCategory = "reparation" | "taxe" | "syndic" | "menage" | "autre";

export type Expense = {
  id: string;
  listingId: string;
  label: string;
  category: ExpenseCategory;
  amount: number;
  currency: Currency;
  date: string;
  chargeToTenant: boolean;
};

export type ClientKind = "locataire" | "voyageur";

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  listingId: string;
  kind: ClientKind;
  since: string;
  balance: number;
  currency: Currency;
};

export type IncidentCategory = "panne" | "sinistre" | "probleme" | "autre";
export type IncidentStatus = "nouveau" | "pris-en-charge" | "resolu";

export type Incident = {
  id: string;
  listingId: string;
  title: string;
  category: IncidentCategory;
  description: string;
  photos: string[];
  reporter: string;
  createdAt: string;
  status: IncidentStatus;
  notifiedName: string;
};

export type RoomState = "neuf" | "bon" | "use" | "degrade";

export type RoomCheck = {
  name: string;
  state: RoomState;
  notes: string;
  photos: string[];
};

export type MeterReading = {
  kind: "eau" | "electricite";
  index: string;
  unit: string;
  photo?: string;
};

export type Inspection = {
  id: string;
  listingId: string;
  kind: "entree" | "sortie";
  date: string;
  author: string;
  rooms: RoomCheck[];
  meters: MeterReading[];
  keys: number;
  comments: string;
  tenantSignature?: string;
  ownerSignature?: string;
  signedAt?: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
  audience: "proprietaire" | "agence" | "admin" | "all";
  listingId?: string;
};

export type AppState = {
  role: Role;
  listings: Listing[];
  reservations: Reservation[];
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  incidents: Incident[];
  inspections: Inspection[];
  notifications: Notification[];
  saved: string[];
  settings: Settings;
};

export type QuoteLine = { label: string; amount: number };
export type Quote = {
  currency: Currency;
  subtotal: number;
  advance: number | null;
  commission: number;
  payer: Payer;
  guestPays: number;
  ownerReceives: number;
  platformReceives: number;
  lines: QuoteLine[];
  ruleLabel: string;
  warning?: string;
};
