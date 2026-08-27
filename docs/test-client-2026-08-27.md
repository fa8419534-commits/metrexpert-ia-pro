# Test navigateur client — 27/08/2026

## Périmètre

Test manuel de l’accueil et de l’espace d’étude sur l’URL de prévisualisation, avec contrôle des états visibles, de la checklist et des requêtes réseau. Aucune communication externe, aucun paiement et aucune donnée de production n’ont été modifiés.

## Constats initiaux

L’accueil se charge correctement après un état transitoire « Chargement de l’espace… ». Les appels à l’action sont visibles : tester l’espace, commencer avec l’exemple et ouvrir l’étude. Le bouton d’exemple est présent.

L’espace d’étude se charge correctement et affiche le cartouche technique, le guide en quatre repères, la checklist, les dimensions explicites, les coordonnées client optionnelles, le dépôt de fichier et l’aperçu du livrable.

La session navigateur utilisée possède déjà un accès partagé déverrouillé (`accessType=shared`) ; les champs d’essai gratuit ne sont donc pas visibles dans ce parcours. Une validation totalement vierge nécessite une session navigateur neuve ou la suppression préalable du cookie d’accès, ce qui n’a pas été exécuté pour ne pas perturber la session persistante de l’utilisateur.

Les requêtes observées retournent HTTP 200 et aucun message d’erreur JavaScript n’a été constaté dans les extraits consultés. Le compteur affichait 0/50 pour le quota global quotidien et 5/5 pour le quota horaire au début du parcours.

## Limite de ce rapport

Le classeur n’a pas encore été généré dans cette étape : une génération consomme un quota et nécessite l’utilisation d’un accès ou d’un essai. La génération contrôlée et l’inspection OOXML du fichier restent à effectuer avec une autorisation explicite et un jeu de données fictif.


## Génération de test

Une description fictive complète a été saisie sans fichier joint. La checklist est passée à 4/4 et le bouton de génération a été activé. Le premier clic n’a pas déclenché de requête visible ; après une nouvelle capture et un second clic, le traitement a bien démarré et a affiché la progression « Étape 1/3 — Lecture de la description et du plan… ».

Après environ 20 secondes, la génération s’est arrêtée avec le message utilisateur : « La réponse de l’IA n’est pas un JSON valide. » L’aperçu est resté vide et aucun fichier Excel n’a été disponible au téléchargement. Le compteur visible est resté à 5/5 générations horaires et 0/50 générations quotidiennes dans les requêtes observées ; l’échec n’a donc pas consommé le quota dans ce test.

La requête `estimate.generate` a bien été envoyée sans fichier joint, avec la description et `file: null`. La réponse HTTP est 400, code tRPC `BAD_REQUEST`, avec une erreur serveur localisée à `server/routers.ts:368` : « La réponse de l’IA n’est pas un JSON valide. » Le réseau n’indique pas un timeout ni une erreur de validation du formulaire.

## Défaut bloquant P0

Le parcours client ne produit actuellement aucun classeur lorsque l’IA renvoie une réponse qui échoue au parsing JSON. Comme aucun fichier n’est généré, les feuilles, formules, totaux, hypothèses et formats Excel ne peuvent pas encore être inspectés. Le défaut reproduit le problème historique de parsing JSON ; il faut examiner la réponse brute capturée côté serveur et la requête LLM correspondante avant de corriger.

## Points positifs constatés

L’accueil et l’espace d’étude se chargent. Le guide progresse de 1/4 à 2/4 avec « Suivant ». La checklist détecte correctement la description remplie. Les états de génération sont visibles, le message d’échec est compréhensible et le bouton permet de réessayer. Les requêtes de statut observées retournent HTTP 200.

## Points à corriger ou à revalider

1. P0 — corriger la cause réelle du parsing JSON et retester une génération sans fichier.
2. P1 — vérifier pourquoi le premier clic de génération n’a pas produit de requête visible ; ce comportement peut venir de l’état de capture, mais doit être reproduit.
3. P1 — après correction, générer et télécharger un classeur pour contrôler toutes les feuilles et l’OOXML.
4. P1 — refaire le test avec un PDF ou une image afin d’isoler le chemin fichier joint.
5. P2 — refaire le parcours dans une session totalement neuve pour tester réellement l’essai gratuit, car la session actuelle est déverrouillée par l’accès partagé.
