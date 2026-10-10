"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function AppInstallButton() {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    const media = window.matchMedia("(display-mode: standalone)");
    const syncInstalled = () => setInstalled(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    syncInstalled();
    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", syncInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", syncInstalled);
    };
  }, []);

  if (installed) return null;

  return (
    <div className="no-print fixed bottom-[82px] right-3 z-[1250] lg:bottom-6 lg:right-6">
      <Link
        href="/telecharger"
        className="flex items-center gap-2 rounded-full bg-[#182A39] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(24,42,57,.28)] transition hover:-translate-y-0.5"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Télécharger l’app</span>
        <span className="sm:hidden">Installer</span>
      </Link>
    </div>
  );
}
