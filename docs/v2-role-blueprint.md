# Socle V2 — profils et responsabilités

La V2 remplace les conditions de rôle dispersées par une seule matrice de capacités
dans `lib/access.ts`. L’interface peut masquer une action pour simplifier le parcours,
mais la protection serveur et les politiques Supabase restent obligatoires.

## Profils

### Visiteur

- consulter le catalogue et les professionnels publiés ;
- rechercher, filtrer et consulter une fiche ;
- créer un compte avant tout enregistrement ou échange privé.

### Client

- conserver des favoris persistants ;
- envoyer une demande de séjour, location, visite ou dossier de vente ;
- utiliser la messagerie ;
- suivre demandes, contrats, paiements et documents.

### Propriétaire en activation

- conserver toutes les capacités client ;
- compléter son profil public ;
- demander la vérification ;
- transmettre identité et justificatifs privés ;
- attendre une décision avant de publier.

### Propriétaire vérifié

- publier et gérer un seul bien actif ;
- confirmer sa disponibilité, gérer calendrier et demandes ;
- communiquer avec les candidats ;
- suivre contrats, finances, incidents et états des lieux.

### Agence en activation

- transmettre les documents de la structure et ses mandats ;
- attendre l’ouverture contrôlée de l’organisation ;
- ne pas accéder au pilotage avant validation.

### Collaborateur d’agence

- accéder uniquement aux domaines attribués ;
- publier uniquement avec le domaine Catalogue et un rôle autre que Lecture seule ;
- ne jamais obtenir implicitement Finance, CRM ou Administration.

### Agence vérifiée

- gérer plusieurs biens, propriétaires et mandats ;
- administrer l’équipe et les domaines fonctionnels ;
- exploiter CRM, réservations, contrats, finances et maintenance.

### Administrateur

- valider profils et annonces ;
- modérer le catalogue et les professionnels ;
- superviser exploitation, finance et support ;
- disposer d’un journal d’audit pour toute opération sensible.

## Capacités centrales

| Domaine | Capacité |
| --- | --- |
| Catalogue | `manage_catalog`, `publish_listing` selon le rôle |
| Réservations | `manage_reservations` |
| CRM | `manage_crm` |
| Contrats | `manage_contracts` |
| Finance | `manage_finance` |
| Maintenance | `manage_maintenance` |
| Administration | `manage_team` |
| Plateforme | `moderate_platform` |

## Règles non négociables

1. Refus par défaut lorsqu’un profil ou un domaine est inconnu.
2. Une action masquée côté interface doit aussi être refusée par le serveur et la RLS.
3. Un compte en attente conserve ses fonctions client, jamais les fonctions de gestion.
4. Un collaborateur ne reçoit que les domaines explicitement attribués.
5. Les données de démonstration restent désactivées en production.
6. Chaque parcours critique doit avoir un test autorisé et un test refusé.

## Ordre de livraison

1. Client et propriétaire particulier.
2. Modération administrative et support.
3. Paiements, contrats, notifications et réconciliation.
4. Agences et collaborateurs.
5. Professionnels partenaires.
6. Charge, reprise après incident et applications mobiles.
