"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { cx, roleLabel } from "@/lib/format";
import { useAmeena } from "@/lib/store";
import type { Role } from "@/lib/types";

const links = [
  { href: "/gestion", label: "Tableau", icon: LayoutDashboard, exact: true },
  { href: "/gestion/biens", label: "Biens", icon: Building2 },
  { href: "/gestion/reservations", label: "Réservations", icon: CalendarDays },
  { href: "/gestion/clients", label: "Clientèle", icon: Users },
  { href: "/gestion/finances", label: "Finances", icon: Wallet },
  { href: "/gestion/incidents", label: "Incidents", icon: Wrench },
  { href: "/gestion/etats-des-lieux", label: "États des lieux", icon: ClipboardCheck },
];

export function GestionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, dispatch } = useAmeena();

  if (state.role === "voyageur") {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-sm text-[#6a6a6a]">Espace de gestion</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Réservé aux propriétaires et aux agences</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#6a6a6a]">
          Ouvrez le portefeuille d&apos;Aminata Diallo ou celui de Ndar Immobilier pour suivre les biens, l&apos;argent, les pannes et les états des lieux.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <RoleButton role="proprietaire" onPick={(role) => dispatch({ type: "set-role", role })} />
          <RoleButton role="agence" onPick={(role) => dispatch({ type: "set-role", role })} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-[250px_1fr]">
      <aside className="no-print border-b border-[#ebebeb] bg-[#fafafa] lg:border-b-0 lg:border-r">
        <div className="px-4 py-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6a6a6a]">Gestion</p>
          <p className="mt-1 font-semibold">{roleLabel(state.role)}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
          {links.map((link) => {
            const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm lg:rounded-xl",
                  active ? "bg-white font-medium shadow-sm" : "hover:bg-white/70",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="px-4 py-8 md:px-8 lg:px-10">{children}</div>
    </div>
  );
}

function RoleButton({ role, onPick }: { role: Role; onPick: (role: Role) => void }) {
  return (
    <button className="rounded-full bg-[#222] px-5 py-2.5 text-sm font-medium text-white" onClick={() => onPick(role)}>
      Entrer comme {roleLabel(role)}
    </button>
  );
}
