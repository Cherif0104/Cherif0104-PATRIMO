import type { FunctionalDomain, OrganizationMember, Profile } from "./types";

export type Persona =
  | "visitor"
  | "client"
  | "owner_pending"
  | "owner"
  | "agency_pending"
  | "agency_member"
  | "agency"
  | "admin";

export type Capability =
  | "browse_catalog"
  | "save_favorites"
  | "create_booking"
  | "use_messaging"
  | "view_documents"
  | "request_owner_verification"
  | "publish_listing"
  | "manage_catalog"
  | "manage_reservations"
  | "manage_crm"
  | "manage_contracts"
  | "manage_finance"
  | "manage_maintenance"
  | "manage_team"
  | "moderate_platform";

export type AccessIdentity = {
  authenticated: boolean;
  admin?: boolean;
  profile?: Pick<Profile, "account_type" | "requested_account_type" | "identity_status"> | null;
  memberships?: Array<Pick<OrganizationMember, "role" | "functional_domains">>;
};

const clientCapabilities: Capability[] = [
  "browse_catalog",
  "save_favorites",
  "create_booking",
  "use_messaging",
  "view_documents",
];

const domainCapability: Record<FunctionalDomain, Capability> = {
  catalogue: "manage_catalog",
  crm: "manage_crm",
  reservations: "manage_reservations",
  contracts: "manage_contracts",
  finance: "manage_finance",
  maintenance: "manage_maintenance",
  administration: "manage_team",
};

const ownerCapabilities: Capability[] = [
  ...clientCapabilities,
  "publish_listing",
  "manage_catalog",
  "manage_reservations",
  "manage_contracts",
  "manage_finance",
  "manage_maintenance",
];

const agencyCapabilities: Capability[] = [
  ...ownerCapabilities,
  "manage_crm",
  "manage_team",
];

const allCapabilities: Capability[] = [...agencyCapabilities, "moderate_platform"];

export function resolvePersona(identity: AccessIdentity): Persona {
  if (!identity.authenticated) return "visitor";
  if (identity.admin) return "admin";
  if (identity.profile?.account_type === "agence" && identity.profile.identity_status === "verifie") {
    return "agency";
  }
  if (identity.memberships?.length) return "agency_member";
  if (
    identity.profile?.account_type === "agence"
    || identity.profile?.requested_account_type === "agence"
  ) {
    return "agency_pending";
  }
  if (identity.profile?.account_type === "proprietaire" && identity.profile.identity_status === "verifie") {
    return "owner";
  }
  if (
    identity.profile?.account_type === "proprietaire"
    || identity.profile?.requested_account_type === "proprietaire"
  ) {
    return "owner_pending";
  }
  return "client";
}

export function capabilitiesFor(identity: AccessIdentity): Set<Capability> {
  const persona = resolvePersona(identity);
  if (persona === "visitor") return new Set(["browse_catalog"]);
  if (persona === "admin") return new Set(allCapabilities);
  if (persona === "agency") return new Set(agencyCapabilities);
  if (persona === "owner") return new Set(ownerCapabilities);
  if (persona === "owner_pending" || persona === "agency_pending") {
    return new Set([...clientCapabilities, "request_owner_verification"]);
  }
  if (persona === "agency_member") {
    const capabilities = new Set<Capability>(clientCapabilities);
    for (const membership of identity.memberships ?? []) {
      for (const domain of membership.functional_domains) {
        capabilities.add(domainCapability[domain]);
        if (domain === "catalogue" && membership.role !== "viewer") {
          capabilities.add("publish_listing");
        }
      }
    }
    return capabilities;
  }
  return new Set(clientCapabilities);
}

export function can(identity: AccessIdentity, capability: Capability) {
  return capabilitiesFor(identity).has(capability);
}

export function homeFor(identity: AccessIdentity) {
  const persona = resolvePersona(identity);
  if (persona === "admin") return "/admin";
  if (persona === "agency" || persona === "agency_member" || persona === "owner") return "/gestion";
  if (persona === "owner_pending" || persona === "agency_pending") return "/compte#certification";
  if (persona === "client") return "/compte";
  return "/";
}

const managementRoutes: Array<[prefix: string, capability: Capability]> = [
  ["/gestion/biens", "manage_catalog"],
  ["/gestion/reservations", "manage_reservations"],
  ["/gestion/clients", "manage_crm"],
  ["/gestion/crm", "manage_crm"],
  ["/gestion/contrats", "manage_contracts"],
  ["/gestion/finances", "manage_finance"],
  ["/gestion/equipe", "manage_team"],
  ["/gestion/incidents", "manage_maintenance"],
  ["/gestion/etats-des-lieux", "manage_maintenance"],
];

export function managementCapabilityForPath(pathname: string): Capability | null {
  return managementRoutes.find(([prefix]) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? null;
}

export function canAccessManagement(identity: AccessIdentity, pathname: string) {
  const required = managementCapabilityForPath(pathname);
  if (required) return can(identity, required);
  return pathname === "/gestion"
    ? [...capabilitiesFor(identity)].some((capability) => capability.startsWith("manage_"))
    : true;
}
