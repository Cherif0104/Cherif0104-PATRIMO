# Exploitation de Se Loger au Sénégal

Ce document sépare les fonctions livrées des décisions ou secrets qui doivent être fournis par l’exploitant. Aucun paiement, e-mail ou document juridique ne doit être présenté comme actif avant validation de cette liste.

## 1. Variables obligatoires

### Application et Supabase

- `NEXT_PUBLIC_APP_URL` : domaine canonique HTTPS.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` : serveur uniquement.
- `APP_URL` : même origine canonique que l’application.
- `NEXT_PUBLIC_ENABLE_DEMO_DATA=false`

### PayDunya

- `PAYDUNYA_MODE=sandbox` pendant la recette.
- `PAYDUNYA_MASTER_KEY`
- `PAYDUNYA_PRIVATE_KEY`
- `PAYDUNYA_TOKEN`

Le passage à `live` est interdit tant que les scénarios de recette ci-dessous ne sont pas validés.

### E-mails

- `RESEND_API_KEY`
- `TRANSACTIONAL_EMAIL_FROM` sur un domaine vérifié.
- `CRON_SECRET` généré aléatoirement.

Configurer un ordonnanceur compatible avec le plan d’hébergement pour appeler
`GET /api/jobs/transactional-email` toutes les cinq minutes avec l’en-tête
`Authorization: Bearer <CRON_SECRET>`. Le plan Vercel actuellement lié au projet
refuse les crons sous-journaliers : utiliser Vercel Pro ou un ordonnanceur externe
avant l’ouverture. La file `email_outbox` conserve les tentatives et permet cinq
reprises avec délai progressif.

## 2. Contrôles de mise en service

`GET /api/health` expose uniquement l’état technique, jamais les secrets :

- `database`
- `payments`
- `transactionalEmail`

L’état `degraded` interdit l’ouverture commerciale payante. La CI doit être verte sur `main`.

## 3. Recette PayDunya obligatoire

Tester en sandbox, avec une demande et une annonce réelles :

1. paiement accepté ;
2. paiement refusé ;
3. abandon du checkout ;
4. expiration du délai de paiement ;
5. double clic sur « Payer » ;
6. double webhook ;
7. webhook avec signature incorrecte ;
8. montant PayDunya différent du registre ;
9. coupure réseau après création de la commande ;
10. réconciliation entre `payment_orders`, `payment_webhook_inbox`, `ledger_transactions` et la réservation.

Le webhook doit confirmer la transaction auprès de PayDunya avant de marquer une commande payée.

## 4. Catalogue et vérification

- La production ne charge aucune donnée de démonstration.
- Une annonce particulière reste limitée à un bien actif.
- Une annonce est publique uniquement après contrôle administrateur.
- Les pièces KYC restent dans le bucket privé `verification-documents`.
- Documenter qui contrôle les dossiers, les motifs de refus et la durée de conservation.

## 5. Contrats

- Le propriétaire prépare puis envoie la fiche contractuelle.
- Le locataire télécharge le PDF et accepte la version `contract-summary-v1`.
- L’acceptation est horodatée côté base.
- Le propriétaire ne peut pas se substituer au locataire pour marquer le contrat signé.
- Le PDF généré est une synthèse ; les clauses définitives et annexes doivent être validées par un juriste.

## 6. Sauvegardes et restauration

À configurer dans Supabase Pro :

- PITR selon la rétention contractuelle choisie ;
- export périodique chiffré ;
- responsables autorisés à restaurer ;
- exercice de restauration documenté sur un environnement isolé ;
- vérification des buckets Storage et des données Auth, qui ne se restaurent pas nécessairement de la même façon que les tables.

Une sauvegarde non restaurée lors d’un exercice n’est pas considérée comme validée.

## 7. Sécurité

- Activer la détection des mots de passe compromis dans Supabase Auth.
- Attribuer le rôle admin uniquement via `app_metadata` côté serveur.
- Activer MFA pour les administrateurs dès que l’organisation le permet.
- Ne jamais exposer la clé `service_role`.
- Examiner les journaux des routes paiement et e-mail.
- Conserver les limites d’API et compléter par le WAF/rate limiting de l’hébergeur pour une protection distribuée.

## 8. Juridique à fournir

Avant ouverture commerciale, remplacer les mentions provisoires avec les informations validées :

- raison sociale et forme juridique ;
- adresse et immatriculation ;
- responsable de publication ;
- responsable du traitement des données et canal d’exercice des droits ;
- durées de conservation ;
- commissions, annulations et remboursements ;
- conditions de reversement aux propriétaires ;
- médiation et juridiction compétente ;
- obligations locales applicables à l’immobilier, aux paiements et à la protection des données.

Ces informations ne doivent pas être inventées par l’équipe technique.

## 9. Domaine et distribution

- Configurer le domaine canonique dans Vercel, Supabase Auth et PayDunya.
- Vérifier SPF, DKIM et DMARC du domaine d’envoi.
- La version actuelle est une PWA installable.
- Une publication App Store ou Play Store exige un projet natif, les comptes développeur, les politiques stores et les éléments de conformité ; elle n’est pas simulée par la page de téléchargement.

## 10. Seuil d’ouverture

L’ouverture commerciale exige :

- `/api/health` à `ok` ;
- au moins un catalogue réel contrôlé ;
- les documents juridiques finalisés ;
- les dix scénarios PayDunya validés ;
- un test client, propriétaire et administrateur ;
- un canal support opérationnel ;
- une procédure de remboursement et de reversement validée ;
- une restauration de sauvegarde testée.
# Exploitation de production

## Conditions d’ouverture commerciale

- Domaine vérifié et `APP_URL` configuré en HTTPS.
- URL de production ajoutée aux redirections autorisées dans Supabase Auth.
- `SUPABASE_SERVICE_ROLE_KEY` configurée uniquement dans les variables serveur.
- Compte PayDunya marchand validé, clés live configurées et webhook HTTPS testé.
- Entité juridique, CGU, politique de confidentialité et procédure de remboursement validées.
- Protection contre les mots de passe compromis activée dans Supabase Auth.
- Pare-feu applicatif activé chez l’hébergeur pour `/api/geocode` et `/api/payments/*`.

Ne jamais ajouter une clé secrète dans Git ou dans une variable préfixée `NEXT_PUBLIC_`.

## Contrôles quotidiens

1. Vérifier les erreurs HTTP 5xx et les événements JSON `payment.*` dans les logs Vercel.
2. Contrôler les webhooks en échec :

```sql
select event_id, event_type, attempts, last_error, received_at
from public.payment_webhook_inbox
where processing_status = 'failed'
order by received_at desc;
```

3. Contrôler les paiements en attente depuis plus de 30 minutes.
4. Vérifier la file des annonces et certifications en attente.

## Expiration des réservations temporaires

Le job `expire-payment-holds` doit être actif chaque minute :

```sql
select jobname, schedule, active
from cron.job
where jobname = 'expire-payment-holds';
```

Exécution de rattrapage, sans confirmer de paiement :

```sql
select public.expire_payment_holds();
```

## Incident de paiement

1. Ne jamais marquer manuellement une commande comme payée.
2. Conserver le webhook original dans `payment_webhook_inbox`.
3. Relire le statut auprès de PayDunya.
4. Relancer uniquement le traitement idempotent avec les références d’origine.
5. Documenter toute correction dans le journal d’incident.

## Sauvegarde et reprise

- Activer les sauvegardes et la restauration à un instant donné du projet Supabase.
- Tester régulièrement une restauration dans un projet isolé.
- Exporter les paramètres Vercel/Supabase dans le coffre-fort de l’organisation.
- Maintenir deux administrateurs nominatifs avec MFA et aucun compte partagé.
