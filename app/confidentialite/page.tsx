export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-8">
      <p className="text-sm font-medium text-[#1F6F66]">Données personnelles</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Politique de confidentialité</h1>
      <p className="mt-4 text-sm text-[#6a6a6a]">Version produit · 7 octobre 2026</p>

      <div className="mt-10 space-y-8 text-[15px] leading-7">
        <Section title="Données utilisées">
          Ameena traite les coordonnées du compte, le type de profil, les annonces et photos envoyées, les demandes de réservation, les dates, les montants calculés, ainsi que les dossiers de gestion créés par un utilisateur autorisé.
        </Section>
        <Section title="Pourquoi">
          Ces données servent à authentifier les utilisateurs, attribuer un bien à son responsable, traiter une demande, éviter les conflits de calendrier, établir l’historique de gestion et prévenir les abus.
        </Section>
        <Section title="Accès">
          Les données privées sont protégées par des politiques au niveau de la base. Un voyageur retrouve ses demandes. Un propriétaire ou un membre d’agence retrouve les dossiers de son portefeuille. Une annonce publiée reste visible publiquement.
        </Section>
        <Section title="Photos">
          Les médias d’annonce sont publics après publication. Ne transmettez ni pièce d’identité, ni document bancaire, ni information sensible dans les photos d’un logement.
        </Section>
        <Section title="Conservation et droits">
          Les durées légales définitives, l’identité du responsable de traitement et le canal formel d’exercice des droits doivent être complétés avec l’entité juridique qui exploitera Ameena avant l’ouverture commerciale.
        </Section>
        <Section title="Paiement">
          Aucun paiement n’est actuellement débité dans l’interface. Lors de l’activation commerciale, le prestataire de paiement et ses propres traitements seront indiqués ici.
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
