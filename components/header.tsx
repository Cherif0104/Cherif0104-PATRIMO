"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Compass, ConciergeBell, Home, UserRound } from "lucide-react";
import { btnGhost, cx, formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { loadUserNotifications, markNotificationsRead, supabase } from "@/lib/supabase";
import { CompactPreferences } from "@/components/preference-controls";
import { usePreferences } from "@/lib/preferences";
import { useAmeena } from "@/lib/store";
import type { Role, UserNotification } from "@/lib/types";

export function Header() {
  const pathname = usePathname();
  const { state, dispatch } = useAmeena();
  const { user, profile } = useAuth();
  const { t } = usePreferences();
  const [openNotes, setOpenNotes] = useState(false);
  const [notes, setNotes] = useState<UserNotification[]>([]);
  const noteRef = useRef<HTMLDivElement>(null);
  const unread = notes.filter((note) => !note.read_at).length;

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!noteRef.current?.contains(event.target as Node)) setOpenNotes(false);
    }
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, []);

  useEffect(() => {
    if (!user) {
      if (state.role !== "voyageur") dispatch({ type: "set-role", role: "voyageur" });
      return;
    }
    const role: Role =
      user.app_metadata?.role === "admin"
        ? "admin"
        : profile?.account_type === "agence"
          ? "agence"
          : profile?.account_type === "proprietaire"
            ? "proprietaire"
            : "voyageur";
    if (state.role !== role) dispatch({ type: "set-role", role });
  }, [dispatch, profile?.account_type, state.role, user]);

  useEffect(() => {
    if (!user || !supabase) {
      setNotes([]);
      return;
    }
    let active = true;
    loadUserNotifications().then((rows) => {
      if (active) setNotes(rows);
    }).catch(() => {
      if (active) setNotes([]);
    });
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotes((rows) => [payload.new as UserNotification, ...rows].slice(0, 30)),
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  async function readAllNotifications() {
    const ids = notes.filter((note) => !note.read_at).map((note) => note.id);
    await markNotificationsRead(ids);
    const readAt = new Date().toISOString();
    setNotes((rows) => rows.map((note) => note.read_at ? note : { ...note, read_at: readAt }));
  }

  const links = [
    { href: "/explorer", label: t("explore") },
    { href: "/boutiques", label: "Boutiques" },
    { href: "/gestion", label: "Gestion" },
    ...(state.role === "admin" ? [{ href: "/admin", label: "Réglages" }] : []),
  ];

  return (
    <header className="app-surface theme-border no-print sticky top-0 z-[1100] hidden h-20 border-b border-[#ebebeb] lg:block">
      <div className="grid h-full grid-cols-[minmax(190px,1fr)_auto_minmax(190px,1fr)] items-center gap-5 px-6 xl:px-12 2xl:px-16">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Se Loger au Sénégal, accueil">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FF385C] text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path fill="currentColor" d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5.2v-5.4h-5.6V21H4a1 1 0 0 1-1-1v-8.8Z" />
            </svg>
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[18px] font-extrabold tracking-[-0.04em] text-[#1a1a1a]">Se Loger</span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FF385C]">au Sénégal</span>
          </span>
        </Link>

        <nav className="hidden items-end justify-self-center gap-8 xl:flex" aria-label="Offres">
          {[
            {
              href: "/",
              label: t("stays"),
              icon: Home,
              active: pathname === "/" || pathname.startsWith("/logements") || pathname.startsWith("/explorer"),
            },
            {
              href: "/experiences",
              label: t("experiences"),
              icon: Compass,
              active: pathname.startsWith("/experiences"),
            },
            {
              href: "/services",
              label: t("services"),
              icon: ConciergeBell,
              active: pathname.startsWith("/services"),
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
                <Icon className={cx("h-6 w-6", item.active ? "text-[#222]" : "text-[#6a6a6a]")} strokeWidth={item.active ? 2.2 : 1.6} />
                <span
                  className={cx(
                    "border-b-2 pb-0.5 text-xs",
                    item.active ? "border-[#222] font-semibold text-[#222]" : "border-transparent text-[#6a6a6a] hover:text-[#222]",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-self-end gap-1 md:gap-2">
          <nav className="mr-1 hidden items-center gap-1 2xl:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cx(
                    "rounded-full px-3 py-2 text-sm font-medium",
                    active ? "bg-[#f2f2f2]" : "hover:bg-[#f7f7f7]",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <CompactPreferences />
          <Link href="/publier" className={`${btnGhost} hidden sm:inline-flex`}>
            {t("publish")}
          </Link>

          {state.role !== "voyageur" && (
            <div className="relative" ref={noteRef}>
              <button
                className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[#f2f2f2]"
                aria-label="Notifications"
                onClick={() => {
                  setOpenNotes((value) => !value);
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
                    <button className="text-sm underline" onClick={() => void readAllNotifications()}>
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
                        href={note.href || "/compte"}
                        onClick={() => setOpenNotes(false)}
                        className={cx("block border-t border-[#f2f2f2] px-4 py-3 hover:bg-[#fafafa]", !note.read_at && "bg-[#f6fbfa]")}
                      >
                        <p className="text-sm font-medium">{note.title}</p>
                        <p className="mt-1 text-sm leading-5 text-[#6a6a6a]">{note.body}</p>
                        <p className="mt-1 text-xs text-[#8a8a8a]">{formatDateTime(note.created_at)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <Link
              href="/compte"
              className="flex items-center gap-2 rounded-full border border-[#dddddd] py-2 pl-3 pr-2 text-sm font-medium hover:shadow-sm"
              aria-label="Mon compte"
            >
              <span className="hidden max-w-[120px] truncate sm:block">{profile?.full_name || "Mon compte"}</span>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#FF385C] text-[10px] font-semibold text-[#000000]">
                {(profile?.full_name || user.email || "A").slice(0, 1).toUpperCase()}
              </span>
            </Link>
          ) : (
            <Link
              href="/connexion"
              className="flex items-center gap-2 rounded-full border border-[#dddddd] px-3 py-2 text-sm font-medium hover:shadow-sm"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">{t("login")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
