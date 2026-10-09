export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <p className="text-sm font-medium text-[#FF385C]">Cadre d’utilisation</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Conditions d’utilisation</h1>
      <p className="mt-4 text-sm text-[#6a6a6a]">Version produit · 9 octobre 2026</p>

      <div className="mt-10 space-y-8 text-[15px] leading-7">
        <Section title="Objet">
          Se Loger au Sénégal met en relation des voyageurs, locataires, propriétaires, agences et prestataires. Une annonce ou une demande ne constitue pas une garantie tant que la réservation et, le cas échéant, le paiement ne sont pas confirmés.
        </Section>
        <Section title="Comptes">
          Chaque membre fournit des informations exactes, protège son accès et signale toute utilisation non autorisée. Les comptes, annonces ou messages frauduleux peuvent être suspendus.
        </Section>
        <Section title="Annonces et certification">
          Les éditeurs restent responsables de l’exactitude, de la disponibilité et de la légalité de leurs offres. La certification indique qu’un contrôle documentaire a été effectué ; elle ne garantit pas la qualité future d’un séjour ou d’une location.
        </Section>
        <Section title="Demandes, paiements et annulations">
          Les montants et commissions sont présentés avant paiement. Les conditions précises d’annulation, de remboursement et de reversement affichées dans le dossier de réservation prévalent pour la transaction concernée.
        </Section>
        <Section title="Contacts externes">
          Un numéro WhatsApp n’est affiché que lorsque son titulaire l’autorise. Les échanges poursuivis hors de la plateforme ne bénéficient pas du même historique ni des mêmes contrôles.
        </Section>
        <Section title="Informations légales à finaliser">
          La raison sociale, l’adresse, le numéro d’immatriculation, le responsable de publication et le médiateur compétent doivent être complétés par l’entité exploitante avant l’ouverture commerciale.
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-[#444]">{children}</p>
    </section>
  );
}
