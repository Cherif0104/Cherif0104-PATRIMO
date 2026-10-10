import { Apple, Download, Laptop, MonitorDown, Smartphone } from "lucide-react";
import { InstallAppCard } from "@/components/install-app-card";

export const metadata = {
  title: "Télécharger l’application",
  description: "Installez Se Loger au Sénégal sur Android, iPhone, Windows, macOS ou Linux.",
};

const platforms = [
  {
    icon: Smartphone,
    title: "Android",
    label: "Chrome ou Edge",
    steps: "Ouvrez cette page, touchez Installer, puis confirmez. L’application rejoint votre écran d’accueil.",
  },
  {
    icon: Apple,
    title: "iPhone & iPad",
    label: "Safari",
    steps: "Touchez Partager, choisissez « Sur l’écran d’accueil », puis « Ajouter ».",
  },
  {
    icon: MonitorDown,
    title: "Windows",
    label: "Chrome ou Edge",
    steps: "Cliquez sur Installer dans la barre d’adresse ou utilisez le bouton proposé sur cette page.",
  },
  {
    icon: Laptop,
    title: "macOS & Linux",
    label: "Chrome ou Edge",
    steps: "Ouvrez le menu du navigateur et choisissez « Installer Se Loger au Sénégal ».",
  },
];

export default function DownloadPage() {
  return (
    <main className="app-surface mobile-page">
      <section className="section-champagne px-4 py-12 md:px-10 lg:py-16 xl:px-16">
        <div className="mx-auto max-w-5xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#182A39] text-white shadow-lg">
            <Download className="h-6 w-6" />
          </span>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[.14em] text-[#C13515]">Application installable</p>
          <h1 className="premium-title mx-auto mt-2 max-w-3xl text-4xl md:text-5xl">
            Votre immobilier sénégalais, toujours à portée de main.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6a6a6a]">
            Retrouvez vos recherches, dossiers, messages et espaces de gestion dans une application rapide,
            sécurisée et utilisable sur mobile comme sur ordinateur.
          </p>
        </div>
      </section>

      <section className="section-ivory px-4 py-10 md:px-10 xl:px-16">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <InstallAppCard />
          <div className="rounded-[28px] border border-[#eadfcb] bg-white p-6">
            <h2 className="text-xl font-semibold">Une installation, sans magasin d’applications</h2>
            <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">
              Se Loger au Sénégal est une application web progressive. Elle s’installe depuis votre navigateur,
              se met à jour automatiquement et ne télécharge aucun exécutable non vérifié.
            </p>
            <ul className="mt-5 grid gap-3 text-sm">
              <li>✓ Icône sur l’écran d’accueil ou le bureau</li>
              <li>✓ Ouverture plein écran comme une application</li>
              <li>✓ Pages déjà consultées disponibles hors connexion</li>
              <li>✓ Même compte et mêmes données sur tous vos appareils</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-pearl px-4 py-12 md:px-10 xl:px-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="premium-title text-2xl md:text-3xl">Choisissez votre appareil</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {platforms.map(({ icon: Icon, title, label, steps }) => (
              <article key={title} className="rounded-[24px] border border-[#ebebeb] bg-white p-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF1EE] text-[#C13515]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[.1em] text-[#6a6a6a]">{label}</p>
                <p className="mt-3 text-sm leading-6 text-[#6a6a6a]">{steps}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
