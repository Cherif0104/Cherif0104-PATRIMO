"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AppInstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    const media = window.matchMedia("(display-mode: standalone)");
    const syncInstalled = () => setInstalled(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    syncInstalled();
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", syncInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", syncInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!prompt) {
      setHelpOpen(true);
      return;
    }
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <div className="no-print fixed bottom-[82px] right-3 z-[1250] lg:bottom-6 lg:right-6">
      {helpOpen && (
        <div className="theme-border app-card mb-2 w-[min(320px,calc(100vw-24px))] rounded-2xl border border-[#e5e5e5] p-4 shadow-xl">
          <button className="float-right grid h-7 w-7 place-items-center rounded-full hover:bg-[#f2f2f2]" onClick={() => setHelpOpen(false)} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
          <p className="pr-8 text-sm font-semibold">Installer l’application</p>
          <p className="mt-2 text-sm leading-5 text-[#6a6a6a]">
            {isIos
              ? "Touchez Partager, puis « Sur l’écran d’accueil »."
              : "Ouvrez le menu du navigateur puis choisissez « Installer l’application »."}
          </p>
        </div>
      )}
      <button
        onClick={() => void install()}
        className="flex items-center gap-2 rounded-full bg-[#182A39] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(24,42,57,.28)] transition hover:-translate-y-0.5"
      >
        {isIos && !prompt ? <Share2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        <span className="hidden sm:inline">Télécharger l’app</span>
        <span className="sm:hidden">Installer</span>
      </button>
    </div>
  );
}
