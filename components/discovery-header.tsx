"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { cx } from "@/lib/format";

const tabs = [
  { href: "/", label: "Tout voir", key: "all" },
  { href: "/#logements", label: "Logements", key: "stays" },
  { href: "/experiences", label: "Expériences", key: "experiences" },
  { href: "/services", label: "Services", key: "services" },
] as const;

export function DiscoveryHeader({
  active = "all",
}: {
  active?: "all" | "stays" | "experiences" | "services";
}) {
  return (
    <div className="sticky top-0 z-40 bg-white/95 px-4 pb-3 pt-4 backdrop-blur lg:hidden">
      <Link
        href="/explorer"
        className="mx-auto flex h-[62px] max-w-md items-center justify-center gap-3 rounded-full border border-[#dddddd] bg-white px-5 text-[15px] font-semibold shadow-[0_5px_18px_rgba(0,0,0,.14)]"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={2.4} />
        Commencer ma recherche
      </Link>
      <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4" aria-label="Découvrir">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cx(
              "shrink-0 rounded-full border px-5 py-2.5 text-[15px] shadow-sm",
              active === tab.key
                ? "border-[#222] bg-[#f0f0f0] font-semibold text-[#222]"
                : "border-[#e6e6e6] bg-white text-[#333]",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
