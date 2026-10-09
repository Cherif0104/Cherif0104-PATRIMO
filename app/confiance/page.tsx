import { BadgeCheck, CalendarCheck, CreditCard, Database, FileCheck2, ShieldCheck } from "lucide-react";

const blocks = [
  {
    icon: BadgeCheck,
    title: "Annonce contrôlée avant publication",
    text: "Un propriétaire peut préparer son bien, mais il ne peut pas le rendre public lui-même. Le statut publié relève d’un contrôle Se Loger au Sénégal.",
  },
  {
    icon: ShieldCheck,
    title: "Accès cloisonnés",
    text: "Les politiques de sécurité de la base vérifient l’identité à chaque lecture et écriture. Changer l’interface ne donne aucun droit supplémentaire.",
  },
  {
    icon: CalendarCheck,
    title: "Dates protégées",
    text: "La confirmation et le blocage du calendrier sont atomiques. En cas de conflit, la seconde réservation est refusée.",
  },
  {
    icon: Database,
    title: "Dossiers séparés",
    text: "Profils, annonces, demandes, disponibilités et paiements ont leurs propres tables et règles d’accès.",
  },
  {
    icon: CreditCard,
    title: "Aucun faux paiement",
    text: "La demande n’effectue aucun débit. Wave, Orange Money et carte ne seront affichés comme actifs qu’après branchement d’un prestataire et vérification des webhooks.",
  },
  {
    icon: FileCheck2,
    title: "Preuves de gestion",
    text: "Les incidents, photos et états des lieux restent rattachés au bien pour constituer un historique exploitable par les parties.",
  },
];

export default function TrustPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-8">
      <p className="text-sm font-medium text-[#1F6F66]">Centre de confiance</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">Ce qu’Se Loger au Sénégal protège, et ce qu’elle ne prétend pas encore faire.</h1>
      <p className="mt-5 max-w-3xl text-[16px] leading-7 text-[#6a6a6a]">
        La confiance ne vient pas d’un badge décoratif. Elle vient d’un contrôle d’identité, de règles d’accès, d’un calendrier cohérent et d’un paiement traçable.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <article key={block.title} className="rounded-[20px] border border-[#e5e5e5] p-6">
              <Icon className="h-6 w-6 text-[#1F6F66]" />
              <h2 className="mt-4 text-lg font-semibold">{block.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6a6a6a]">{block.text}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
