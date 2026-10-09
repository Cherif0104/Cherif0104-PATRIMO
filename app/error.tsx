"use client";

import Link from "next/link";
import { useEffect } from "react";
import { btnPrimary, btnSecondary } from "@/lib/format";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(JSON.stringify({ event: "ui.route_error", message: error.message, digest: error.digest }));
  }, [error]);
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Cette page a rencontré un problème</h1>
      <p className="mt-3 text-sm text-[#6a6a6a]">Réessayez. Si le problème persiste, la référence technique permet à l’équipe de le retrouver.</p>
      {error.digest && <p className="mt-2 text-xs text-[#8a8a8a]">Référence : {error.digest}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <button className={btnPrimary} onClick={reset}>Réessayer</button>
        <Link href="/" className={btnSecondary}>Accueil</Link>
      </div>
    </main>
  );
}
