"use client";

import Image from "next/image";
import Link from "next/link";
import { cx } from "@/lib/format";

export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cx("flex min-w-0 items-center gap-2.5", className)}
      aria-label="Se Loger au Sénégal, accueil"
    >
      <Image
        src="/brand/mark.png"
        alt=""
        width={44}
        height={44}
        priority
        className={cx("shrink-0 rounded-[13px]", compact ? "h-9 w-9" : "h-11 w-11")}
      />
      <span className="min-w-0 leading-none">
        <span className={cx("block truncate font-extrabold tracking-[-0.045em] text-[#182A39]", compact ? "text-[17px]" : "text-[18px]")}>
          Se Loger
        </span>
        <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF4845]">
          au Sénégal
        </span>
      </span>
    </Link>
  );
}
