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
