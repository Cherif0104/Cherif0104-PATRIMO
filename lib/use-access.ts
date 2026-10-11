"use client";

import { useMemo } from "react";
import { capabilitiesFor, resolvePersona, type AccessIdentity, type Capability } from "./access";
import { useAuth } from "./auth";

export function useAccess() {
  const { user, profile, memberships, loading } = useAuth();
  const identity = useMemo<AccessIdentity>(() => ({
    authenticated: Boolean(user),
    admin: user?.app_metadata?.role === "admin",
    profile,
    memberships,
  }), [memberships, profile, user]);
  const capabilities = useMemo(() => capabilitiesFor(identity), [identity]);
  const persona = useMemo(() => resolvePersona(identity), [identity]);

  return {
    identity,
    persona,
    capabilities,
    loading,
    can: (capability: Capability) => capabilities.has(capability),
  };
}
