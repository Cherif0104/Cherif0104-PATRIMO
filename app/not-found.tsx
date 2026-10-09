import Link from "next/link";
import { btnPrimary } from "@/lib/format";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-sm font-semibold text-[#FF385C]">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Page introuvable</h1>
      <p className="mt-3 text-sm text-[#6a6a6a]">Le contenu a été déplacé, retiré ou n’est pas encore publié.</p>
      <Link href="/" className={`${btnPrimary} mt-6`}>Retour à l’accueil</Link>
    </main>
  );
}
