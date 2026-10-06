# Ameena

Marketplace immobilière et outil de gestion. Séjours, locations longue durée, commissions réglables, publicités partenaires, finances, incidents et états des lieux.

```bash
npm install
npm run dev
```

Ouvrez l’accueil, puis changez d’espace dans l’en-tête : voyageur, propriétaire (Aminata Diallo), agence (Ndar Immobilier) ou administration.

Le projet Supabase dédié est **Ameena** (`https://isqcndswkzlfjangjcpv.supabase.co`, région Paris). Copiez `.env.example` vers `.env.local` et renseignez l’URL et la clé publiable. Sans ces variables, les données restent dans le navigateur. Avec elles, l’état de la plateforme est enregistré dans la table `ameena_state`.
