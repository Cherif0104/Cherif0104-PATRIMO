"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, FileText, Heart, Home, LayoutDashboard, MessageSquare, PlusCircle, Search, UserRound, Wrench } from "lucide-react";
import { cx } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useAuth } from "@/lib/auth";
import { useAmeena } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = usePreferences();
  const { user, profile, loading } = useAuth();
  const { state } = useAmeena();
  if (pathname.startsWith("/gestion") || pathname.startsWith("/admin") || pathname.startsWith("/logements/")) return null;
  const hasActiveIndividualListing = state.listings.some((listing) =>
    listing.ownerUserId === user?.id
    && !listing.organizationId
    && listing.publicationStatus !== "archived");

  const publicItems = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" },
    { href: "/explorer", label: "Explorer", icon: Search, active: pathname.startsWith("/explorer") || pathname.startsWith("/logements") },
    { href: "/services", label: "Services", icon: Wrench, active: pathname.startsWith("/services") },
    { href: "/publier", label: "Publier", icon: PlusCircle, active: pathname.startsWith("/publier") },
    { href: "/connexion", label: "Connexion", icon: UserRound, active: pathname.startsWith("/connexion") },
  ];
  const travelerItems = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" || pathname.startsWith("/explorer") },
    { href: "/favoris", label: t("favorites"), icon: Heart, active: pathname.startsWith("/favoris") },
    { href: "/voyages", label: "Dossiers", icon: FileText, active: pathname.startsWith("/voyages") },
    { href: "/messages", label: t("messages"), icon: MessageSquare, active: pathname.startsWith("/messages") },
    { href: "/compte", label: t("profile"), icon: UserRound, active: pathname.startsWith("/compte") },
  ];
  const ownerItems = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" || pathname.startsWith("/explorer") },
    {
      href: hasActiveIndividualListing
        ? "/gestion/biens"
        : profile?.identity_status === "verifie" ? "/publier" : "/compte#certification",
      label: hasActiveIndividualListing
        ? "Mon bien"
        : profile?.identity_status === "verifie" ? "Publier" : "Activer",
      icon: hasActiveIndividualListing ? Building2 : PlusCircle,
      active: pathname.startsWith("/publier") || (hasActiveIndividualListing && pathname.startsWith("/gestion/biens")),
    },
    { href: "/explorer", label: "Explorer", icon: Search, active: pathname.startsWith("/explorer") },
    { href: "/messages", label: t("messages"), icon: MessageSquare, active: pathname.startsWith("/messages") },
    { href: "/compte", label: t("profile"), icon: UserRound, active: pathname.startsWith("/compte") },
  ];
  const agencyItems = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" },
    { href: "/gestion", label: "Pilotage", icon: LayoutDashboard, active: pathname === "/gestion" },
    { href: "/publier", label: "Publier", icon: PlusCircle, active: pathname.startsWith("/publier") },
    { href: "/gestion/biens", label: "Parc", icon: Building2, active: pathname.startsWith("/gestion/biens") },
    { href: "/compte", label: t("profile"), icon: UserRound, active: pathname.startsWith("/compte") },
  ];
  const publisherIntent = profile?.account_type === "proprietaire"
    || profile?.requested_account_type === "proprietaire";
  const items = !loading && user
    ? profile?.account_type === "agence"
      ? agencyItems
      : publisherIntent
        ? ownerItems
        : travelerItems
    : publicItems;

  return (
    <nav className="app-surface theme-border fixed inset-x-0 bottom-0 z-[1200] border-t border-[#e5e5e5] lg:hidden" aria-label="Navigation principale">
      <ul className="grid h-[68px] grid-cols-5 px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link href={item.href} className="flex min-h-12 flex-col items-center justify-center gap-1 py-1">
                <Icon className={cx("h-[23px] w-[23px]", item.active ? "text-[#FF4845]" : "theme-muted text-[#6a6a6a]")} strokeWidth={item.active ? 2.35 : 1.75} />
                <span className={cx("text-[10px] leading-tight", item.active ? "font-semibold text-[#FF4845]" : "theme-muted text-[#6a6a6a]")}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
