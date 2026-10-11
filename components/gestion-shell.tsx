"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ContactRound,
  FileText,
  Home,
  LayoutDashboard,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cx } from "@/lib/format";
import { loadMyOrganizationMemberships } from "@/lib/supabase";
import type { FunctionalDomain, OrganizationMember } from "@/lib/types";

type GestionLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  domain?: FunctionalDomain;
};

const links: GestionLink[] = [
  { href: "/gestion", label: "Tableau", icon: LayoutDashboard, exact: true },
  { href: "/gestion/biens", label: "Biens", icon: Building2, domain: "catalogue" },
  { href: "/gestion/reservations", label: "Réservations", icon: CalendarDays, domain: "reservations" },
  { href: "/gestion/clients", label: "Clientèle", icon: Users, domain: "crm" },
  { href: "/gestion/crm", label: "CRM", icon: ContactRound, domain: "crm" },
  { href: "/gestion/contrats", label: "Contrats", icon: FileText, domain: "contracts" },
  { href: "/gestion/finances", label: "Finances", icon: Wallet, domain: "finance" },
  { href: "/gestion/equipe", label: "Équipe", icon: UserCog, domain: "administration" },
  { href: "/gestion/incidents", label: "Incidents", icon: Wrench, domain: "maintenance" },
  { href: "/gestion/etats-des-lieux", label: "États des lieux", icon: ClipboardCheck, domain: "maintenance" },
];

export function GestionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [memberships, setMemberships] = useState<OrganizationMember[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);
  const [membershipsUserId, setMembershipsUserId] = useState("");
  const isAdmin = user?.app_metadata?.role === "admin";
  const isVerifiedProfessional =
    profile?.identity_status === "verifie"
    && (profile.account_type === "proprietaire" || profile.account_type === "agence");
  const isOrganizationMember = memberships.length > 0;
  const memberDomains = useMemo(
    () => new Set(memberships.flatMap((membership) => membership.functional_domains)),
    [memberships],
  );

  useEffect(() => {
    if (!user) {
      setMemberships([]);
      setMembershipsUserId("");
      setMembershipsLoading(false);
      return;
    }
    setMembershipsLoading(true);
    loadMyOrganizationMemberships()
      .then(setMemberships)
      .catch(() => setMemberships([]))
      .finally(() => {
        setMembershipsUserId(user.id);
        setMembershipsLoading(false);
      });
  }, [user]);

  function canOpen(link: GestionLink) {
    if (!link.domain || isAdmin || profile?.account_type === "agence") return true;
    if (isOrganizationMember) return memberDomains.has(link.domain);
    return !["crm", "administration"].includes(link.domain);
  }

  const visibleLinks = links.filter(canOpen);
  const currentLink = links.find((link) =>
    link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`));
  const currentAllowed = !currentLink || canOpen(currentLink);
  const linkLabel = (link: GestionLink) => {
    if (profile?.account_type !== "proprietaire") return link.label;
    if (link.href === "/gestion") return "Vue d’ensemble";
    if (link.href === "/gestion/biens") return "Mon bien";
    if (link.href === "/gestion/reservations") return "Demandes";
    return link.label;
  };

  if (loading || membershipsLoading || (user && membershipsUserId !== user.id)) {
    return <div className="p-12 text-center text-sm text-[#6a6a6a]">Ouverture de la gestion…</div>;
  }

  if (!user || (!isAdmin && !isVerifiedProfessional && !isOrganizationMember)) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-sm text-[#6a6a6a]">Espace de gestion</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Réservé aux propriétaires et aux agences</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6a6a6a]">
          Connectez-vous avec un profil professionnel pour suivre vos biens, demandes, finances, incidents et états des lieux.
        </p>
        <Link href={user ? "/compte" : "/connexion?retour=/gestion"} className="mt-6 inline-flex rounded-full bg-[#222] px-5 py-2.5 text-sm font-medium text-white">
          {user ? "Activer mon profil professionnel" : "Se connecter"}
        </Link>
      </div>
    );
  }

  if (!currentAllowed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-sm text-[#6a6a6a]">Droits de l’équipe</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Module non attribué</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6a6a6a]">Le responsable de votre agence peut activer ce domaine fonctionnel depuis la gestion de l’équipe.</p>
        <Link href="/gestion" className="mt-6 inline-flex rounded-full bg-[#222] px-5 py-2.5 text-sm font-medium text-white">Retour au tableau de bord</Link>
      </div>
    );
  }

  return (
    <div className={cx(
      "grid min-h-[calc(100vh-5rem)] lg:grid-cols-[250px_1fr]",
      profile?.account_type === "proprietaire" && "pb-20 lg:pb-0",
    )}>
      <aside className="no-print border-b border-[#ebebeb] bg-[#fafafa] lg:border-b-0 lg:border-r">
        <div className="px-4 py-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6a6a6a]">Gestion</p>
          <p className="mt-1 font-semibold">
            {isAdmin ? "Administration" : profile?.account_type === "agence" ? "Agence vérifiée" : isOrganizationMember ? "Collaborateur agence" : "Propriétaire vérifié"}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {visibleLinks.map((link) => {
            const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm lg:rounded-xl",
                  active ? "bg-white font-semibold text-[#C13515] shadow-sm" : "hover:bg-white/70",
                )}
              >
                <Icon className="h-4 w-4" />
                {linkLabel(link)}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 px-4 py-5 md:px-8 lg:px-10 lg:py-8">
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-full border border-[#dddddd] px-3 py-2 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Retour
          </button>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium">
            <Home className="h-4 w-4" /> Accueil
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
