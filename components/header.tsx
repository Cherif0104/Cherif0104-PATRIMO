"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { btnGhost, cx, formatDateTime, roleLabel } from "@/lib/format";
import { useAmeena, visibleNotification } from "@/lib/store";
import type { Role } from "@/lib/types";

const ROLES: { id: Role; hint: string }[] = [
  { id: "voyageur", hint: "Marketplace, carte, réservation" },
  { id: "proprietaire", hint: "Biens d'Aminata Diallo" },
  { id: "agence", hint: "Portefeuille Ndar Immobilier" },
  { id: "admin", hint: "Commissions, publicités, gestes" },
];

export function Header() {
  const pathname = usePathname();
  const { state, dispatch } = useAmeena();
  const [openRole, setOpenRole] = useState(false);
  const [openNotes, setOpenNotes] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const notes = state.notifications.filter((note) => visibleNotification(state, note));
  const unread = notes.filter((note) => !note.read).length;

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!roleRef.current?.contains(event.target as Node)) setOpenRole(false);
      if (!noteRef.current?.contains(event.target as Node)) setOpenNotes(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, []);

  const links = [
    { href: "/explorer", label: "Explorer" },
    { href: "/boutiques", label: "Boutiques" },
    { href: "/gestion", label: "Gestion" },
    ...(state.role === "admin" ? [{ href: "/admin", label: "Réglages" }] : []),
  ];

  return (
    <header className="no-print sticky top-0 z-[1100] h-20 border-b border-[#ebebeb] bg-white">
      <div className="flex h-full items-center gap-3 px-4 md:gap-6 md:px-10 xl:px-16">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Ameena, accueil">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1F6F66] text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path fill="currentColor" d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5.2v-5.4h-5.6V21H4a1 1 0 0 1-1-1v-8.8Z" />
            </svg>
          </span>
          <span className="logo-word text-[28px] leading-none text-[#1a1a1a]">Ameena</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  active ? "bg-[#f2f2f2]" : "hover:bg-[#f7f7f7]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <Link href="/publier" className={`${btnGhost} hidden sm:inline-flex`}>
            Publier un bien
          </Link>

          {state.role !== "voyageur" && (
            <div className="relative" ref={noteRef}>
              <button
                className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[#f2f2f2]"
                aria-label="Notifications"
                onClick={() => {
                  setOpenNotes((value) => !value);
                  setOpenRole(false);
                }}
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#c13515] px-1 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {openNotes && (
                <div className="absolute right-0 mt-2 w-[340px] overflow-hidden rounded-2xl border border-[#ebebeb] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="font-semibold">Notifications</p>
                    <button className="text-sm underline" onClick={() => dispatch({ type: "mark-read" })}>
                      Tout lire
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notes.length === 0 && (
                      <p className="px-4 pb-4 text-sm text-[#6a6a6a]">Rien de nouveau sur vos biens.</p>
                    )}
                    {notes.slice(0, 8).map((note) => (
                      <Link
                        key={note.id}
                        href={note.href}
                        onClick={() => setOpenNotes(false)}
                        className={cx("block border-t border-[#f2f2f2] px-4 py-3 hover:bg-[#fafafa]", !note.read && "bg-[#f6fbfa]")}
                      >
                        <p className="text-sm font-medium">{note.title}</p>
                        <p className="mt-1 text-sm leading-5 text-[#6a6a6a]">{note.body}</p>
                        <p className="mt-1 text-xs text-[#8a8a8a]">{formatDateTime(note.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative" ref={roleRef}>
            <button
              className="flex items-center gap-2 rounded-full border border-[#dddddd] py-2 pl-3 pr-2 text-sm font-medium hover:shadow-sm"
              onClick={() => {
                setOpenRole((value) => !value);
                setOpenNotes(false);
              }}
              aria-expanded={openRole}
            >
              <span className="max-w-[140px] truncate">{roleLabel(state.role)}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {openRole && (
              <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-[#ebebeb] bg-white p-2 shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
                <p className="px-3 py-2 text-xs text-[#6a6a6a]">Espace de démonstration</p>
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    className={cx(
                      "block w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#f7f7f7]",
                      state.role === role.id && "bg-[#f7f7f7]",
                    )}
                    onClick={() => {
                      dispatch({ type: "set-role", role: role.id });
                      setOpenRole(false);
                    }}
                  >
                    <span className="block text-sm font-medium">{roleLabel(role.id)}</span>
                    <span className="block text-xs text-[#6a6a6a]">{role.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
