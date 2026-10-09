import { BadgeCheck, Headphones, ReceiptText, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: BadgeCheck,
    title: "Hôtes contrôlés",
    text: "Une annonce réelle passe en validation avant sa publication.",
  },
  {
    icon: ReceiptText,
    title: "Prix détaillé",
    text: "Avance, commission et bénéficiaire sont visibles avant la demande.",
  },
  {
    icon: ShieldCheck,
    title: "Données privées",
    text: "Chaque compte ne voit que ses demandes et son portefeuille.",
  },
  {
    icon: Headphones,
    title: "Suivi local",
    text: "Incident, entrée et sortie restent attachés au dossier du bien.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-[#ebebeb] bg-[#fafafa] px-4 py-7 md:px-10 xl:px-16" aria-label="Engagements Se Loger au Sénégal">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e7f4f2] text-[#1F6F66]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="mt-1 text-xs leading-5 text-[#6a6a6a]">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
