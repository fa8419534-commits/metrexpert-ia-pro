# Checklist avant publication — MÉTREXPERT IA PRO

## Conclusion

MÉTREXPERT IA PRO est techniquement prêt pour un **pilote limité**, mais je recommande de ne pas partager largement le lien avant les vérifications manuelles listées ci-dessous. La base actuelle est solide : 81 tests réussis, TypeScript et build validés, quotas, code Admin séparé, essai gratuit, consentement, désinscription, paiements manuels et exports professionnels.

## Points obligatoires avant une première utilisation commerciale

| Point | État | Action attendue |
|---|---|---|
| Code Admin et code partagé | Prêt | Vérifier que les valeurs de production sont différentes et non exposées dans le frontend. |
| Coûts IA et quotas | Prêt avec limites | Conserver 5 générations/heure et 50 générations/jour ; faire un premier pilote avec peu de clients. |
| Paiement | Manuel | Vérifier un paiement Wave, Moov Money ou MTN Money, puis confirmer manuellement dans Admin. |
| Excel Desktop | À vérifier manuellement | Ouvrir un fichier réel dans Microsoft Excel Desktop, recalculer, contrôler les formules, images, totaux et impression. |
| Données personnelles | Partiellement prêt | Ajouter une durée de conservation opérationnelle et une procédure de suppression des contacts. |
| Périmètre du métré | À confirmer | Ne jamais présenter un calcul partiel comme un DQE complet ; faire confirmer lots inclus et exclus. |
| Support client | À préparer | Afficher clairement le numéro WhatsApp et le délai normal de réponse. |

## Points recommandés avant une diffusion plus large

| Point | Risque | Recommandation |
|---|---|---|
| Dépendance `uuid` | Avis moderate transitif via ExcelJS | Tester une version ExcelJS compatible ou documenter l’acceptation temporaire du risque. |
| Bundle frontend | Environ 1,38 Mo avant gzip | Faire du code-splitting sur Admin et les modules rares. |
| Transport base64 | Requêtes lourdes avec gros plans/images | Passer progressivement par le stockage objet et des identifiants temporaires. |
| Historique Admin | Suivi commercial limité | Ajouter un journal de renouvellements, de confirmations et de relances. |
| Sauvegarde | Données de production importantes | Vérifier la stratégie de sauvegarde et de restauration de la base avant acquisition de plusieurs clients. |

## Parcours pilote à exécuter

Créer trois projets distincts : un projet déterministe, un projet avec données manquantes et un projet avec fichier joint. Vérifier les hypothèses, les lots exclus, le contrôle géométrique et le téléchargement Excel. Tester ensuite un essai gratuit, une demande de paiement, une confirmation Admin, l’activation du code, un renouvellement et une désinscription.

Le parcours Admin doit être testé sur ordinateur et mobile : ouverture verrouillée, message de vérification, déverrouillage, bouton de rechargement, filtres de paiement, filtres d’expiration, copie du code et ouverture WhatsApp sans envoi automatique.

## Procédure de publication

Le projet dispose d’un checkpoint stable. Après la dernière vérification manuelle, il faudra créer ou sélectionner le checkpoint final dans l’interface de gestion, puis utiliser le bouton **Publier**. La publication doit être effectuée par le propriétaire dans l’interface ; aucune publication automatique ne doit être lancée depuis le code.

Après publication, tester immédiatement `/`, `/etude` et `/admin` avec les accès de production. Ne pas transmettre le code Admin à un client. Commencer avec un pilote limité et vérifier quotidiennement les quotas, erreurs et paiements pendant les premières utilisations.

## Décision pratique

La meilleure décision est de publier pour un **test encadré avec un à trois clients**, après validation Excel Desktop et vérification des secrets de production. La réduction du bundle, le traitement de `uuid` et l’automatisation des paiements peuvent attendre tant qu’ils ne bloquent pas le pilote et qu’aucun service de paiement externe n’est activé.
