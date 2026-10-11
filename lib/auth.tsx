"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { loadMyOrganizationMemberships, supabase } from "./supabase";
import type { OrganizationMember, Profile } from "./types";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  memberships: OrganizationMember[];
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessUserId, setAccessUserId] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }

  useEffect(() => {
    if (!supabase || !user) {
      setProfile(null);
      setMemberships([]);
      setAccessUserId("");
      return;
    }
    let active = true;
    setProfile(null);
    setMemberships([]);
    setAccessUserId("");
    Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      loadMyOrganizationMemberships(),
    ]).then(([profileResult, membershipRows]) => {
      if (!active) return;
      setProfile((profileResult.data as Profile | null) ?? null);
      setMemberships(membershipRows);
    }).catch(() => {
      if (!active) return;
      setProfile(null);
      setMemberships([]);
    }).finally(() => {
      if (active) setAccessUserId(user.id);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const loading = authLoading || Boolean(user && accessUserId !== user.id);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      memberships,
      loading,
      configured: Boolean(supabase),
      refreshProfile,
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        setProfile(null);
        setMemberships([]);
      },
    }),
    [user, profile, memberships, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider absent");
  return context;
}
