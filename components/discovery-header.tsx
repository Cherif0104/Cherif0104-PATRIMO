"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { cx } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";

const tabs = [
  { href: "/", labelKey: "all", key: "all" },
  { href: "/#logements", labelKey: "stays", key: "stays" },
  { href: "/experiences", labelKey: "experiences", key: "experiences" },
  { href: "/services", labelKey: "services", key: "services" },
] as const;

export function DiscoveryHeader({
  active = "all",
}: {
  active?: "all" | "stays" | "experiences" | "services";
}) {
  const { t } = usePreferences();
  return (
    <div className="app-surface sticky top-0 z-40 px-4 pb-3 pt-4 lg:hidden">
      <Link
        href="/explorer"
        className="app-card theme-border mx-auto flex h-[62px] max-w-md items-center justify-center gap-3 rounded-full border border-[#dddddd] px-5 text-[15px] font-semibold shadow-[0_5px_18px_rgba(0,0,0,.14)]"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={2.4} />
        {t("search")}
      </Link>
      <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4" aria-label="Découvrir">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={cx(
              "shrink-0 rounded-full border px-5 py-2.5 text-[15px] shadow-sm",
              active === tab.key
                ? "border-[#C7A05A] bg-[#f7f0e2] font-semibold text-[#151515]"
                : "theme-border app-card border-[#e6e6e6]",
            )}
          >
            {t(tab.labelKey)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
