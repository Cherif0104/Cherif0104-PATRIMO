"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, FileText, Heart, Home, MessageSquare, Search, UserRound, Wrench } from "lucide-react";
import { cx } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useAuth } from "@/lib/auth";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = usePreferences();
  const { user, loading } = useAuth();
  if (pathname.startsWith("/gestion") || pathname.startsWith("/admin") || pathname.startsWith("/logements/")) return null;

  const publicItems = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" },
    { href: "/explorer", label: "Explorer", icon: Search, active: pathname.startsWith("/explorer") || pathname.startsWith("/logements") },
    { href: "/services", label: "Services", icon: Wrench, active: pathname.startsWith("/services") },
    { href: "/telecharger", label: "Installer", icon: Download, active: pathname.startsWith("/telecharger") },
    { href: "/connexion", label: "Connexion", icon: UserRound, active: pathname.startsWith("/connexion") },
  ];
  const privateItems = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" || pathname.startsWith("/explorer") },
    { href: "/favoris", label: t("favorites"), icon: Heart, active: pathname.startsWith("/favoris") },
    { href: "/voyages", label: "Dossiers", icon: FileText, active: pathname.startsWith("/voyages") },
    { href: "/messages", label: t("messages"), icon: MessageSquare, active: pathname.startsWith("/messages") },
    { href: "/telecharger", label: "Installer", icon: Download, active: pathname.startsWith("/telecharger") },
    { href: "/compte", label: t("profile"), icon: UserRound, active: pathname.startsWith("/compte") },
  ];
  const items = !loading && user ? privateItems : publicItems;

  return (
    <nav className="app-surface theme-border fixed inset-x-0 bottom-0 z-[1200] border-t border-[#e5e5e5] lg:hidden" aria-label="Navigation principale">
      <ul className={`grid h-[68px] ${items.length === 6 ? "grid-cols-6" : "grid-cols-5"} px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1`}>
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
