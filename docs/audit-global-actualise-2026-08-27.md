# Audit global actualisé — MÉTREXPERT IA PRO

**Date : 27 août 2026**

## Conclusion exécutive

L’application est techniquement exploitable pour un **pilote limité**, avec surveillance manuelle. Les parcours publics, les quotas, l’essai gratuit, le paiement manuel, l’espace Admin, la génération Excel/PDF, la rétention des contacts et les contrôles de sécurité sont présents. La validation automatisée actuelle est propre : **27 fichiers de test, 97 tests réussis, TypeScript réussi et build de production réussi**.

Je ne recommande toutefois pas une diffusion commerciale large avant trois vérifications opérationnelles : l’ouverture du classeur dans Microsoft Excel Desktop, la confirmation réelle des comptes Mobile Money et la mise en place d’une sauvegarde effectivement exécutée. L’audit des dépendances signale encore une vulnérabilité **moderate** de `uuid` transitive via `exceljs`; le patch local existe dans le projet mais n’est pas reconnu comme résolvant par `pnpm audit`.

## Classement des points à traiter

| Priorité | Constat vérifié | Impact | Action recommandée |
|---|---|---|---|
| **P0 — avant diffusion large** | `pnpm audit --prod` signale encore `uuid` vulnérable dans le chemin `. > exceljs > uuid`, version corrigée annoncée `>=11.1.1`. | Risque de sécurité transitive, même si l’usage applicatif n’expose pas directement la fonction concernée. | Remplacer ou mettre à jour la chaîne ExcelJS/uuid, ou obtenir une résolution pnpm réellement reconnue par l’audit. Ne pas considérer le patch local comme définitivement validé tant que l’audit reste positif. |
| **P0 — avant vrais paiements** | Les numéros affichés sont maintenant `Wave 0151610512 — SIDIBE DAOUDA`, `Moov Money 0151610512 — SIDIBE DAOUDA` et `MTN Money 0555067892 — ISSIA`. | Un numéro ou un titulaire incorrect peut envoyer l’argent vers le mauvais compte. | Faire un transfert de test de faible montant, vérifier le nom retourné par chaque opérateur et confirmer que le numéro Wave et le numéro Moov peuvent bien être identiques. |
| **P0 — avant diffusion large** | La sauvegarde affichée dans Admin est une confirmation manuelle d’une sauvegarde externe ; elle ne déclenche pas elle-même un backup automatique. | Perte possible des codes clients, paiements et contacts en cas d’incident. | Exécuter la procédure de sauvegarde documentée, conserver plusieurs copies protégées et tester une restauration sur un environnement séparé. |
| **P1 — après publication** | La purge automatique est codée, authentifiée et historisée, mais sa tâche quotidienne doit être activée dans l’environnement publié. | Les contacts échus ne seront pas supprimés automatiquement tant que la tâche n’est pas créée et vérifiée. | Créer la tâche Heartbeat après publication, lancer un test immédiat, puis vérifier l’historique Admin et le statut `success`. |
| **P1 — avant facturation régulière** | Le classeur est contrôlé structurellement et par impression simulée, mais Microsoft Excel Desktop n’est pas disponible dans le sandbox. | Une différence de recalcul, d’image ou d’impression peut subsister sur le logiciel cible. | Ouvrir un classeur réel dans Excel Desktop, forcer le recalcul, contrôler toutes les feuilles, les images et l’impression PDF. |
| **P2 — amélioration** | Les coordonnées de paiement sont des constantes frontend. | Une modification de numéro nécessite une modification et une nouvelle publication du code. | Ajouter plus tard une configuration Admin protégée, avec historique de modification et confirmation avant affichage public. |
| **P2 — amélioration** | Le paiement reste manuel, sans API Wave, Moov Money ou MTN Money. | La confirmation dépend d’une vérification humaine et ne peut pas être instantanée. | Conserver ce fonctionnement au pilote ; automatiser uniquement après compte marchand, contrat opérateur et secrets API confirmés. |
| **P2 — performance** | Le build conserve un chunk partagé d’environ 627,87 kB après minification. | Premier chargement potentiellement plus lent sur réseau mobile. | Poursuivre le découpage des dépendances communes si les mesures réelles sur mobile le justifient. |

## Vérifications effectuées

La recherche de code confirme la présence des trois coordonnées de paiement dans le panneau public, des boutons de copie et du récapitulatif dynamique du forfait. Un test UI dédié couvre l’affichage des numéros, les titulaires, le bouton de copie et l’avertissement interdisant de communiquer le PIN. Les tests ciblés et la suite complète passent.

Les variables de production contrôlées sans afficher leurs valeurs sont présentes : `METREXPERT_ACCESS_CODE`, `METREXPERT_ADMIN_ACCESS_CODE`, `JWT_SECRET`, `BUILT_IN_FORGE_API_KEY` et `DATABASE_URL`. Les codes d’accès général et Admin sont donc configurés dans l’environnement courant ; leurs valeurs doivent néanmoins être vérifiées dans la gestion des secrets avant publication.

Les captures responsive de l’accueil et de l’espace de génération ne montrent pas de débordement bloquant sur mobile. Le parcours Admin reste protégé par son code séparé. Les quotas et les limites financières déjà en place sont maintenus : **5 générations par heure et 50 générations par jour**, en plus des quotas mensuels des codes clients.

## Ce qui n’est pas un manque bloquant

L’absence d’Orange Money n’est pas une anomalie : le périmètre retenu utilise Wave, Moov Money et MTN Money. L’absence de paiement automatique est cohérente avec la situation actuelle, puisque les comptes marchands et les clés API ne sont pas disponibles. Les messages WhatsApp sont préparés pour un envoi manuel et ne partent pas automatiquement, ce qui évite un contact non autorisé.

## Séquence recommandée avant ouverture

Commencer par confirmer les trois comptes de réception avec un test réel et documenter le nom exact de chaque bénéficiaire. Ouvrir ensuite le classeur dans Microsoft Excel Desktop et contrôler les formules, images, feuilles et impressions. Exécuter une sauvegarde réelle puis restaurer une copie de test. Après publication, créer et tester la tâche quotidienne de purge. Enfin, réaliser un parcours complet avec un client pilote : choix du forfait, transfert, référence, validation Admin, réception du code, génération, téléchargement et renouvellement.

> **Décision recommandée :** publier uniquement pour un pilote encadré après les vérifications P0 ; ne pas diffuser largement tant que `uuid`, les comptes Mobile Money, la sauvegarde réelle et le contrôle Excel Desktop ne sont pas clôturés.
