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
      <Link href="/" className="mb-3 flex items-center gap-2.5" aria-label="Se Loger au Sénégal, accueil">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#FF385C] text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path fill="currentColor" d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5.2v-5.4h-5.6V21H4a1 1 0 0 1-1-1v-8.8Z" />
          </svg>
        </span>
        <span>
          <span className="block text-[17px] font-extrabold leading-none tracking-[-0.04em]">Se Loger</span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.15em] text-[#FF385C]">au Sénégal</span>
        </span>
      </Link>
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
                ? "border-[#FF385C] bg-[#fff1f3] font-semibold text-[#000000]"
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
