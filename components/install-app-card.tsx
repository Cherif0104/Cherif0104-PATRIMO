"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { btnPrimary } from "@/lib/format";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppCard() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <section className="rounded-[24px] border border-[#e5e5e5] bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,.07)]">
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1f3] text-[#C13515]">
          <Smartphone className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-semibold">Installer Se Loger au Sénégal</h2>
          <p className="mt-1 text-sm leading-5 text-[#6a6a6a]">
            Accédez à vos voyages comme dans une application Android ou iOS.
          </p>
        </div>
      </div>
      {prompt && (
        <button className={`${btnPrimary} mt-4 w-full`} onClick={() => void install()}>
          <Download className="h-4 w-4" /> Télécharger l’application
        </button>
      )}
      {!prompt && isIos && (
        <p className="mt-4 rounded-2xl bg-[#f7f7f7] p-3 text-sm">
          Sur iPhone : ouvrez le menu Partager, puis choisissez « Sur l’écran d’accueil ».
        </p>
      )}
      {!prompt && !isIos && (
        <p className="mt-4 text-xs text-[#6a6a6a]">Utilisez le menu du navigateur puis « Installer l’application » si le bouton n’apparaît pas.</p>
      )}
    </section>
  );
}
