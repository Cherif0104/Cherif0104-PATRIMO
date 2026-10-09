"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Luggage, MessageSquare, Search, UserRound } from "lucide-react";
import { cx } from "@/lib/format";

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/gestion") || pathname.startsWith("/admin") || pathname.startsWith("/logements/")) return null;

  const items = [
    { href: "/", label: "Explorer", icon: Search, active: pathname === "/" || pathname.startsWith("/explorer") || pathname.startsWith("/logements") || pathname.startsWith("/experiences") || pathname.startsWith("/services") },
    { href: "/favoris", label: "Favoris", icon: Heart, active: pathname.startsWith("/favoris") },
    { href: "/voyages", label: "Voyages", icon: Luggage, active: pathname.startsWith("/voyages") },
    { href: "/messages", label: "Messages", icon: MessageSquare, active: pathname.startsWith("/messages") },
    { href: "/compte", label: "Profil", icon: UserRound, active: pathname.startsWith("/compte") || pathname.startsWith("/connexion") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1200] border-t border-[#e5e5e5] bg-white lg:hidden" aria-label="Navigation principale">
      <ul className="grid h-[68px] grid-cols-5 px-1 pb-[max(5px,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link href={item.href} className="flex min-h-12 flex-col items-center justify-center gap-1 py-1">
                <Icon className={cx("h-[23px] w-[23px]", item.active ? "text-[#E21D5A]" : "text-[#6a6a6a]")} strokeWidth={item.active ? 2.35 : 1.75} />
                <span className={cx("text-[10px] leading-tight", item.active ? "font-semibold text-[#E21D5A]" : "text-[#6a6a6a]")}>
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
