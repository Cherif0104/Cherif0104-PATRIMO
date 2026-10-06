"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, ConciergeBell, Home, Map, UserRound } from "lucide-react";
import { cx } from "@/lib/format";
import { useAmeena } from "@/lib/store";

export function BottomNav() {
  const pathname = usePathname();
  const { state } = useAmeena();
  if (pathname.startsWith("/gestion") || pathname.startsWith("/admin")) return null;

  const spaceHref = state.role === "voyageur" ? "/publier" : "/gestion";
  const spaceLabel = state.role === "voyageur" ? "Publier" : "Gestion";

  const items = [
    { href: "/", label: "Logements", icon: Home, active: pathname === "/" || pathname.startsWith("/logements") },
    { href: "/experiences", label: "Expériences", icon: Compass, active: pathname.startsWith("/experiences") },
    { href: "/services", label: "Services", icon: ConciergeBell, active: pathname.startsWith("/services") },
    { href: "/explorer", label: "Carte", icon: Map, active: pathname.startsWith("/explorer") },
    { href: spaceHref, label: spaceLabel, icon: UserRound, active: pathname.startsWith(spaceHref) },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[450] border-t border-[#ebebeb] bg-white/95 backdrop-blur lg:hidden" aria-label="Navigation principale">
      <ul className="grid grid-cols-5 px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link href={item.href} className="flex flex-col items-center gap-0.5 py-1.5">
                <Icon className={cx("h-5 w-5", item.active ? "text-[#222]" : "text-[#6a6a6a]")} strokeWidth={item.active ? 2.25 : 1.75} />
                <span className={cx("text-[10px] leading-tight", item.active ? "font-semibold text-[#222]" : "text-[#6a6a6a]")}>
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
