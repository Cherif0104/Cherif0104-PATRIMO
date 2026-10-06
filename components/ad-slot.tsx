"use client";

import Link from "next/link";
import { Photo } from "./photo";
import { useAmeena } from "@/lib/store";
import type { AdPlacement } from "@/lib/types";

export function AdSlot({ placement, compact = false }: { placement: AdPlacement; compact?: boolean }) {
  const { state } = useAmeena();
  const ad = state.settings.ads.find((item) => item.active && item.placement === placement);
  if (!ad) return null;
  const inner = (
    <>
      <div className={compact ? "relative h-24 w-28 shrink-0" : "relative min-h-40 md:h-full"}>
        <Photo src={ad.image} alt="" sizes="320px" />
      </div>
      <div className={compact ? "py-3 pr-4" : "flex flex-col justify-center p-5 md:p-7"}>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#6a6a6a]">Partenaire · {ad.partner}</p>
        <p className={compact ? "mt-1 text-sm font-semibold" : "mt-2 text-xl font-semibold tracking-tight"}>{ad.title}</p>
        {!compact && <p className="mt-2 max-w-xl text-sm leading-6 text-[#6a6a6a]">{ad.subtitle}</p>}
        {ad.offer && <p className="mt-3 text-sm font-medium">{ad.offer}</p>}
      </div>
    </>
  );
  const className = compact
    ? "flex gap-4 overflow-hidden rounded-2xl border border-[#ebebeb] bg-white"
    : "grid overflow-hidden rounded-3xl border border-[#ebebeb] bg-white md:grid-cols-[280px_1fr]";
  if (ad.href.startsWith("/")) {
    return (
      <Link href={ad.href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={ad.href} className={className} target="_blank" rel="noreferrer">
      {inner}
    </a>
  );
}
