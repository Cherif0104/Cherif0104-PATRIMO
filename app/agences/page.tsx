import Link from "next/link";
import { BadgeCheck, Building2, MessageCircle, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "Inscrire une agence immobilière",
  description: "Rejoignez Se Loger au Sénégal comme agence immobilière vérifiée.",
};

const whatsapp = "https://wa.me/221788324069?text=Bonjour%2C%20je%20souhaite%20inscrire%20mon%20agence%20sur%20Se%20Loger%20au%20S%C3%A9n%C3%A9gal.";

export default function AgenciesPage() {
  return (
    <main className="bg-[#FFFDF7] px-4 py-12 md:px-10 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-[#FF4845]">Service commercial · Impulcia Afrique</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-.045em] text-[#182A39] md:text-6xl">Votre agence, vérifiée et opérationnelle.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f6870]">Les agences ne créent pas leur accès en libre-service. Le service commercial Impulcia Afrique contrôle l’existence légale, les mandats et les responsables avant d’ouvrir le panel de gestion.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#16836f] px-5 py-3 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4" /> WhatsApp : +221 78 832 40 69
            </a>
            <Link href="/connexion" className="inline-flex items-center rounded-full border border-[#d7d7d7] bg-white px-5 py-3 text-sm font-semibold">Accéder à un compte activé</Link>
          </div>
        </div>
        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <Step icon={<Building2 />} title="Contrôle de l’agence" text="RCCM, NINEA, identité du responsable et coordonnées professionnelles." />
          <Step icon={<ShieldCheck />} title="Contrôle des mandats" text="Lien avec le propriétaire, mandat de gestion et pièces du bien restent privés." />
          <Step icon={<Users />} title="Ouverture de l’équipe" text="Un responsable invite ensuite managers et agents avec des droits maîtrisés." />
        </section>
        <div className="mt-10 rounded-[28px] border border-[#eee2cf] bg-white p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-xl font-bold text-[#182A39]"><BadgeCheck className="h-5 w-5 text-[#FF4845]" /> Ce que le panel agence centralise</h2>
          <ul className="mt-5 grid gap-3 text-sm text-[#5f6870] sm:grid-cols-2">
            <li>Biens, propriétaires et mandats</li>
            <li>Locations courte et longue durée</li>
            <li>Contrats, états des lieux et incidents</li>
            <li>Équipe, finances et rendement du parc</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-[24px] border border-[#eee2cf] bg-white p-5">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF1EE] text-[#FF4845]">{icon}</span>
      <h2 className="mt-4 font-bold text-[#182A39]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">{text}</p>
    </article>
  );
}
