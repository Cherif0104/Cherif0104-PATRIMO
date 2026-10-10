"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Heart, Home, MessageSquare, UserRound } from "lucide-react";
import { cx } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = usePreferences();
  if (pathname.startsWith("/gestion") || pathname.startsWith("/admin") || pathname.startsWith("/logements/")) return null;

  const items = [
    { href: "/", label: "Accueil", icon: Home, active: pathname === "/" || pathname.startsWith("/explorer") || pathname.startsWith("/logements") },
    { href: "/favoris", label: t("favorites"), icon: Heart, active: pathname.startsWith("/favoris") },
    { href: "/voyages", label: "Dossiers", icon: FileText, active: pathname.startsWith("/voyages") },
    { href: "/messages", label: t("messages"), icon: MessageSquare, active: pathname.startsWith("/messages") },
    { href: "/compte", label: t("profile"), icon: UserRound, active: pathname.startsWith("/compte") || pathname.startsWith("/connexion") },
  ];

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
