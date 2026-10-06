"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

function Frame() {
  return <div className="h-full w-full animate-pulse bg-[#f3f3f3]" />;
}

export const MapView = dynamic(() => import("./map-inner").then((mod) => mod.MapView), {
  ssr: false,
  loading: Frame,
});

export const PickMap = dynamic(() => import("./map-inner").then((mod) => mod.PickMap), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl bg-[#f3f3f3]" />,
});

export type { Listing };
