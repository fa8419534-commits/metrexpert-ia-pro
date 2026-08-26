# Paiement mobile et automatisation

## Situation actuelle

MÉTREXPERT IA PRO accepte actuellement un paiement manuel : le client choisit un forfait, effectue un transfert Mobile Money vers le compte de Daouda, envoie la référence ou la preuve de paiement par WhatsApp, puis le code client est créé dans `/admin`. Cette approche ne nécessite aucune clé API et n’entraîne pas de frais d’intégration.

## Options possibles

| Option | Moyens concernés | Fonctionnement | Coût et complexité | Recommandation |
|---|---|---|---|---|
| Activation manuelle | Wave, Moov Money, MTN Money | Paiement vers les comptes existants, vérification humaine, création du code dans Admin | Faible ; pas d’API | À utiliser maintenant |
| API Wave directe | Wave | Création d’une session Checkout côté serveur, confirmation du statut, activation après paiement confirmé | Compte Wave Business, clé secrète, éventuels frais opérateur | Possible si Wave devient le moyen principal |
| Agrégateur multi-wallet | Selon disponibilité contractuelle : Wave, Moov, MTN et autres | Un seul checkout et une seule logique de confirmation | Compte marchand, validation KYC, frais par transaction et dépendance au prestataire | À comparer avant choix |
| Liens de paiement semi-automatiques | Selon le prestataire | Lien préconfiguré envoyé au client, vérification manuelle ou callback si disponible | Mise en place intermédiaire | Bon compromis si l’API complète est trop lourde |

La documentation officielle Wave décrit un Checkout API avec des sessions de paiement et des endpoints de consultation ; elle précise que la clé est liée à un portefeuille professionnel et doit rester exclusivement côté serveur. Orange est volontairement exclu du périmètre actuel. Les capacités, frais et conditions de Moov Money et MTN Money doivent être confirmés auprès de leurs offres marchandes ou d’un agrégateur avant toute intégration.

## Automatisation recommandée par étapes

1. Le client choisit une offre et renseigne son nom, son téléphone et son e-mail facultatif.
2. L’application crée une demande de paiement avec montant fixe, forfait, référence unique et statut `pending`.
3. Le client paie par le moyen disponible.
4. Le serveur reçoit une confirmation vérifiable ou effectue une vérification contrôlée ; il ne doit jamais activer un accès sur la seule base d’une capture d’écran.
5. Après confirmation, l’application crée ou renouvelle le code client, enregistre la transaction et affiche la date d’expiration.
6. Une tâche périodique signale les codes qui expirent bientôt et les quotas faibles. Aucun message ne doit être envoyé automatiquement sans validation du canal et du consentement commercial.

## Garde-fous

Le montant doit être comparé au forfait demandé, la référence ne doit pas être réutilisable, les callbacks doivent être authentifiés, les clés doivent rester dans les variables secrètes du serveur et toute activation doit être idempotente. Le parcours manuel doit rester disponible en cas d’indisponibilité du prestataire.

## Sources consultées

- Orange Business Côte d’Ivoire, page API Orange Money : https://business.orange.ci/fr/orange-money/api-orange-money.html
- Wave, Checkout API : https://docs.wave.com/checkout
- Wave, Business APIs : https://docs.wave.com/business
- MTN MoMo API : https://momo.mtn.com/api-fr/
