# Plan d’action avant le test pilote n°2

## 1. Diagnostic établi

Le pilote n°1 a validé le formulaire, le consentement, la checklist et le lancement sécurisé, mais la génération a échoué après l’appel IA avec le message « Le JSON renvoyé par l’IA ne respecte pas le format attendu. » Le scénario ne comportait aucun fichier joint. L’échec se situe donc après ou pendant la réponse du fournisseur IA, et non dans l’upload.

Le pipeline actuel est : réservation des quotas → réservation de l’essai → appel `invokeLLM` → extraction de `choices[0].message.content` → nettoyage avec `parseJsonObjectFromLLM` → `JSON.parse` → validation Zod avec `validateEstimate` → génération du classeur. Le message visible ne permet pas encore de distinguer une réponse non JSON d’un JSON valide mais incomplet.

## 2. Correctifs JSON prioritaires

### 2.1 Ajouter une corrélation complète par requête

Créer un `requestId` serveur distinct de la clé d’idempotence et l’ajouter à tous les logs de la génération. Ne jamais journaliser la clé API, les cookies, les images base64 ou l’intégralité de données personnelles.

Pour chaque tentative, journaliser uniquement : le `requestId`, le modèle exact, `max_tokens`, la présence d’un fichier, la taille de la description, la taille de la réponse, le type de contenu reçu, le motif de fin, un hash de la réponse et des extraits tronqués strictement nécessaires au diagnostic.

### 2.2 Séparer les trois erreurs techniques

Le serveur doit distinguer explicitement :

| Étape | Erreur à journaliser | Message utilisateur |
|---|---|---|
| Appel fournisseur | HTTP, timeout, corps d’erreur | « Le service d’analyse est momentanément indisponible. » |
| Parsing | Aucun objet JSON complet, JSON malformé, réponse vide | « La réponse de l’IA n’a pas pu être lue. » |
| Validation | Chemin Zod exact, propriété absente ou mauvais type | « La réponse de l’IA est incomplète ; aucune génération n’a été consommée. » |

Le détail technique doit rester dans les logs. Le client peut recevoir le `requestId` afin de faciliter le support, sans recevoir le prompt ou la réponse brute contenant potentiellement des données sensibles.

### 2.3 Renforcer l’extraction de contenu

Vérifier les variantes possibles de `message.content` : chaîne, tableau de blocs texte, objet inattendu, réponse vide et éventuelle réponse de refus. Si le fournisseur renvoie un objet JSON déjà décodé, le traiter sans le convertir abusivement en chaîne. Si le contenu est une chaîne, conserver le nettoyage actuel mais ajouter des tests pour : fences Markdown, texte avant/après, objet imbriqué, chaîne contenant des accolades, JSON vide, réponse tronquée et tableau racine.

### 2.4 Réduire le risque de validation trop stricte

Le `response_format` impose actuellement plusieurs propriétés obligatoires, notamment `factor`, `unitPrice` et `notes` pour chaque mesure, ainsi que toutes les propriétés de géométrie. Conserver les champs réellement indispensables, mais prévoir une normalisation serveur documentée pour les champs facultatifs : `factor = 1`, `unitPrice = 0` si le prix est inconnu, et une note explicite indiquant « prix à confirmer ».

Le schéma transmis au fournisseur, le type TypeScript, la validation Zod et la structure utilisée par `buildEstimateWorkbook` doivent être générés ou vérifiés depuis la même définition afin d’éviter un décalage entre production et tests. Ajouter un test contractuel qui compare les propriétés `required` du JSON Schema avec les champs effectivement acceptés par Zod.

### 2.5 Vérifier le contrat fournisseur

Confirmer dans les logs de production que `response_format` est réellement accepté par le modèle `claude-sonnet-4-6` via la passerelle utilisée. Si le fournisseur ne garantit pas ce format pour ce modèle, utiliser le mode JSON officiellement supporté par la passerelle ou un appel structuré compatible, plutôt que de supposer que le schéma est appliqué. Le prompt reste nécessaire mais ne doit pas être l’unique protection.

## 3. Vérification du quota après l’échec

### 3.1 Ce que le code actuel est censé faire

Dans le `catch` du routeur, l’ordre prévu est : `releaseFreeTrialReservation`, `releaseClientMonthlyQuota`, puis `releaseGenerationQuota`. Pour un échec de parsing ou de validation, la réservation globale et la réservation d’essai doivent donc être libérées avant de renvoyer l’erreur.

La réservation d’essai est actuellement matérialisée par une ligne dans `free_trial_contacts`, puis supprimée par `releaseFreeTrialReservation`. Cela signifie qu’un essai échoué ne doit plus apparaître comme consommé, mais qu’il n’existe pas non plus de trace durable de cette tentative dans cette table. Cette absence de trace est acceptable pour l’unicité de l’essai, mais insuffisante pour l’audit commercial et le support.

### 3.2 Contrôle pratique sans modifier les données

Après un échec contrôlé avec un contact de test unique, vérifier dans `/admin` que le contact d’essai n’est pas listé comme consommé. Vérifier ensuite `security.status()` ou l’indicateur admin : le compteur horaire et le compteur journalier doivent être revenus à leur valeur précédant la tentative. Ne pas relancer avec le même contact avant ce contrôle, car le résultat attendu dépend de la restitution.

Pour une vérification base de données autorisée, contrôler les tables suivantes avec l’heure UTC de la tentative :

| Table | Contrôle | Résultat attendu après échec |
|---|---|---|
| `free_trial_contacts` | Rechercher le téléphone/e-mail normalisé ou son hash | aucune ligne conservée pour l’essai échoué |
| `generation_windows` | Rechercher les fenêtres `hour:<UTC-hour>:<identity>` et `day:<UTC-date>:global` | les compteurs ne doivent pas inclure la tentative échouée |
| `client_access_codes` | seulement pour un test code client | `monthlyUsed` inchangé après échec |

L’identité utilisée par la limite globale dépend du contexte : utilisateur connecté ou adresse IP. Il faut donc récupérer le `requestId`, l’heure UTC et l’identité anonymisée dans les logs plutôt que deviner la clé.

### 3.3 Amélioration recommandée avant le pilote n°2

Ajouter une table ou un journal d’audit `generation_attempts` contenant : `requestId`, date UTC, type d’accès, hash du contact, statut `started/succeeded/failed`, étape d’échec, code d’erreur interne et durée. Ce journal ne doit pas compter comme quota et ne doit pas conserver la réponse brute de l’IA. Il permettra de prouver qu’une erreur a été remboursée sans réintroduire le contact dans la liste commerciale des essais consommés.

## 4. Tests obligatoires

| Test | Attendu |
|---|---|
| Réponse JSON complète valide | Excel généré, quota consommé une fois |
| Réponse avec texte et fences | nettoyage puis succès |
| Réponse JSON valide mais champ obligatoire absent | erreur de validation détaillée dans les logs, quota remboursé |
| Réponse non JSON | erreur de parsing détaillée, quota remboursé |
| Réponse vide ou refus | erreur contrôlée, quota remboursé |
| Timeout fournisseur | erreur réseau/timeout contrôlée, quota remboursé |
| Double clic même idempotency key | une seule requête fournisseur et une seule consommation |
| Échec après réservation client | quota mensuel client inchangé |
| Échec après réservation essai | contact réutilisable pour un nouvel essai contrôlé |
| Succès final | contact conservé une seule fois et quota consommé une fois |

Ajouter au minimum un test d’intégration du routeur qui mocke `invokeLLM` avec une réponse malformée, puis vérifie simultanément : l’erreur attendue, l’absence de classeur, la restitution du quota global et la possibilité de réessayer avec le même contact. Les tests actuels couvrent la fonction de libération isolée, mais pas encore toute la chaîne `estimate.generate` en échec.

## 5. Procédure de validation du pilote n°2

Le pilote n°2 doit utiliser une nouvelle identité d’essai, un scénario sans fichier puis, séparément, un scénario avec un petit plan image non sensible. Le premier scénario doit être celui-ci : maison plain-pied 90 m², emprise 10 × 9 m, hauteur 2,80 m, une porte de 2,10 m² et quatre fenêtres de 1,44 m². Le texte doit demander explicitement les hypothèses et les lots non traités.

Avant le lancement, relever la valeur du quota affichée et noter le `requestId` de la tentative. Pendant la génération, vérifier l’idempotence, les étapes de progression et l’absence de double bouton actif. Après succès, contrôler l’aperçu web, les feuilles `Couverture`, `Hypothèses`, `Contrôles`, `Métré` et `DQE`, les unités, les formules, le total et la mention de version d’essai.

Enfin, télécharger le classeur, vérifier qu’il s’ouvre dans Excel Desktop si cet environnement est disponible, puis contrôler séparément le PDF. Le test ne sera déclaré réussi que si le fichier est produit, si les quantités sont cohérentes avec les dimensions explicites, si le quota a diminué exactement d’une unité et si une seconde tentative avec le même contact est refusée comme essai déjà utilisé.

## 6. Critère de décision

Ne pas lancer le pilote n°2 sur la version publiée tant que les logs ne permettent pas d’identifier précisément la différence entre parsing et validation, et tant qu’un test automatisé ne prouve pas la restitution du quota lors de ces deux erreurs. Une fois ces preuves obtenues, publier le correctif, exécuter le scénario sans fichier, puis seulement ensuite tester le scénario avec fichier joint.
