# Ameena

Marketplace immobilière et outil de gestion. Séjours, locations longue durée, expériences, services, commissions réglables, finances, incidents et états des lieux.

```bash
npm install
npm run dev
```

## Socle de production

- Supabase Auth : inscription, connexion, session et profil.
- RLS : un voyageur ne lit que ses demandes ; un propriétaire ou une agence ne lit que son portefeuille.
- Annonces : brouillon / validation / publication. Le navigateur ne peut pas s’auto-publier.
- Médias : bucket `listing-media`, 10 Mo maximum, formats image contrôlés, dossier attribué à l’utilisateur.
- Réservations : demande privée avec instantané du devis.
- Disponibilités : confirmation atomique et contrainte d’exclusion pour empêcher deux réservations sur les mêmes dates.
- Paiements : registre sécurisé prévu pour Wave, Orange Money, carte ou manuel. La création et la validation restent réservées au backend de paiement.

Le changement de rôle de la démonstration a été retiré. Les accès affichés dépendent maintenant du compte authentifié.

Le projet Supabase dédié est **Ameena** (`https://isqcndswkzlfjangjcpv.supabase.co`, région Paris). Copiez `.env.example` vers `.env.local` et renseignez l’URL et la clé publiable. Sans ces variables, l’authentification et les écritures de marché sont désactivées ; le catalogue d’exemple reste consultable.

Les exemples de catalogue restent locaux pour la démonstration. Les nouvelles annonces et demandes passent par les tables normalisées de Supabase. L’ancien document public `ameena_state` a été supprimé.

## Avant l’ouverture commerciale

La plateforme ne simule jamais un débit. Il reste à fournir les identifiants du prestataire de paiement et ses webhooks, l’entité juridique exploitante, les mentions légales, les CGU/CGV finalisées et le canal de vérification d’identité. Ces données ne doivent pas être inventées dans le code.
