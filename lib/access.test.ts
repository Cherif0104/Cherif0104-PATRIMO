import assert from "node:assert/strict";
import test from "node:test";
import {
  can,
  canAccessManagement,
  homeFor,
  resolvePersona,
  type AccessIdentity,
} from "./access";

const client: AccessIdentity = {
  authenticated: true,
  profile: {
    account_type: "voyageur",
    requested_account_type: "voyageur",
    identity_status: "non_verifie",
  },
};

const pendingOwner: AccessIdentity = {
  authenticated: true,
  profile: {
    account_type: "voyageur",
    requested_account_type: "proprietaire",
    identity_status: "non_verifie",
  },
};

const owner: AccessIdentity = {
  authenticated: true,
  profile: {
    account_type: "proprietaire",
    requested_account_type: "proprietaire",
    identity_status: "verifie",
  },
};

test("un client ne peut pas ouvrir les modules de gestion", () => {
  assert.equal(resolvePersona(client), "client");
  assert.equal(can(client, "create_booking"), true);
  assert.equal(canAccessManagement(client, "/gestion"), false);
  assert.equal(homeFor(client), "/compte");
});

test("un propriétaire en attente conserve le parcours client sans pouvoir publier", () => {
  assert.equal(resolvePersona(pendingOwner), "owner_pending");
  assert.equal(can(pendingOwner, "request_owner_verification"), true);
  assert.equal(can(pendingOwner, "publish_listing"), false);
  assert.equal(homeFor(pendingOwner), "/compte#certification");
});

test("une agence en attente ne peut pas ouvrir le pilotage avant validation", () => {
  const pendingAgency: AccessIdentity = {
    authenticated: true,
    profile: {
      account_type: "voyageur",
      requested_account_type: "agence",
      identity_status: "en_verification",
    },
  };
  assert.equal(resolvePersona(pendingAgency), "agency_pending");
  assert.equal(canAccessManagement(pendingAgency, "/gestion"), false);
  assert.equal(homeFor(pendingAgency), "/compte#certification");
});

test("un propriétaire vérifié gère son bien sans accéder au CRM agence", () => {
  assert.equal(resolvePersona(owner), "owner");
  assert.equal(can(owner, "publish_listing"), true);
  assert.equal(canAccessManagement(owner, "/gestion/finances"), true);
  assert.equal(canAccessManagement(owner, "/gestion/crm"), false);
});

test("un collaborateur agence ne voit que ses domaines attribués", () => {
  const member: AccessIdentity = {
    ...client,
    memberships: [{
      role: "agent",
      functional_domains: ["catalogue", "reservations"],
    }],
  };
  assert.equal(resolvePersona(member), "agency_member");
  assert.equal(can(member, "publish_listing"), true);
  assert.equal(canAccessManagement(member, "/gestion/biens"), true);
  assert.equal(canAccessManagement(member, "/gestion/reservations"), true);
  assert.equal(canAccessManagement(member, "/gestion/finances"), false);

  const viewer: AccessIdentity = {
    ...client,
    memberships: [{ role: "viewer", functional_domains: ["catalogue"] }],
  };
  assert.equal(can(viewer, "manage_catalog"), true);
  assert.equal(can(viewer, "publish_listing"), false);
});

test("l’administrateur dispose de tous les modules", () => {
  const admin: AccessIdentity = { authenticated: true, admin: true };
  assert.equal(resolvePersona(admin), "admin");
  assert.equal(canAccessManagement(admin, "/gestion/equipe"), true);
  assert.equal(can(admin, "moderate_platform"), true);
  assert.equal(homeFor(admin), "/admin");
});
