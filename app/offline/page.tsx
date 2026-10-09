import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Hors connexion" };

export default function OfflinePage() {
  return (
    <main className="grid min-h-[75dvh] place-items-center bg-[#FFFDF7] px-6 text-center">
      <div className="max-w-sm">
        <Image src="/brand/mark.png" alt="" width={112} height={112} className="mx-auto rounded-[28px]" />
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#182A39]">Vous êtes hors connexion</h1>
        <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
          Les pages déjà consultées restent accessibles. Reconnectez-vous pour actualiser les annonces et vos messages.
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-[#FF4845] px-5 py-3 text-sm font-semibold text-white">
          Réessayer
        </Link>
      </div>
    </main>
  );
}
